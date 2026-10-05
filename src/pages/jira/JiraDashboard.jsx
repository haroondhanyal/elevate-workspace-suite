import { useEffect, useState } from 'react'
import ThemeToggle from '../../components/ThemeToggle'
import { isBackendSession, listIssues, listWorkspaceProjects } from '../../services/auth'

const demoProjects = [
  { key: 'RH', name: 'Elevate Workspace', type: 'Software project', color: 'purple', progress: 68, issues: 24 },
  { key: 'WEB', name: 'Website Refresh', type: 'Marketing project', color: 'orange', progress: 42, issues: 12 },
  { key: 'APP', name: 'Mobile Experience', type: 'Product project', color: 'green', progress: 18, issues: 8 },
]

function JiraNav({ projects }) {
  return <aside className="jira-sidebar"><a className="jira-logo" href="/jira"><span>✦</span> EVL <small>JIRA</small></a><button className="jira-workspace"><span>R</span><b>Elevate Workspace</b><i>⌄</i></button><nav><p>Workspace</p><a href="/workspace">✦ Command center</a><a className="jira-active" href="/jira">▦ Dashboard</a><a href="/jira/board">▥ Scrum board</a><a href="/company/personal/user/1/inbox/">▣ Inbox <b>3</b></a><a href="/company/personal/user/1/tasks/">✓ My tasks</a><p>Projects</p>{projects.map((project) => <a href="/jira/board" key={project.key}><i className={`jira-dot ${project.color}`} />{project.key} · {project.name}</a>)}</nav><div className="jira-sidebar-bottom"><a href="/jira/customize">⚙ Customize</a><a href="/help">? Help center</a><span className="jira-profile"><strong>RH</strong><span>Raja Haroon<small>Admin</small></span></span></div></aside>
}

function JiraDashboard() {
  const [range, setRange] = useState('This week')
  const [projects, setProjects] = useState(isBackendSession() ? [] : demoProjects)
  const [loading, setLoading] = useState(isBackendSession())
  const [error, setError] = useState('')

  useEffect(() => {
    const backend = isBackendSession()
    let active = true
    listWorkspaceProjects().then(async items => {
      if (!backend) return items.length ? items : demoProjects
      return Promise.all(items.map(async (project, index) => {
        const issues = await listIssues(project.id)
        const completed = issues.filter(issue => issue.status === 'done').length
        return { ...project, type: project.description || 'Software project', issues: issues.length - completed, inProgress: issues.filter(issue => issue.status === 'in_progress').length, completed, progress: issues.length ? Math.round(completed / issues.length * 100) : 0, color: ['purple', 'orange', 'green'][index % 3] }
      }))
    }).then(items => { if (active) setProjects(items) }).catch(requestError => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const totalOpen = projects.reduce((count, project) => count + (project.issues || 0), 0)
  const totalInProgress = projects.reduce((count, project) => count + (project.inProgress || 0), 0)
  const totalCompleted = projects.reduce((count, project) => count + (project.completed || 0), 0)
  const avgProgress = projects.length ? Math.round(projects.reduce((count, project) => count + (project.progress || 0), 0) / projects.length) : 0
  return <main className="jira-app"><JiraNav projects={projects} /><section className="jira-main"><header className="jira-topbar"><div className="jira-breadcrumb">Elevate Workspace <b>/</b> Dashboard</div><div className="jira-actions"><label>⌕ <input placeholder="Search" /></label><ThemeToggle /><a className="app-settings-button" href="/jira/customize" aria-label="Open app settings" title="App settings">⚙</a><a className="jira-primary" href="/jira/projects/new" aria-label="Create project">＋</a><button className="jira-user">RH</button></div></header><div className="jira-dashboard"><div className="jira-welcome"><div><p className="jira-kicker">Good morning, Raja</p><h1>Workspace overview</h1><p>See what your team is working on and what needs your attention.</p></div><a className="jira-primary" href="/jira/projects/new">＋ Create project</a></div>{error && <p className="error-message" role="alert">Could not load project data: {error}</p>}<div className="jira-stat-grid"><Stat number={totalOpen} label="Open issues" tone="purple" /><Stat number={totalInProgress} label="Work in progress" tone="orange" /><Stat number={totalCompleted} label="Completed issues" tone="green" /><Stat number="0" label="Active sprints" tone="blue" /></div><section className="jira-section"><div className="jira-section-head"><div><h2>Your projects</h2><p>Track progress across every team.</p></div><a href="/jira/projects/new">＋ Create project</a></div>{loading ? <p className="empty-state">Loading your projects…</p> : projects.length ? <div className="project-grid">{projects.map((project) => <article className="project-card" key={project.key}><div className={`project-icon ${project.color || 'purple'}`}>{project.key.slice(0, 1)}</div><span className="project-type">{project.type}</span><h3>{project.name}</h3><div className="progress-line"><span style={{ width: `${project.progress || 0}%` }} /></div><footer><span>{project.progress || 0}% complete</span><b>{project.issues || 0} open issues</b></footer><a href="/jira/board" className="project-open">Open project →</a></article>)}</div> : <p className="empty-state">No projects yet. Create a project to start planning work.</p>}</section><section className="jira-section sprint-section"><div className="jira-section-head"><div><h2>Issue progress</h2><p>Current status across your projects.</p></div><div className="range-toggle">{['This week', 'This month'].map((item) => <button className={range === item ? 'selected' : ''} onClick={() => setRange(item)} key={item}>{item}</button>)}</div></div><div className="sprint-progress"><div className="sprint-ring"><strong>{avgProgress}%</strong><small>complete</small></div><div className="sprint-bars"><Bar label="In progress" number={totalInProgress} width={projects.length ? Math.min(100, totalInProgress * 10) : 0} color="purple" /><Bar label="Done" number={totalCompleted} width={avgProgress} color="green" /></div><a href="/jira/board" className="jira-secondary">Open sprint board →</a></div></section></div></section></main>
}

function Stat({ number, label, tone }) { return <div className="jira-stat"><span className={`stat-icon ${tone}`}>▦</span><div><strong>{number}</strong><small>{label}</small></div><i>↗</i></div> }
function Bar({ label, number, width, color }) { return <div className="sprint-bar"><span>{label}</span><b>{number}</b><div><i className={color} style={{ width: `${width}%` }} /></div></div> }
export default JiraDashboard
