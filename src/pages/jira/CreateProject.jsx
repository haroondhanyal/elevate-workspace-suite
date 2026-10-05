import { useState } from 'react'
import { createWorkspaceProject } from '../../services/auth'

const projectKeyFromName = (name) => name.trim().split(/\s+/).map(word => word[0]).join('').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6) || 'EVL'

function CreateProject() {
  const [name, setName] = useState('')
  const [key, setKey] = useState('EVL')
  const [type, setType] = useState('Software development')
  const [created, setCreated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      await createWorkspaceProject({ name: name.trim(), key: key.trim(), description: `${type} project` })
      setCreated(true)
    } catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }

  return <main className="project-create-page"><header className="workspace-header"><a className="jira-logo" href="/jira"><span>✦</span> EVL <small>JIRA</small></a><a className="back-link" href="/jira">← Back to dashboard</a></header><section className="project-create-card"><p className="jira-kicker">New project</p><h1>Create a project</h1><p className="heading-note">Set up a project space for your team and start shipping.</p><form onSubmit={submit}><label>Project name<input value={name} onChange={event => { setName(event.target.value); setKey(projectKeyFromName(event.target.value)) }} placeholder="e.g. Elevate Workspace" autoFocus required /></label><label>Project key<input className="key-input" value={key} onChange={event => setKey(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12))} minLength="2" maxLength="12" required /></label><label>Project template<select value={type} onChange={event => setType(event.target.value)}><option>Software development</option><option>Marketing campaign</option><option>Product discovery</option></select></label><div className="template-preview"><span>▥</span><div><strong>Scrum</strong><p>Plan work in sprints with a flexible board and backlog.</p></div><b>Selected</b></div><div className="project-create-actions"><a href="/jira">Cancel</a><button className="jira-primary" type="submit" disabled={saving || created}>{saving ? 'Creating…' : 'Create project →'}</button></div>{error && <p className="error-message" role="alert">{error}</p>}{created && <p className="success-message">Project created successfully. <a href="/jira/board">Open project board</a></p>}</form></section></main>
}

export default CreateProject
