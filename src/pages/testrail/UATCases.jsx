import { useState } from 'react'
import TestRailNav from './TestRailNav'
import { EvidenceNames } from '../../components/EvidenceActions'
import DeleteConfirm from '../../components/DeleteConfirm'
import CaseActionsMenu from '../../components/CaseActionsMenu'

const initial = [
  { id: 'UAT-014', title: 'Customer completes checkout on mobile', area: 'Checkout', status: 'Ready for UAT', owner: 'Raja Haroon', evidence: {} },
  { id: 'UAT-013', title: 'Marketing manager publishes a campaign', area: 'Campaigns', status: 'In review', owner: 'Sarah Malik', evidence: {} },
  { id: 'UAT-012', title: 'New user receives workspace invite', area: 'Account', status: 'Approved', owner: 'Aisha Mir', evidence: {} },
  { id: 'UAT-011', title: 'Customer support can resolve a request', area: 'Support', status: 'Approved', owner: 'Yusuf Khan', evidence: {} },
]

function UATCases() {
  const [items, setItems] = useState(initial)
  const [modal, setModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [draft, setDraft] = useState({ title: '', area: 'Checkout', status: 'Ready for UAT', owner: 'Raja Haroon' })
  function update(id, status) { setItems(items.map((item) => item.id === id ? { ...item, status } : item)) }
  function attach(id, kind, file) { if (file) setItems(items.map((item) => item.id === id ? { ...item, evidence: { ...item.evidence, [kind]: file.name } } : item)) }
  function edit(item) { setDraft(item); setModal({ type: 'edit', id: item.id }) }
  function remove(id) { setDeleteId(id) }
  function confirmDelete() { setItems(items.filter((item) => item.id !== deleteId)); setDeleteId(null) }
  function openCreate() { setDraft({ title: '', area: 'Checkout', status: 'Ready for UAT', owner: 'Raja Haroon' }); setModal({ type: 'create' }) }
  function save(event) { event.preventDefault(); if (!draft.title.trim()) return; setItems(modal.type === 'edit' ? items.map((item) => item.id === modal.id ? { ...item, ...draft } : item) : [{ ...draft, id: `UAT-${20 + items.length}`, evidence: {} }, ...items]); setModal(null) }
  return <main className="testrail-app"><TestRailNav active="UAT cases" /><section className="testrail-main"><header className="testrail-topbar"><div>RH98 Brand Platform <b>/</b> UAT cases</div><button className="jira-user">RH</button></header><div className="testrail-content"><div className="testrail-welcome"><div><p className="testrail-kicker">Acceptance testing</p><h1>UAT cases</h1><p>Validate real customer journeys before every release.</p></div><button className="testrail-primary" onClick={openCreate}>＋ Add UAT case</button></div><div className="uat-summary"><span><b>{items.length}</b> Total cases</span><span><b>{items.filter((item) => item.status === 'Approved').length}</b> Approved</span><span><b>{items.filter((item) => item.status === 'Ready for UAT').length}</b> Ready to test</span></div><div className="uat-list">{items.map((item) => <article className="uat-row" key={item.id}><span className="uat-id">{item.id}</span><div><h2>{item.title}</h2><p>{item.area} · Owner: {item.owner}</p><EvidenceNames evidence={item.evidence} /></div><span className={`case-status ${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span><select value={item.status} onChange={(event) => update(item.id, event.target.value)}><option>Ready for UAT</option><option>In review</option><option>Approved</option><option>Rejected</option></select><CaseActionsMenu item={item} onEdit={edit} onDelete={remove} onAttach={attach} /></article>)}</div>{modal && <div className="modal-backdrop"><form className="issue-modal" onSubmit={save}><button className="modal-close" type="button" onClick={() => setModal(null)}>×</button><p className="testrail-kicker">Acceptance testing</p><h2>{modal.type === 'edit' ? 'Update UAT case' : 'Add UAT case'}</h2><label>Scenario title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Describe the customer journey" required /></label><label>Area<input value={draft.area} onChange={(event) => setDraft({ ...draft, area: event.target.value })} /></label><label>Acceptance criteria<textarea rows="4" placeholder="Given, when, then..." /></label><div><button type="button" onClick={() => setModal(null)}>Cancel</button><button className="testrail-primary" type="submit">Save UAT case</button></div></form></div>}{deleteId && <DeleteConfirm label="UAT case" onCancel={() => setDeleteId(null)} onConfirm={confirmDelete} />}</div></section></main>
}

export default UATCases
