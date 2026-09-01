from odoo import fields, models


class ResUsers(models.Model):
    _inherit = "res.users"

    erp_branch_ids = fields.Many2many("elevate.erp.branch", string="Allowed Branches")
    erp_default_branch_id = fields.Many2one("elevate.erp.branch", string="Default Branch")
