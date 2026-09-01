import { useState } from 'react'
import TestRailNav from './TestRailNav'
import { EvidenceNames } from '../../components/EvidenceActions'
import DeleteConfirm from '../../components/DeleteConfirm'
import CaseActionsMenu from '../../components/CaseActionsMenu'

const initialCases = [
  { id: 'TC-128', title: 'User can complete checkout with valid card', suite: 'Checkout', priority: 'High', status: 'Passed', owner: 'AK', evidence: {} },
  { id: 'TC-127', title: 'Error message displays for declined card', suite: 'Checkout', priority: 'High', status: 'Failed', owner: 'SM', evidence: {} },
  { id: 'TC-126', title: 'Guest user can add item to cart', suite: 'Shopping cart', priority: 'Normal', status: 'Passed', owner: 'YK', evidence: {} },
  { id: 'TC-125', title: 'Homepage loads within performance budget', suite: 'Homepage', priority: 'Normal', status: 'Blocked', owner: 'RH', evidence: {} },
]

function TestCases() {
  const [cases, setCases] = useState(initialCases)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [draft, setDraft] = useState({ title: '', suite: 'New suite', priority: 'Normal', status: 'Not run' })
  const visible = cases.filter((item) => `${item.id} ${item.title} ${item.suite}`.toLowerCase().includes(query.toLowerCase()))

  function openCreate() { setDraft({ title: '', suite: 'New suite', priority: 'Normal', status: 'Not run' }); setModal({ type: 'create' }) }
  function openEdit(item) { setDraft(item); setModal({ type: 'edit', id: item.id }) }
  function saveCase(event) { event.preventDefault(); if (!draft.title.trim()) return; if (modal.type === 'create') setCases([{ ...draft, id: `TC-${130 + cases.length}`, owner: 'RH', evidence: {} }, ...cases]); else setCases(cases.map((item) => item.id === modal.id ? { ...item, ...draft } : item)); setModal(null) }
  function removeCase(id) { setDeleteId(id) }
  function confirmDelete() { setCases(cases.filter((item) => item.id !== deleteId)); setDeleteId(null) }
  function attach(id, kind, file) { if (file) setCases(cases.map((item) => item.id === id ? { ...item, evidence: { ...item.evidence, [kind]: file.name } } : item)) }

  return <main className="testrail-app"><TestRailNav active="Test cases" /><section className="testrail-main"><header className="testrail-topbar"><div>RH98 Brand Platform <b>/</b> Test cases</div><div className="testrail-actions"><label>⌕ <input placeholder="Search" /></label><button className="jira-user">RH</button></div></header><div className="testrail-content"><div className="testrail-welcome"><div><p className="testrail-kicker">Test repository</p><h1>Test cases</h1><p>Create, update and validate every quality check.</p></div><button className="testrail-primary" onClick={openCreate}>＋ New test case</button></div><div className="case-toolbar"><div className="case-tabs"><button className="active">All cases <b>{cases.length}</b></button><button>My cases</button><button>Recently updated</button></div><label className="case-search">⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cases" /></label><button>☷ Filter</button></div><div className="case-table"><div className="case-table-head"><span>Case</span><span>Suite</span><span>Priority</span><span>Status</span><span>Owner</span><span>Actions</span></div>{visible.map((item) => <CaseRow key={item.id} item={item} onEdit={openEdit} onDelete={removeCase} onAttach={attach} />)}</div>{modal && <CaseModal modal={modal} draft={draft} setDraft={setDraft} onSave={saveCase} onClose={() => setModal(null)} />}{deleteId && <DeleteConfirm label="test case" onCancel={() => setDeleteId(null)} onConfirm={confirmDelete} />}</div></section></main>
}

function CaseRow({ item, onEdit, onDelete, onAttach }) { return <div className="case-row"><span><b>{item.id}</b><strong>{item.title}</strong><EvidenceNames evidence={item.evidence} /></span><span>{item.suite}</span><span className={`case-priority ${item.priority.toLowerCase()}`}>{item.priority}</span><span className={`case-status ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span><span className="jira-avatar">{item.owner}</span><CaseActionsMenu item={item} onEdit={onEdit} onDelete={onDelete} onAttach={onAttach} /></div> }
function CaseModal({ modal, draft, setDraft, onSave, onClose }) { return <div className="modal-backdrop"><form className="issue-modal" onSubmit={onSave}><button className="modal-close" type="button" onClick={onClose}>×</button><p className="testrail-kicker">Test repository</p><h2>{modal.type === 'create' ? 'Create test case' : 'Update test case'}</h2><label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Describe the test scenario" autoFocus required /></label><label>Suite<input value={draft.suite} onChange={(event) => setDraft({ ...draft, suite: event.target.value })} /></label><div className="form-grid"><label>Priority<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}><option>High</option><option>Normal</option><option>Low</option></select></label><label>Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option>Not run</option><option>Passed</option><option>Failed</option><option>Blocked</option></select></label></div><label>Test steps<textarea rows="4" placeholder="Add steps and expected results..." /></label><div><button type="button" onClick={onClose}>Cancel</button><button className="testrail-primary" type="submit">Save case</button></div></form></div> }
export default TestCases
