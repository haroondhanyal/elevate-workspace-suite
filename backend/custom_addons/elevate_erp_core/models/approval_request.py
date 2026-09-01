from odoo import _, api, fields, models
from odoo.exceptions import AccessError, ValidationError


class ErpApprovalRequest(models.Model):
    _name = "elevate.erp.approval.request"
    _description = "ERP Approval Request"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "create_date desc"
    _check_company_auto = True

    name = fields.Char(default="New", readonly=True, copy=False, tracking=True)
    request_type = fields.Selection([
        ("purchase", "Purchase Order"), ("sales_discount", "Sales Discount"),
        ("expense", "Expense"), ("leave", "Leave"), ("other", "Other"),
    ], required=True, default="other", tracking=True)
    requester_id = fields.Many2one("res.users", default=lambda self: self.env.user, required=True, readonly=True)
    company_id = fields.Many2one("res.company", default=lambda self: self.env.company, required=True, readonly=True)
    branch_id = fields.Many2one("elevate.erp.branch", check_company=True)
    amount = fields.Monetary(tracking=True)
    currency_id = fields.Many2one(related="company_id.currency_id")
    reference = fields.Char(required=True, tracking=True)
    justification = fields.Text(required=True)
    approver_id = fields.Many2one("res.users", tracking=True)
    state = fields.Selection([
        ("draft", "Draft"), ("submitted", "Submitted"), ("approved", "Approved"), ("rejected", "Rejected"), ("cancelled", "Cancelled"),
    ], default="draft", tracking=True)
    approved_by_id = fields.Many2one("res.users", readonly=True)
    decision_date = fields.Datetime(readonly=True)

    @api.model_create_multi
    def create(self, values_list):
        for values in values_list:
            if values.get("name", "New") == "New":
                values["name"] = self.env["ir.sequence"].next_by_code("elevate.erp.approval") or "New"
        return super().create(values_list)

    def action_submit(self):
        for record in self:
            if record.state != "draft":
                raise ValidationError(_("Only draft requests can be submitted."))
            if not record.approver_id:
                policy = self.env["elevate.erp.approval.policy"].find_policy(record)
                if not policy:
                    raise ValidationError(_("No active approval policy matches this request. Configure an approval policy first."))
                approver = policy.get_approver()
                if not approver:
                    raise ValidationError(_("The matching approval policy has no available approver."))
                record.approver_id = approver
            if record.approver_id == record.requester_id:
                raise ValidationError(_("A requester cannot approve their own request."))
            record.state = "submitted"
            record.activity_schedule("mail.mail_activity_data_todo", user_id=record.approver_id.id, summary=_("Approval required"))
            self.env["elevate.erp.audit.log"].log_event(record, "submitted", _("Submitted for approval to %s") % record.approver_id.display_name)

    def _check_approver(self):
        if self.env.user == self.requester_id:
            raise AccessError(_("Requesters cannot approve or reject their own requests."))
        if self.env.user != self.approver_id and not self.env.user.has_group("elevate_erp_core.group_erp_approval_manager"):
            raise AccessError(_("Only the assigned approver or an approval manager can make this decision."))

    def action_approve(self):
        for record in self:
            record._check_approver()
            if record.state != "submitted":
                raise ValidationError(_("Only submitted requests can be approved."))
            record.write({"state": "approved", "approved_by_id": self.env.user.id, "decision_date": fields.Datetime.now()})
            record.activity_ids.unlink()
            self.env["elevate.erp.audit.log"].log_event(record, "approved", _("Approved by %s") % self.env.user.display_name)

    def action_reject(self):
        for record in self:
            record._check_approver()
            if record.state != "submitted":
                raise ValidationError(_("Only submitted requests can be rejected."))
            record.write({"state": "rejected", "approved_by_id": self.env.user.id, "decision_date": fields.Datetime.now()})
            record.activity_ids.unlink()
            self.env["elevate.erp.audit.log"].log_event(record, "rejected", _("Rejected by %s") % self.env.user.display_name)
