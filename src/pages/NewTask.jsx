import { useState } from 'react'

function NewTask() {
  const [title, setTitle] = useState('')
  const [project, setProject] = useState('RH98 Brand')
  const [priority, setPriority] = useState('Normal')
  const [created, setCreated] = useState(false)

  function createTask(event) {
    event.preventDefault()
    if (!title.trim()) return
    const savedTasks = JSON.parse(localStorage.getItem('rh98-tasks') || '[]')
    savedTasks.unshift({ id: Date.now(), title: title.trim(), project, person: 'RH', due: 'Today', priority, done: false })
    localStorage.setItem('rh98-tasks', JSON.stringify(savedTasks))
    setCreated(true)
  }

  return <main className="new-task-page"><header className="workspace-header"><a className="tasks-brand" href="/company/personal/user/1/tasks/"><span className="brand-mark">✦</span><span>RH98 Brand</span></a><a className="back-link" href="/company/personal/user/1/tasks/">← Back to tasks</a></header><section className="new-task-card"><p className="page-kicker">Workspace task</p><h1>Create a new task</h1><p className="heading-note">Give your team a clear next step.</p><form onSubmit={createTask}><label htmlFor="task-title">Task name</label><input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to be done?" autoFocus required /><div className="form-grid"><div><label htmlFor="task-project">Project</label><select id="task-project" value={project} onChange={(event) => setProject(event.target.value)}><option>RH98 Brand</option><option>Website refresh</option><option>Brand assets</option></select></div><div><label htmlFor="task-priority">Priority</label><select id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value)}><option>Normal</option><option>High</option><option>Low</option></select></div></div><label htmlFor="task-description">Description <span className="optional">Optional</span></label><textarea id="task-description" placeholder="Add context, links, or a definition of done..." rows="5" /><div className="task-form-actions"><a href="/company/personal/user/1/tasks/">Cancel</a><button className="submit-button" type="submit">Create task <span>→</span></button></div>{created && <p className="success-message">Task created. <a href="/company/personal/user/1/tasks/">View your tasks</a></p>}</form></section></main>
}

export default NewTask
