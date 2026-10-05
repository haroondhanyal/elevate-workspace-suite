import { useCallback, useEffect, useState } from 'react'
import { getSession, inviteWorkspaceMember, listInvitations, listOrganizationMembers, listOrganizations } from '../services/auth'
import './WorkspaceSettings.css'

function WorkspaceSettings() {
  const session = getSession()
  const organizationId = session?.organization_id
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [form, setForm] = useState({ email: '', role: 'member' })
  const [inviteUrl, setInviteUrl] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!organizationId) return
    setError('')
    try {
      const [people, invites] = await Promise.all([listOrganizationMembers(organizationId), listInvitations(organizationId)])
      setMembers(people); setInvitations(invites)
    } catch (reason) { setError(reason.message) } finally { setLoading(false) }
  }, [organizationId])
  useEffect(() => { const timer = window.setTimeout(refresh, 0); return () => window.clearTimeout(timer) }, [refresh])

  async function submit(event) {
    event.preventDefault(); setError(''); setNotice(''); setInviteUrl('')
    try {
      const invite = await inviteWorkspaceMember(organizationId, form)
      setInvitations(current => [invite, ...current]); setForm({ email: '', role: 'member' })
      setInviteUrl(invite.development_invite_url || '')
      setNotice(invite.development_invite_url ? 'Invitation created. Share this development link with the teammate.' : 'Invitation sent by email.')
    } catch (reason) { setError(reason.message) }
  }

  return <main className="workspace-settings">
    <header><a href="/workspace">← Elevate Workspace</a><p>WORKSPACE ADMIN</p><h1>People & access</h1><span>Manage members, roles and pending invitations.</span></header>
    {!organizationId ? <p className="ws-notice">Sign in to manage a workspace.</p> : <>
      <section className="ws-panel"><div className="ws-panel-heading"><div><h2>Invite a teammate</h2><p>Give each person the access they need.</p></div><span>{session.role || 'member'} role</span></div>
        <form className="ws-invite-form" onSubmit={submit}><label>Email address<input type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="teammate@company.com" /></label><label>Role<select value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}>{['member', 'qa', 'manager', 'sales', 'finance', 'hr'].map(role => <option key={role} value={role}>{role[0].toUpperCase() + role.slice(1)}</option>)}</select></label><button disabled={loading}>Send invite</button></form>
        {notice && <p className="ws-success" role="status">{notice}</p>}{error && <p className="ws-error" role="alert">{error}</p>}{inviteUrl && <div className="ws-link"><input readOnly value={inviteUrl} aria-label="Development invitation link" /><button onClick={() => navigator.clipboard?.writeText(inviteUrl).then(() => setNotice('Invitation link copied.'))}>Copy link</button></div>}
      </section>
      <section className="ws-panel"><div className="ws-panel-heading"><div><h2>Members</h2><p>People who can access this workspace.</p></div><b>{members.length}</b></div>{loading ? <p className="ws-empty">Loading members…</p> : <div className="ws-list">{members.map(member => <article key={member.id}><i>{member.full_name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</i><span><b>{member.full_name}</b><small>{member.email}</small></span><em>{member.role}</em></article>)}</div>}</section>
      <section className="ws-panel"><div className="ws-panel-heading"><div><h2>Pending invitations</h2><p>Invitations expire after seven days.</p></div></div>{invitations.filter(invite => !invite.accepted_at).length ? <div className="ws-list">{invitations.filter(invite => !invite.accepted_at).map(invite => <article key={invite.id}><i className="ws-pending">✉</i><span><b>{invite.email}</b><small>Expires {new Date(invite.expires_at).toLocaleDateString()}</small></span><em>{invite.role}</em></article>)}</div> : <p className="ws-empty">No pending invitations.</p>}</section>
      <section className="ws-panel"><div className="ws-panel-heading"><div><h2>Your workspaces</h2><p>Switching is available from the workspace menu.</p></div></div><WorkspaceList currentId={organizationId} /></section>
    </>}
  </main>
}

function WorkspaceList({ currentId }) {
  const [items, setItems] = useState([])
  useEffect(() => { listOrganizations().then(setItems).catch(() => setItems([])) }, [])
  return <div className="ws-list">{items.map(item => <article key={item.id}><i>✦</i><span><b>{item.name}</b><small>{item.slug}</small></span>{item.id === currentId && <em>Current workspace</em>}</article>)}</div>
}

export default WorkspaceSettings
