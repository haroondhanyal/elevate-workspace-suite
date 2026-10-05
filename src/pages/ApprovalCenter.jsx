import { useCallback, useEffect, useState } from 'react'
import { createApproval, decideApproval, getSession, listApprovals } from '../services/auth'
import './ApprovalCenter.css'

function ApprovalCenter() {
  const organizationId = getSession()?.organization_id
  const [items, setItems] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'purchase', amount: '' })
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    if (!organizationId) return
    try { setItems(await listApprovals(organizationId)); setError('') } catch (reason) { setError(reason.message) } finally { setLoading(false) }
  }, [organizationId])
  useEffect(() => { const timer = window.setTimeout(refresh, 0); return () => window.clearTimeout(timer) }, [refresh])
  async function submit(event) {
    event.preventDefault(); setError('')
    try { await createApproval(organizationId, { ...form, amount: form.amount ? Number(form.amount) : null }); setForm({ title: '', category: 'purchase', amount: '' }); setFormOpen(false); await refresh() } catch (reason) { setError(reason.message) }
  }
  async function decide(id, decision) {
    try { await decideApproval(id, decision, note); setNote(''); await refresh() } catch (reason) { setError(reason.message) }
  }
  return <main className="approval-page"><header><a href="/erp">← ERP overview</a><p>GOVERNANCE</p><h1>Approval center</h1><span>Requests, decisions and notes in one review queue.</span></header>
    <section className="approval-panel"><div className="approval-heading"><div><h2>Requests</h2><p>{items.filter(item => item.status === 'pending').length} waiting for a decision</p></div><button onClick={() => setFormOpen(true)}>＋ New request</button></div>
      {error && <p className="approval-error" role="alert">{error}</p>}{loading ? <p className="approval-empty">Loading approvals…</p> : !items.length ? <p className="approval-empty">No approval requests yet. Create the first one.</p> : <div className="approval-list">{items.map(item => <article key={item.id}><div className="approval-item"><span className="approval-icon">✓</span><div><b>{item.title}</b><small>{item.category} · Request #{item.id}{item.amount != null ? ` · ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item.amount)}` : ''}</small>{item.decision_note && <p>Decision note: {item.decision_note}</p>}</div><em className={`approval-status ${item.status}`}>{item.status}</em></div>{item.status === 'pending' && <div className="approval-actions"><input value={note} onChange={event => setNote(event.target.value)} placeholder="Decision note (optional)" aria-label={`Decision note for ${item.title}`} /><button onClick={() => decide(item.id, 'approved')}>Approve</button><button className="reject" onClick={() => decide(item.id, 'rejected')}>Reject</button></div>}</article>)}</div>}
    </section>{formOpen && <div className="approval-backdrop"><form onSubmit={submit}><button className="approval-close" type="button" onClick={() => setFormOpen(false)}>×</button><p>NEW REQUEST</p><h2>Create an approval</h2><label>Request title<input autoFocus required minLength="2" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. Purchase new laptops" /></label><label>Category<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{['purchase', 'expense', 'discount', 'leave', 'general'].map(value => <option key={value}>{value}</option>)}</select></label><label>Amount (optional)<input type="number" min="0" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} placeholder="0" /></label><footer><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button>Create request</button></footer></form></div>}</main>
}

export default ApprovalCenter
