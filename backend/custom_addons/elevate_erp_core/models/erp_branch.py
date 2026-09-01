from odoo import api, fields, models


class ErpBranch(models.Model):
    _name = "elevate.erp.branch"
    _description = "ERP Branch"
    _order = "company_id, name"
    _check_company_auto = True

    name = fields.Char(required=True, index=True)
    code = fields.Char(required=True, index=True)
    active = fields.Boolean(default=True)
    company_id = fields.Many2one("res.company", required=True, default=lambda self: self.env.company, index=True)
    partner_id = fields.Many2one("res.partner", string="Branch Address", check_company=True)
    manager_id = fields.Many2one("res.users", string="Branch Manager", check_company=True)
    warehouse_id = fields.Many2one("stock.warehouse", string="Default Warehouse", check_company=True)

    _sql_constraints = [
        ("branch_company_code_uniq", "unique(company_id, code)", "A branch code must be unique per company."),
    ]

    @api.model_create_multi
    def create(self, values_list):
        records = super().create(values_list)
        for record in records:
            self.env["elevate.erp.audit.log"].log_event(record, "created", "Branch created")
        return records

    def write(self, values):
        result = super().write(values)
        for record in self:
            self.env["elevate.erp.audit.log"].log_event(record, "updated", "Branch configuration updated")
        return result
