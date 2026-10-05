import { useEffect, useState } from 'react'
import { acceptWorkspaceInvitation } from '../services/auth'

function AcceptInvitation() {
  const [state, setState] = useState('Checking invitation…')
  const token = new URLSearchParams(window.location.search).get('token')
  const [error, setError] = useState(() => token ? '' : 'This invitation link is missing its token.')
  useEffect(() => {
    if (!token) return
    acceptWorkspaceInvitation(token).then(() => {
      setState('Invitation accepted. Opening your workspace…')
      window.setTimeout(() => window.location.replace('/workspace'), 700)
    }).catch(reason => {
      setError(reason.message)
      if (reason.status === 401) {
        const next = `/accept-invitation?token=${encodeURIComponent(token)}`
        window.setTimeout(() => window.location.replace(`/login?next=${encodeURIComponent(next)}`), 900)
      }
    })
  }, [token])
  return <main className="auth-page"><section className="auth-card"><p className="form-kicker">Workspace invitation</p><h1>{error ? 'Invitation needs attention' : 'Join your team'}</h1><p className={error ? 'error-message' : 'form-intro'} role={error ? 'alert' : 'status'}>{error || state}</p>{error && <a className="submit-button" href={`/login?next=${encodeURIComponent(`/accept-invitation?token=${token || ''}`)}`}>Sign in with invited email <span>→</span></a>}</section></main>
}

export default AcceptInvitation
