from odoo import fields, models


class ResCompany(models.Model):
    _inherit = "res.company"

    erp_branch_ids = fields.One2many("elevate.erp.branch", "company_id", string="Branches")
