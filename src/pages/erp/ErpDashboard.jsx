import { useMemo, useState } from 'react'
import './ErpDashboard.css'
import ThemeToggle from '../../components/ThemeToggle'

const modules = [
  ['◎', 'CRM', '38 open opportunities', 'violet'],
  ['▣', 'Sales', '12 open orders', 'blue'],
  ['◫', 'Purchases', '9 approvals waiting', 'amber'],
  ['◫', 'Inventory', '24 products low', 'amber'],
  ['◉', 'Finance', '4 invoices due', 'violet'],
  ['♙', 'Human resources', '3 leave requests', 'green'],
  ['✓', 'Approvals', '11 decisions waiting', 'blue'],
  ['☏', 'Customer support', '18 open tickets', 'blue'],
]

const orders = [
  ['SO-1048', 'Apex Technologies', 'Today, 10:42 AM', '$4,800.00', 'Paid'],
  ['SO-1047', 'Orbit Solutions', 'Today, 09:15 AM', '$2,340.00', 'Pending'],
  ['SO-1046', 'Nova Retail', 'Yesterday', '$1,280.00', 'Processing'],
  ['SO-1045', 'Vertex Labs', 'Yesterday', '$6,720.00', 'Paid'],
]

function ErpDashboard() {
  const [active, setActive] = useState('Overview')
  const [notice, setNotice] = useState('')
  const today = useMemo(() => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()), [])
  const go = (item) => { const path = ({ CRM: '/erp/crm', Sales: '/erp/sales', Purchases: '/erp/purchase', Inventory: '/erp/inventory', Finance: '/erp/finance', 'Human resources': '/erp/hr', Approvals: '/erp/approvals', 'Customer support': '/erp/support' })[item]; if (path) window.location.href = path; else { setActive(item); setNotice(`${item} module is ready to configure.`) } }

  return <main className="erp-app">
    <style>{`.erp-app-link{display:grid;grid-template-columns:28px 1fr;column-gap:8px;align-items:center;margin:3px 0;padding:8px;border:1px solid transparent;border-radius:8px;color:#536078;text-decoration:none}.erp-app-link:hover,.erp-app-link.active{border-color:#dce5ff;background:#f4f7ff}.erp-app-link .erp-app-icon{display:grid;grid-row:span 2;place-items:center;width:27px;height:27px;border-radius:7px;color:#fff;background:#4169e1;font:800 14px Manrope,sans-serif}.erp-app-link.jira .erp-app-icon{background:#76519d}.erp-app-link.testrail .erp-app-icon{background:#d84e58}.erp-app-link b{font-size:10px}.erp-app-link small{margin-top:1px;color:#8d98aa;font-size:8px}`}</style>
    <aside className="erp-sidebar">
      <a className="erp-brand" href="/erp"><span>e</span><b>Elevate</b><small>ERP</small></a>
      <button className="erp-company"><i>RH</i><span><b>RH98 Group</b><small>Business workspace</small></span><em>⌄</em></button>
      <nav className="erp-nav">
        <p>Applications</p>
        <a className="erp-app-link" href="/workspace"><span className="erp-app-icon">✦</span><b>Command Center</b><small>Cross-team overview</small></a>
        <a className="erp-app-link active" href="/erp"><span className="erp-app-icon">e</span><b>ERP System</b><small>Business operations</small></a>
        <a className="erp-app-link jira" href="/jira"><span className="erp-app-icon">J</span><b>Jira</b><small>Projects & sprints</small></a>
        <a className="erp-app-link testrail" href="/testrail"><span className="erp-app-icon">T</span><b>TestRail</b><small>Quality & testing</small></a>
        <p>Workspace</p>
        {['Overview', 'Analytics'].map(item => <button className={active === item ? 'active' : ''} onClick={() => go(item)} key={item}><span>{item === 'Overview' ? '▦' : '◌'}</span>{item}</button>)}
        <p>Management</p>
        {['CRM', 'Sales', 'Purchases', 'Inventory', 'Finance', 'Human resources', 'Approvals', 'Customer support'].map(item => <button className={active === item ? 'active' : ''} onClick={() => go(item)} key={item}><span>{({ CRM: '◎', Sales: '▣', Purchases: '◫', Inventory: '▤', Finance: '◉', 'Human resources': '♙', Approvals: '✓', 'Customer support': '☏' })[item]}</span>{item}{(item === 'Human resources' || item === 'Approvals') && <i>{item === 'Approvals' ? '11' : '3'}</i>}</button>)}
        <p>System</p>
        <button onClick={() => go('Team members')}><span>♧</span>Team members</button>
        <button onClick={() => go('Settings')}><span>⚙</span>Settings</button>
      </nav>
      <div className="erp-sidebar-foot"><a href="/help">? Help & support</a><div><strong>RH</strong><span><b>Raja Haroon</b><small>Administrator</small></span><button aria-label="Account menu">⋮</button></div></div>
    </aside>
    <section className="erp-main">
      <header className="erp-topbar"><button className="erp-mobile-menu">☰</button><div className="erp-search">⌕<input placeholder="Search anything..." /></div><div className="erp-top-actions"><button aria-label="Notifications">♢<i /></button><button className="erp-create" onClick={() => setNotice('New record action opened.')}>＋ Create new</button><ThemeToggle /><button className="erp-avatar">RH</button></div></header>
      <div className="erp-content">
        <div className="erp-heading"><div><p>{today}</p><h1>Good morning, Raja <span>👋</span></h1><small>Here’s what’s happening across your business today.</small></div><button onClick={() => setNotice('Dashboard report is being prepared.')}>⇩ Export report</button></div>
        {notice && <div className="erp-notice" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
        <section className="erp-stats">
          <Stat icon="↗" label="Total revenue" value="$84,240" change="12.5%" tone="blue" />
          <Stat icon="▣" label="Total orders" value="1,284" change="8.2%" tone="violet" />
          <Stat icon="♙" label="Active employees" value="48" change="3 new" tone="green" />
          <Stat icon="▤" label="Pending invoices" value="$12,560" change="4 overdue" tone="amber" down />
        </section>
        <section className="erp-grid">
          <article className="erp-panel erp-performance"><header><div><h2>Revenue overview</h2><p>Business performance this year</p></div><select aria-label="Revenue range"><option>Last 12 months</option><option>This month</option></select></header><div className="erp-chart"><div className="chart-labels"><span>$20k</span><span>$15k</span><span>$10k</span><span>$5k</span><span>$0</span></div><div className="chart-area"><i className="chart-line" /><div className="chart-bars">{[34, 47, 39, 61, 53, 68, 74, 64, 88, 78, 91, 80].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div><div className="chart-months">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(x => <span key={x}>{x}</span>)}</div></div></div><footer><span><i className="legend current" />This year <b>$84,240</b></span><span><i className="legend previous" />Last year <b>$68,420</b></span></footer></article>
          <article className="erp-panel erp-tasks"><header><div><h2>Today’s priorities</h2><p>Keep your day on track</p></div><button onClick={() => go('Tasks')}>View all →</button></header>{[['Approve purchase order', 'Purchases · Due today', 'high'], ['Follow up with Apex Technologies', 'Sales · Due today', 'medium'], ['Review payroll draft', 'Finance · Due tomorrow', 'low']].map(([title, sub, tone]) => <label className="erp-task" key={title}><input type="checkbox" /><span><b>{title}</b><small>{sub}</small></span><i className={tone}>{tone}</i></label>)}<button className="erp-add-task" onClick={() => setNotice('Task creator opened.')}>＋ Add a task</button></article>
        </section>
        <section className="erp-module-grid">{modules.map(([icon, name, detail, tone]) => <button className="erp-module" key={name} onClick={() => go(name)}><span className={tone}>{icon}</span><div><b>{name}</b><small>{detail}</small></div><em>→</em></button>)}</section>
        <section className="erp-panel erp-orders"><header><div><h2>Recent sales orders</h2><p>Latest activity from your sales team</p></div><button onClick={() => go('Sales orders')}>View all orders →</button></header><div className="erp-table"><div className="erp-table-head"><span>ORDER</span><span>CUSTOMER</span><span>DATE</span><span>AMOUNT</span><span>STATUS</span></div>{orders.map(([order, customer, date, amount, status]) => <div className="erp-table-row" key={order}><b>{order}</b><span>{customer}</span><span>{date}</span><strong>{amount}</strong><i className={status.toLowerCase()}>{status}</i></div>)}</div></section>
      </div>
    </section>
  </main>
}

function Stat({ icon, label, value, change, tone, down }) { return <article className="erp-stat"><span className={tone}>{icon}</span><div><small>{label}</small><strong>{value}</strong><b className={down ? 'down' : ''}>{down ? '↓' : '↑'} {change}</b></div></article> }

export default ErpDashboard
