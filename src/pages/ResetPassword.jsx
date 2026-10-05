import { useState } from 'react'
import { confirmPasswordReset, isApiConfigured, requestPasswordReset } from '../services/auth'

function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [resetLink, setResetLink] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendReset(event) {
    event.preventDefault(); setLoading(true); setError(''); setMessage(''); setResetLink('')
    try {
      const result = await requestPasswordReset(email)
      setMessage(result.detail)
      if (result.development_reset_token) setResetLink(`/reset-password?token=${encodeURIComponent(result.development_reset_token)}`)
    } catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }

  async function saveNewPassword(event) {
    event.preventDefault(); setError(''); setMessage('')
    if (password !== confirmPassword) { setError('The passwords do not match.'); return }
    setLoading(true)
    try {
      const result = await confirmPasswordReset(token, password)
      setMessage(result.detail)
    } catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }

  return <main className="auth-page"><header className="auth-header"><a className="brand" href="/workspace"><span className="brand-mark">✦</span><span>Elevate</span></a><p><a href="/login">Back to log in</a></p></header><section className="auth-card" aria-labelledby="reset-title"><p className="form-kicker">Account recovery</p><h1 id="reset-title">{token ? 'Choose a new password' : 'Reset your password'}</h1><p className="form-intro">{token ? 'Use a new password with at least eight characters.' : 'We’ll send a password reset link if this email belongs to an account.'}</p>{!isApiConfigured() && <p className="error-message" role="alert">Password recovery needs the Elevate API. Set VITE_ERP_API_URL and start the backend.</p>}{token ? <form onSubmit={saveNewPassword}><label htmlFor="new-password">New password</label><input id="new-password" type="password" minLength="8" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" required /><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" minLength="8" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" required /><button className="submit-button" type="submit" disabled={loading || !isApiConfigured()}>{loading ? 'Saving…' : 'Update password'} <span>→</span></button></form> : <form onSubmit={sendReset}><label htmlFor="reset-email">Email address</label><input id="reset-email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /><button className="submit-button" type="submit" disabled={loading || !isApiConfigured()}>{loading ? 'Sending…' : 'Send reset link'} <span>→</span></button></form>}{error && <p className="error-message" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message} {token && <a href="/login">Return to log in</a>}</p>}{resetLink && <p className="success-message">Local development reset link: <a href={resetLink}>Continue password reset</a></p>}</section><footer><span>© 2026 Elevate Workspace</span></footer></main>
}

export default ResetPassword
