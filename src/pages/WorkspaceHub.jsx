import { useEffect, useMemo, useState } from 'react'
import './WorkspaceHub.css'
import { downloadSalesReport, getDashboardSummary, getNotifications, getSession, listOrganizations, listSalesOrders, logoutCurrentSession, markAllNotificationsRead, searchWorkspace, selectOrganization, subscribeNotifications } from '../services/auth'

const commands = [
  ['Open ERP overview', '/erp', 'Business operations'],
  ['Open Jira sprint board', '/jira/board', 'Delivery'],
  ['Open TestRail run', '/testrail/cases', 'Quality'],
  ['Create a Jira project', '/jira/projects/new', 'Quick action'],
  ['Review requirement traceability', '/testrail/rtm', 'Quality'],
]

const activity = [
  ['Jira', 'WEB-184 moved to In review', '2 min ago', 'purple'],
  ['TestRail', 'Regression run: 86 passed, 14 failed', '18 min ago', 'red'],
  ['ERP', 'PO-2098 requires your approval', '42 min ago', 'blue'],
  ['Jira', 'Sprint 08 has 3 items at risk', '1 hr ago', 'amber'],
]

function WorkspaceHub() {
  const [open, setOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [summary, setSummary] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [salesRevenue, setSalesRevenue] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [organizations, setOrganizations] = useState([])
  const organizationId = getSession()?.organization_id
  const accountName = getSession()?.user?.full_name || 'Workspace member'
  const accountInitials = accountName.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()
  const matches = useMemo(() => commands.filter(([title, , meta]) => `${title} ${meta}`.toLowerCase().includes(query.toLowerCase())), [query])

  async function markAllRead() {
    try {
      await markAllNotificationsRead()
      setNotifications(current => current.map(item => ({ ...item, is_read: true })))
      setToast('Notifications marked as read.')
    } catch (error) { setToast(`Could not update notifications: ${error.message}`) }
  }

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true) }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    getDashboardSummary().then(setSummary).catch(() => null)
    listOrganizations().then(setOrganizations).catch(() => null)
    getNotifications().then(setNotifications).catch(() => null)
    listSalesOrders().then(orders => {
      if (orders) setSalesRevenue(orders.reduce((total, order) => total + Number(order.amount || 0), 0))
    }).catch(() => null)
    return subscribeNotifications((event) => {
      if (event.type === 'notification') {
        setNotifications(current => [{ ...event, id: `live-${Date.now()}`, is_read: false }, ...current])
        setToast(event.title)
      }
    })
  }, [])

  async function switchWorkspace(id) {
    if (!id || Number(id) === Number(organizationId)) return
    try { await selectOrganization(Number(id)); window.location.reload() }
    catch (error) { setToast(`Could not switch workspace: ${error.message}`) }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => searchWorkspace(query).then(setSearchResults).catch(() => setSearchResults([])), 180)
    return () => window.clearTimeout(timer)
  }, [query])

  return <main className="hub-app">
    <header className="hub-topbar">
      <a className="hub-brand" href="/workspace"><span>✦</span> Elevate <small>COMMAND CENTER</small></a>
      {organizations.length > 0 && <label className="hub-workspace-switch" aria-label="Switch workspace"><select value={organizationId || ''} onChange={event => switchWorkspace(event.target.value)}>{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select><i>⌄</i></label>}
      <button className="hub-mobile-menu" aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(value => !value)}>{mobileNavOpen ? '×' : '☰'}</button>
      <nav className={mobileNavOpen ? 'hub-nav-open' : ''} aria-label="Main navigation"><a className="active" href="/workspace">Overview</a><a href="/jira">Jira</a><a href="/testrail">TestRail</a><a href="/erp">ERP</a></nav>
      <div className="hub-actions"><button className="hub-search" onClick={() => setOpen(true)}>⌕ <span>Search workspace</span><kbd>⌘ K</kbd></button><button className="hub-bell" onClick={() => setToast(notifications.length ? notifications[0].title : 'You are all caught up.')}>♢{notifications.some(item => !item.is_read) && <i />}</button><div className="hub-account"><button className="hub-avatar" aria-label={`Open account menu for ${accountName}`} title={accountName} aria-expanded={accountOpen} onClick={() => setAccountOpen(value => !value)}>{accountInitials}</button>{accountOpen && <div className="hub-account-menu"><a href="/settings/workspace">People & workspace</a><a href="/settings/profile">Profile settings</a><button onClick={async () => { await logoutCurrentSession(); window.location.assign('/login') }}>Sign out</button></div>}</div></div>
    </header>

    <section className="hub-content">
      <div className="hub-hero"><div><p>CONNECTED WORKSPACE</p><h1>One clear view of<br />every team.</h1><span>Delivery, quality and business operations—aligned in real time.</span></div><div className="hub-hero-actions"><button onClick={() => setOpen(true)}>⌕ Search everything <kbd>⌘ K</kbd></button>{getSession()?.access_token && <button onClick={() => downloadSalesReport().catch(error => setToast(error.message))}>↓ Sales CSV</button>}<a href="/jira/projects/new">＋ Create work item</a></div></div>
      {toast && <div className="hub-toast" role="status">{toast}<button onClick={() => setToast('')}>×</button></div>}

      <section className="hub-health">
        <article className="hub-score"><div className="score-ring"><strong>82</strong><small>/100</small></div><div><p>Workspace health</p><h2>On track</h2><span>Up 6 points from last week</span></div><b>↗</b></article>
        <Metric icon="▥" title="Open delivery work" value={summary ? String(summary.open_issues) : '68%'} note={summary ? `${summary.completed_issues} issues completed` : '21 of 31 issues complete'} tone="purple" />
        <Metric icon="✓" title="Release quality" value={summary ? `${summary.passed_tests} passed` : '92%'} note={summary ? `${summary.failed_tests} failed tests need attention` : '14 tests need attention'} tone="red" />
        <Metric icon="↗" title="Business revenue" value={salesRevenue === null ? '$84.2k' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(salesRevenue)} note={salesRevenue === null ? 'Demo snapshot' : 'Total sales orders'} tone="blue" />
      </section>

      <section className="hub-grid">
        <article className="hub-card hub-release"><header><div><p>RELEASE COMMAND</p><h2>Release 2.4</h2><span>Targeting September 12 · 11 days remaining</span></div><span className="hub-status">At risk</span></header><div className="release-track"><i style={{ width: '72%' }} /></div><div className="release-steps"><div><b>24</b><small>Stories</small></div><div><b>128</b><small>Test cases</small></div><div><b>14</b><small>Failures</small></div><div><b>3</b><small>Blockers</small></div></div><footer><a href="/jira/board">View delivery board →</a><a href="/testrail/cases">Open test run →</a></footer></article>
        <article className="hub-card hub-focus"><header><div><p>YOUR FOCUS</p><h2>Priority queue</h2></div><a href="/tasks">View all</a></header>{[['Approve purchase order', 'ERP · Finance', 'Due today'], ['Fix checkout regression', 'Jira · WEB-184', 'High priority'], ['Review failed payment tests', 'TestRail · Release 2.4', '14 failures']].map(([title, source, tag]) => <button onClick={() => setToast(`${title} selected.`)} className="hub-task" key={title}><i>○</i><span><b>{title}</b><small>{source}</small></span><em>{tag}</em></button>)}</article>
      </section>

      <section className="hub-lower"><article className="hub-card"><header><div><p>LIVE ACTIVITY</p><h2>Across your workspace</h2></div><button onClick={markAllRead}>Mark notifications read</button></header><div className="hub-activity">{activity.map(([app, message, time, tone]) => <div key={message}><i className={tone}>{app.slice(0, 1)}</i><span><b>{message}</b><small>{app} · {time}</small></span><em>›</em></div>)}</div></article><article className="hub-card hub-integrations"><header><div><p>CONNECTED TOOLS</p><h2>Everything in sync</h2></div></header>{[['Jira', 'Projects, issues & sprints', '/jira', 'purple'], ['TestRail', 'Cases, runs & traceability', '/testrail', 'red'], ['Elevate ERP', 'Sales, finance & operations', '/erp', 'blue']].map(([name, copy, href, tone]) => <a href={href} key={name}><i className={tone}>{name[0]}</i><span><b>{name}</b><small>{copy}</small></span><em>Connected <b>✓</b></em></a>)}</article></section>
    </section>

      {open && <div className="command-backdrop" onMouseDown={() => setOpen(false)}><section className="command-box" onMouseDown={event => event.stopPropagation()}><div className="command-input">⌕<input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects, tests, records and actions…" /><kbd>ESC</kbd></div><p>{query ? 'WORKSPACE RESULTS' : 'QUICK NAVIGATION'}</p>{(query ? searchResults.map(item => [item.title, item.href, `${item.kind} · ${item.subtitle}`]) : matches).map(([title, href, meta]) => <a href={href} key={`${title}-${meta}`}><span>↗</span><div><b>{title}</b><small>{meta}</small></div><kbd>↵</kbd></a>)}{!(query ? searchResults : matches).length && <div className="command-empty">No matching result found.</div>}</section></div>}
  </main>
}

function Metric({ icon, title, value, note, tone }) { return <article className="hub-metric"><i className={tone}>{icon}</i><div><small>{title}</small><strong>{value}</strong><span>{note}</span></div></article> }

export default WorkspaceHub
