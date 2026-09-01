import ThemeToggle from '../../components/ThemeToggle'

const links = [['/testrail', '▦', 'Overview'], ['/testrail/cases', '✓', 'Test cases'], ['/testrail/uat', '◉', 'UAT cases'], ['/testrail/rtm', '⌁', 'RTM matrix'], ['/testrail/stories', '▤', 'User stories']]

function TestRailNav({ active }) {
  return (
    <aside className="testrail-sidebar">
      <a className="testrail-logo" href="/testrail"><span>◈</span><strong>RH98</strong><small>TESTRAIL</small></a>
      <button className="testrail-project"><span>RH</span><b>RH98 Brand Platform</b><i>⌄</i></button>
      <nav><p>Workspace</p><a href="/workspace"><span>✦</span> Command center</a><p>Test management</p>{links.map(([href, icon, label]) => <a key={label} className={active === label ? 'active' : ''} href={href}><span>{icon}</span>{label}{label === 'Test cases' && <b>128</b>}</a>)}<p>Project</p><a href="/jira/board"><span>▥</span> Scrum board</a><a href="/jira"><span>↗</span> Jira dashboard</a><a href="/media"><span>▶</span> Video library</a></nav>
      <div className="testrail-bottom"><a className="sso-link" href="/login">⇥ Continue with SSO</a><ThemeToggle /><a href="/jira/customize">⚙ Project settings</a><a href="/help">? Help center</a><div className="testrail-user"><strong>RH</strong><span>Raja Haroon<small>Admin</small></span></div></div>
    </aside>
  )
}

export default TestRailNav
