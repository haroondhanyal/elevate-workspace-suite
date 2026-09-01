from odoo import api, fields, models


class ErpAuditLog(models.Model):
    _name = "elevate.erp.audit.log"
    _description = "ERP Audit Log"
    _order = "create_date desc, id desc"
    _rec_name = "display_name"

    display_name = fields.Char(compute="_compute_display_name")
    event_type = fields.Selection([
        ("created", "Created"), ("updated", "Updated"), ("submitted", "Submitted"),
        ("approved", "Approved"), ("rejected", "Rejected"),
    ], required=True)
    model_name = fields.Char(required=True, index=True)
    record_id = fields.Integer(required=True, index=True)
    detail = fields.Text(required=True)
    user_id = fields.Many2one("res.users", required=True, default=lambda self: self.env.user, readonly=True)
    company_id = fields.Many2one("res.company", readonly=True)
    branch_id = fields.Many2one("elevate.erp.branch", readonly=True)

    @api.depends("model_name", "record_id", "event_type")
    def _compute_display_name(self):
        for record in self:
            record.display_name = "%s #%s — %s" % (record.model_name, record.record_id, record.event_type)

    @api.model
    def log_event(self, record, event_type, detail):
        return self.sudo().create({
            "event_type": event_type,
            "model_name": record._name,
            "record_id": record.id,
            "detail": detail,
            "user_id": self.env.user.id,
            "company_id": record.company_id.id if "company_id" in record._fields and record.company_id else self.env.company.id,
            "branch_id": record.branch_id.id if "branch_id" in record._fields and record.branch_id else False,
        })
