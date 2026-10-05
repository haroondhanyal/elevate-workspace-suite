import { useState } from 'react'
import TestRailNav from './TestRailNav'
import EvidenceActions, { EvidenceNames } from '../../components/EvidenceActions'
import useWorkspaceCollection from '../../hooks/useWorkspaceCollection'

const storyTitles = ['create an account', 'recover my password', 'join a workspace by invitation', 'manage team roles', 'switch between workspaces', 'create Jira projects', 'manage sprint issues', 'approve an expense request', 'create and organize test cases', 'record test run results', 'trace requirements to tests', 'export project reports', 'manage my profile photo', 'update contact details', 'receive live notifications', 'review the audit trail', 'search workspace records', 'use the workspace on mobile', 'attach test evidence', 'review recent team activity']
const seed = storyTitles.map((story, index) => ({ id: `US-${String(24 + index).padStart(3, '0')}`, title: `As a workspace user, I want to ${story}`, epic: ['Account', 'Workspace', 'Delivery', 'Quality', 'Reporting'][index % 5], priority: ['High', 'Normal', 'Low'][index % 3], tests: index % 7, status: ['Ready', 'In development', 'Needs tests'][index % 3], evidence: {} }))
function UserStories() {
  const { data: stories, saveData: saveStories, loading, error } = useWorkspaceCollection('testrail-stories', seed)
  const [show, setShow] = useState(false)
  const [editId, setEditId] = useState(null)
  const [title, setTitle] = useState('')
  function openCreate() { setTitle(''); setEditId(null); setShow(true) }
  function openEdit(story) { setTitle(story.title); setEditId(story.id); setShow(true) }
  function save(event) {
    event.preventDefault()
    const next = editId
      ? stories.map(story => story.id === editId ? { ...story, title } : story)
      : [{ id: `US-${50 + stories.length}`, title, epic: 'New epic', priority: 'Normal', tests: 0, status: 'Needs tests', evidence: {} }, ...stories]
    saveStories(next); setTitle(''); setEditId(null); setShow(false)
  }
  function attach(id, kind, file) { if (file) saveStories(stories.map(story => story.id === id ? { ...story, evidence: { ...story.evidence, [kind]: file.name } } : story)) }
  return <main className="testrail-app"><TestRailNav active="User stories" /><section className="testrail-main"><header className="testrail-topbar"><div>Elevate Workspace <b>/</b> User stories</div><button className="jira-user">RH</button></header><div className="testrail-content"><div className="testrail-welcome"><div><p className="testrail-kicker">Requirements</p><h1>User stories</h1><p>Keep product intent connected to executable test coverage.</p></div><button className="testrail-primary" onClick={openCreate}>＋ Add user story</button></div>{error && <p className="error-message" role="alert">Could not save user stories: {error}</p>}{loading ? <p className="empty-state">Loading user stories…</p> : <div className="story-list">{stories.map(story => <article className="story-row" key={story.id}><span className="story-id">{story.id}</span><div><h2>{story.title}</h2><p>{story.epic} · {story.tests} linked tests</p><EvidenceNames evidence={story.evidence} /></div><span className={`case-status ${story.status.toLowerCase().replaceAll(' ', '-')}`}>{story.status}</span><span className={`case-priority ${story.priority.toLowerCase()}`}>{story.priority}</span><span className="case-actions"><button onClick={() => openEdit(story)}>Edit</button><EvidenceActions evidence={story.evidence} onAttach={(kind, file) => attach(story.id, kind, file)} /></span></article>)}</div>}{show && <div className="modal-backdrop"><form className="issue-modal" onSubmit={save}><button className="modal-close" type="button" onClick={() => setShow(false)}>×</button><p className="testrail-kicker">Requirements</p><h2>{editId ? 'Edit user story' : 'Add user story'}</h2><label>Story title<input value={title} onChange={event => setTitle(event.target.value)} placeholder="As a user, I want to..." required /></label><label>Acceptance criteria<textarea rows="4" placeholder="Given, when, then..." /></label><div><button type="button" onClick={() => setShow(false)}>Cancel</button><button className="testrail-primary" type="submit">{editId ? 'Save changes' : 'Add story'}</button></div></form></div>}</div></section></main>
}
export default UserStories
