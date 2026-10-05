import { useEffect, useState } from 'react'
import { signIn, signUp, updateCurrentUser, uploadWorkspaceFile } from '../services/auth'
import './AuthPage.css'

const phoneCountries = [
  ['PK', '🇵🇰', 'Pakistan', '+92'], ['US', '🇺🇸', 'United States', '+1'], ['CA', '🇨🇦', 'Canada', '+1'], ['GB', '🇬🇧', 'United Kingdom', '+44'],
  ['IN', '🇮🇳', 'India', '+91'], ['AE', '🇦🇪', 'United Arab Emirates', '+971'], ['SA', '🇸🇦', 'Saudi Arabia', '+966'], ['TR', '🇹🇷', 'Türkiye', '+90'],
  ['AU', '🇦🇺', 'Australia', '+61'], ['NZ', '🇳🇿', 'New Zealand', '+64'], ['BD', '🇧🇩', 'Bangladesh', '+880'], ['LK', '🇱🇰', 'Sri Lanka', '+94'],
  ['AF', '🇦🇫', 'Afghanistan', '+93'], ['FR', '🇫🇷', 'France', '+33'], ['DE', '🇩🇪', 'Germany', '+49'], ['IT', '🇮🇹', 'Italy', '+39'],
  ['ES', '🇪🇸', 'Spain', '+34'], ['NL', '🇳🇱', 'Netherlands', '+31'], ['IE', '🇮🇪', 'Ireland', '+353'], ['CN', '🇨🇳', 'China', '+86'],
  ['JP', '🇯🇵', 'Japan', '+81'], ['KR', '🇰🇷', 'South Korea', '+82'], ['MY', '🇲🇾', 'Malaysia', '+60'], ['SG', '🇸🇬', 'Singapore', '+65'],
  ['ZA', '🇿🇦', 'South Africa', '+27'], ['NG', '🇳🇬', 'Nigeria', '+234'], ['EG', '🇪🇬', 'Egypt', '+20'], ['BR', '🇧🇷', 'Brazil', '+55'],
  ['MX', '🇲🇽', 'Mexico', '+52'], ['AR', '🇦🇷', 'Argentina', '+54'],
]

function AuthPage({ mode }) {
  const isLogin = mode === 'login'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [form, setForm] = useState({ fullName: '', organizationName: '', email: '', password: '', confirmPassword: '', age: '', mobile: '', countryCode: 'PK' })
  const requestedPath = new URLSearchParams(window.location.search).get('next')
  const nextPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/workspace'
  const joiningWorkspace = nextPath.startsWith('/accept-invitation')
  const signupHref = `/signup${joiningWorkspace ? `?next=${encodeURIComponent(nextPath)}` : ''}`
  const legalReturn = encodeURIComponent(signupHref)

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview) }, [photoPreview])

  function choosePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) { setPhotoError('Choose a JPG, PNG, GIF or WebP image.'); return }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Profile images must be 5 MB or smaller.'); return }
    setPhotoError(''); setPhoto(file); setPhotoPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhoto(null); setPhotoPreview(''); setPhotoError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(''); setLoading(true)
    try {
      if (isLogin) await signIn({ email: form.email, password: form.password })
      else {
        if (form.password !== form.confirmPassword) throw new Error('Your passwords do not match.')
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(form.password)) throw new Error('Use at least 8 characters, including an uppercase letter, lowercase letter, and number.')
        const dialCode = phoneCountries.find(([code]) => code === form.countryCode)?.[3] || '+92'
        const normalizedPhone = `${dialCode}${form.mobile.replace(/\D/g, '').replace(/^0+/, '')}`
        await signUp({ full_name: form.fullName, organization_name: joiningWorkspace ? 'Personal workspace' : form.organizationName, email: form.email, password: form.password, age: form.age ? Number(form.age) : null, mobile: normalizedPhone })
        if (photo) {
          try {
            const uploaded = await uploadWorkspaceFile(photo)
            await updateCurrentUser({ avatar_url: uploaded.url })
          } catch (uploadError) { setPhotoError(`Account created, but the photo could not be saved: ${uploadError.message}`) }
        }
      }
      setSubmitted(true)
      window.setTimeout(() => { window.location.replace(nextPath) }, 350)
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  return (
    <main className={`auth-page auth-page-${mode}`}>
      <header className="auth-header">
        <a className="brand" href="/signup" aria-label="Elevate home"><span className="brand-mark">✦</span><span>Elevate</span></a>
        <p>{isLogin ? 'Don’t have an account?' : 'Already have an account?'} <a href={`${isLogin ? '/signup' : '/login'}${joiningWorkspace ? `?next=${encodeURIComponent(nextPath)}` : ''}`}>{isLogin ? 'Sign up' : 'Log in'}</a></p>
      </header>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="form-kicker">{isLogin ? 'Welcome back' : 'Seconds to get started'}</p>
        <h1 id="auth-title">{isLogin ? 'Log in to Elevate' : 'Create your Elevate account'}</h1>
        <p className="form-intro">{isLogin ? 'Enter your details to continue to your workspace.' : 'Bring your team and best ideas into one focused place.'}</p>
        <p className="auth-security-note"><span>✦</span> Secure access to your connected workspace</p>
        <form onSubmit={handleSubmit}>
          {!isLogin && <><label htmlFor="signup-name">Full name</label><input id="signup-name" autoComplete="name" value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} placeholder="Enter your full name" minLength="2" required />{!joiningWorkspace && <><label htmlFor="signup-organization">Organization</label><input id="signup-organization" value={form.organizationName} onChange={event => setForm({ ...form, organizationName: event.target.value })} placeholder="Your company or team name" minLength="2" required /></>}<label htmlFor="signup-mobile">Contact number</label><div className="signup-phone-control"><select aria-label="Country calling code" value={form.countryCode} onChange={event => setForm({ ...form, countryCode: event.target.value })}>{phoneCountries.map(([code, flag, country, dial]) => <option key={code} value={code}>{flag} {country} ({dial})</option>)}</select><input id="signup-mobile" type="tel" autoComplete="tel-national" maxLength="24" pattern="[0-9\s().-]{7,24}" value={form.mobile} onChange={event => setForm({ ...form, mobile: event.target.value })} placeholder="300 1234567" required /></div><label htmlFor="signup-age">Age <span className="auth-optional">Optional</span></label><input id="signup-age" className="auth-age-input" type="number" min="13" max="120" value={form.age} onChange={event => setForm({ ...form, age: event.target.value })} placeholder="13–120" /><div className="signup-photo-field"><span className="signup-photo-title">Profile photo <span className="auth-optional">Optional</span></span><div className="signup-photo-control"><div className="signup-photo-preview">{photoPreview ? <img src={photoPreview} alt="Selected profile preview" /> : <span>{form.fullName ? form.fullName.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() : '✦'}</span>}</div><div className="signup-photo-actions"><label className="signup-photo-button" htmlFor="signup-photo">{photoPreview ? 'Change image' : 'Add an image'}</label><small>JPG, PNG, GIF or WebP · Max 5 MB</small></div>{photoPreview && <button className="signup-photo-remove" type="button" aria-label="Remove profile image" title="Remove image" onClick={removePhoto}><TrashIcon /></button>}</div><input id="signup-photo" className="signup-photo-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={choosePhoto} />{photoError && <p className="signup-photo-error" role="alert">{photoError}</p>}</div></>}
          <label htmlFor={`${mode}-email`}>Email</label>
          <input id={`${mode}-email`} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} type="email" autoComplete="email" placeholder="Enter your email" required />
          <div className="password-label"><label htmlFor={`${mode}-password`}>Password</label>{isLogin && <a href="/reset-password">Forgot password?</a>}</div>
          <div className="password-input"><input id={`${mode}-password`} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Enter your password" minLength="8" maxLength="128" required /><button className="password-eye" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><EyeIcon visible={showPassword} /></button></div>
          {!isLogin && <><p className="password-hint">Use 8+ characters with uppercase, lowercase and a number.</p><div className="password-label confirm-label"><label htmlFor="signup-confirm-password">Confirm password</label></div><div className="password-input"><input id="signup-confirm-password" value={form.confirmPassword} onChange={event => setForm({ ...form, confirmPassword: event.target.value })} type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter your password" minLength="8" maxLength="128" required /><button className="password-eye" type="button" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} aria-pressed={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)}><EyeIcon visible={showConfirmPassword} /></button></div></>}
          {!isLogin && <label className="checkbox-row"><input type="checkbox" required /><span>I agree to the <a href={`/terms?returnTo=${legalReturn}`}>Terms of Service</a> and <a href={`/privacy?returnTo=${legalReturn}`}>Privacy Policy</a>.</span></label>}
          <button className="submit-button" type="submit" disabled={loading}>{loading ? 'Please wait…' : (isLogin ? 'Log in' : 'Sign up')} <span>→</span></button>
          {submitted && <p className="success-message">{isLogin ? 'You are successfully logged in.' : 'Your account is ready to begin.'}</p>}
          {error && <p className="error-message" role="alert">{error}</p>}
        </form>
        <p className="help-copy">Need help? <a href={`/help?returnTo=${legalReturn}`}>Visit our Help Center</a></p>
        <p className="legal">By continuing, you agree to our <a href={`/terms?returnTo=${legalReturn}`}>Terms of Service</a> and <a href={`/privacy?returnTo=${legalReturn}`}>Privacy Policy</a>.</p>
      </section>
      <footer><a href="#status">Status</a><span>© 2026 Elevate</span><a href="#privacy">Privacy</a></footer>
    </main>
  )
}

function EyeIcon({ visible }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.7" />{!visible && <path d="m4 4 16 16" />}</svg>
}

function TrashIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
}

export default AuthPage
