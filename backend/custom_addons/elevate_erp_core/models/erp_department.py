from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class ErpDepartment(models.Model):
    _name = "elevate.erp.department"
    _description = "ERP Department"
    _order = "company_id, name"
    _check_company_auto = True

    name = fields.Char(required=True, index=True)
    code = fields.Char(required=True, index=True)
    active = fields.Boolean(default=True)
    company_id = fields.Many2one("res.company", required=True, default=lambda self: self.env.company, index=True)
    branch_id = fields.Many2one("elevate.erp.branch", check_company=True)
    manager_id = fields.Many2one("res.users", check_company=True)
    email = fields.Char()
    note = fields.Text()

    _sql_constraints = [
        ("department_company_code_uniq", "unique(company_id, code)", "A department code must be unique per company."),
    ]

    @api.constrains("branch_id", "company_id")
    def _check_branch_company(self):
        for department in self:
            if department.branch_id and department.branch_id.company_id != department.company_id:
                raise ValidationError(_("The department branch must belong to the selected company."))

    @api.model_create_multi
    def create(self, values_list):
        records = super().create(values_list)
        for record in records:
            self.env["elevate.erp.audit.log"].log_event(record, "created", "Department created")
        return records

    def write(self, values):
        result = super().write(values)
        for record in self:
            self.env["elevate.erp.audit.log"].log_event(record, "updated", "Department configuration updated")
        return result
