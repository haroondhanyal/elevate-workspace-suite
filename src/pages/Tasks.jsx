import { useState } from 'react'

const initialTasks = [
  { id: 1, title: 'Prepare Q3 launch brief', project: 'RH98 Brand launch', person: 'AK', due: 'Today', priority: 'High', done: false },
  { id: 2, title: 'Review homepage copy', project: 'Website refresh', person: 'SM', due: 'Today', priority: 'Normal', done: false },
  { id: 3, title: 'Collect campaign references', project: 'RH98 Brand launch', person: 'YK', due: 'Tomorrow', priority: 'Normal', done: false },
  { id: 4, title: 'Share final logo exports', project: 'Brand assets', person: 'RH', due: 'Aug 28', priority: 'Low', done: false },
  { id: 5, title: 'Schedule stakeholder review', project: 'Website refresh', person: 'AK', due: 'Aug 29', priority: 'Normal', done: false },
]

function Tasks() {
  const [tasks, setTasks] = useState(() => [...JSON.parse(localStorage.getItem('rh98-tasks') || '[]'), ...initialTasks])
  const [activeView, setActiveView] = useState('My tasks')
  const [query, setQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState(initialTasks[0])

  const visibleTasks = tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()))

  function toggleTask(task) {
    setTasks(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))
    setSelectedTask({ ...task, done: !task.done })
  }

  return (
    <main className="tasks-app">
      <aside className="tasks-sidebar">
        <a className="tasks-brand" href="/signup"><span className="brand-mark">✦</span><span>RH98 Brand</span></a>
        <button className="workspace-switcher"><span className="workspace-avatar">R</span><span>RH98 Workspace</span><span className="chevron">⌄</span></button>
        <nav className="main-nav" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          <a href="/company/personal/user/1/"><span>⌂</span> Home</a><a className="nav-active" href="/company/personal/user/1/tasks/"><span>✓</span> My tasks <b>5</b></a><a href="/company/personal/user/1/inbox/"><span>▣</span> Inbox <b className="inbox-count">3</b></a><a href="#calendar"><span>▦</span> Calendar</a>
          <p className="nav-label">Spaces</p>
          <a href="#brand"><i className="dot dot-purple" /> RH98 Brand</a><a href="#website"><i className="dot dot-orange" /> Website refresh</a><a href="#assets"><i className="dot dot-green" /> Brand assets</a>
        </nav>
        <div className="sidebar-bottom"><a href="/settings/profile"><span>⚙</span> Settings</a><a href="/help"><span>?</span> Help center</a><a href="/media"><span>▣</span> Media library</a><div className="profile"><span className="profile-avatar">RH</span><span><strong>Raja Haroon</strong><small>Admin</small></span><span className="more">•••</span></div></div>
      </aside>

      <section className="tasks-main">
        <header className="tasks-topbar"><button className="mobile-menu">☰</button><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>My tasks</strong></div><div className="top-actions"><label className="global-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" /></label><button className="icon-button" aria-label="Notifications">♧<em>2</em></button><button className="avatar-button">RH</button></div></header>
        <div className="tasks-content">
          <div className="tasks-heading"><div><p className="page-kicker">Personal workspace</p><h1>My tasks</h1><p className="heading-note">Everything assigned to you, in one place.</p></div><a className="new-task" href="/company/personal/user/1/tasks/new/">＋ New task</a></div>
          <div className="view-tabs">{['My tasks', 'Assigned by me', 'All tasks'].map((view) => <button key={view} className={activeView === view ? 'selected' : ''} onClick={() => setActiveView(view)}>{view}{view === 'My tasks' && <span>5</span>}</button>)}</div>
          <div className="filter-row"><button>☷ Filters <small>0</small></button><button>⌁ Sort: Due date</button><button>▤ Group: Status</button><button className="view-mode">☷　▦</button></div>
          <div className="task-board"><div className="group-heading"><span className="status-dot today" /><strong>Today</strong><span className="task-number">2 tasks</span><button>•••</button></div>{visibleTasks.filter((task) => task.due === 'Today').map((task) => <TaskRow key={task.id} task={task} onToggle={toggleTask} onSelect={setSelectedTask} selected={selectedTask.id === task.id} />)}<div className="group-heading later"><span className="status-dot upcoming" /><strong>Upcoming</strong><span className="task-number">3 tasks</span><button>•••</button></div>{visibleTasks.filter((task) => task.due !== 'Today').map((task) => <TaskRow key={task.id} task={task} onToggle={toggleTask} onSelect={setSelectedTask} selected={selectedTask.id === task.id} />)}{visibleTasks.length === 0 && <p className="empty-state">No tasks match your search.</p>}</div>
        </div>
      </section>
      <aside className="task-detail"><div className="detail-top"><span>Task details</span><button>×</button></div><div className="detail-body"><span className="detail-status">{selectedTask.done ? 'Completed' : 'Open'}</span><h2>{selectedTask.title}</h2><p className="detail-project"><i className="dot dot-purple" /> {selectedTask.project}</p><div className="detail-divider" /><DetailItem label="Assignee" value={selectedTask.person === 'AK' ? 'Raja Haroon' : 'Team member'} avatar={selectedTask.person} /><DetailItem label="Due date" value={selectedTask.due} /><DetailItem label="Priority" value={selectedTask.priority} /></div><div className="detail-footer"><button>＋ Add subtask</button><button>•••</button></div></aside>
    </main>
  )
}

function TaskRow({ task, onToggle, onSelect, selected }) {
  return <button className={`task-row ${selected ? 'row-selected' : ''}`} onClick={() => onSelect(task)}><span className={`task-check ${task.done ? 'checked' : ''}`} onClick={(event) => { event.stopPropagation(); onToggle(task) }}>{task.done ? '✓' : ''}</span><span className={`task-title ${task.done ? 'completed' : ''}`}>{task.title}<small>{task.project}</small></span><span className="task-person">{task.person}</span><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><span className="task-due">{task.due}</span><span className="row-more">•••</span></button>
}

function DetailItem({ label, value, avatar }) {
  return <div className="detail-item"><span>{label}</span><strong>{avatar && <i className="mini-avatar">{avatar}</i>}{value}</strong></div>
}

export default Tasks
