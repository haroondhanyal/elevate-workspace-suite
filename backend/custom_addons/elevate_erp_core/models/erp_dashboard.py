from odoo import api, fields, models


class ErpDashboard(models.Model):
    _name = "elevate.erp.dashboard"
    _description = "Elevate ERP Dashboard"

    name = fields.Char(required=True, default="Elevate ERP Operations Dashboard")
    company_id = fields.Many2one("res.company", required=True, default=lambda self: self.env.company)
    branch_count = fields.Integer(compute="_compute_metrics")
    department_count = fields.Integer(compute="_compute_metrics")
    warehouse_count = fields.Integer(compute="_compute_metrics")
    pending_approval_count = fields.Integer(compute="_compute_metrics")
    approved_this_month_count = fields.Integer(compute="_compute_metrics")

    def _compute_metrics(self):
        for dashboard in self:
            company_domain = [("company_id", "=", dashboard.company_id.id)]
            dashboard.branch_count = self.env["elevate.erp.branch"].search_count(company_domain)
            dashboard.department_count = self.env["elevate.erp.department"].search_count(company_domain)
            dashboard.warehouse_count = self.env["stock.warehouse"].search_count(company_domain)
            dashboard.pending_approval_count = self.env["elevate.erp.approval.request"].search_count(company_domain + [("state", "=", "submitted")])
            dashboard.approved_this_month_count = self.env["elevate.erp.approval.request"].search_count(company_domain + [("state", "=", "approved")])
