from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class ErpApprovalPolicy(models.Model):
    _name = "elevate.erp.approval.policy"
    _description = "ERP Approval Policy"
    _order = "sequence, id"
    _check_company_auto = True

    name = fields.Char(required=True)
    active = fields.Boolean(default=True)
    sequence = fields.Integer(default=10)
    request_type = fields.Selection([
        ("purchase", "Purchase Order"), ("sales_discount", "Sales Discount"),
        ("expense", "Expense"), ("leave", "Leave"), ("other", "Other"),
    ], required=True, default="other")
    company_id = fields.Many2one("res.company", required=True, default=lambda self: self.env.company)
    branch_id = fields.Many2one("elevate.erp.branch", check_company=True, help="Leave empty to apply to every branch in this company.")
    min_amount = fields.Monetary(required=True, default=0)
    max_amount = fields.Monetary(help="Leave empty for no upper limit.")
    currency_id = fields.Many2one(related="company_id.currency_id", readonly=True)
    approver_id = fields.Many2one("res.users", check_company=True, help="Specific user who approves matching requests.")
    approver_group_id = fields.Many2one("res.groups", string="Approver Group", help="Used when no individual approver is set.")

    @api.constrains("min_amount", "max_amount")
    def _check_amount_range(self):
        for policy in self:
            if policy.max_amount and policy.max_amount < policy.min_amount:
                raise ValidationError(_("The maximum amount must be greater than or equal to the minimum amount."))

    def get_approver(self):
        self.ensure_one()
        if self.approver_id and self.approver_id.active:
            return self.approver_id
        if self.approver_group_id:
            return self.approver_group_id.user_ids.filtered("active")[:1]
        return self.env["res.users"]

    @api.model
    def find_policy(self, request):
        policies = self.search([
            ("active", "=", True),
            ("request_type", "=", request.request_type),
            ("company_id", "=", request.company_id.id),
            ("min_amount", "<=", request.amount),
        ], order="sequence, id")
        return policies.filtered(lambda policy: (
            (not policy.branch_id or policy.branch_id == request.branch_id)
            and (not policy.max_amount or request.amount <= policy.max_amount)
        ))[:1]
