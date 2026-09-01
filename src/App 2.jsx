import { useState } from 'react'
import './App.css'

function App() {
  const [mode, setMode] = useState('signup')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const isSignup = mode === 'signup'

  function changeMode(nextMode) {
    setMode(nextMode)
    setSubmitted(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="auth-shell">
      <aside className="brand-panel">
        <a className="brand" href="/" aria-label="Flowspace home"><span className="brand-mark">✦</span><span>flowspace</span></a>
        <div className="brand-copy"><p className="eyebrow">A calmer way to work</p><h1>Make space for your best work.</h1><p className="brand-description">Plan projects, share ideas, and move work forward with your team, all in one focused place.</p></div>
        <div className="testimonial"><p>“The place where our scattered thoughts finally became a clear plan.”</p><span>— Maya Chen, Northstar Studio</span></div>
        <div className="brand-art" aria-hidden="true"><span className="art-line line-one" /><span className="art-line line-two" /><span className="art-orb orb-one" /><span className="art-orb orb-two" /><span className="art-orb orb-three" /></div>
      </aside>
      <section className="form-panel">
        <div className="mobile-brand brand"><span className="brand-mark">✦</span><span>flowspace</span></div>
        <div className="form-wrap">
          <div className="mode-switch" role="tablist" aria-label="Authentication mode"><button className={isSignup ? 'active' : ''} onClick={() => changeMode('signup')} role="tab" aria-selected={isSignup}>Sign up</button><button className={!isSignup ? 'active' : ''} onClick={() => changeMode('login')} role="tab" aria-selected={!isSignup}>Log in</button></div>
          <header className="form-heading"><p className="form-kicker">{isSignup ? 'Welcome to Flowspace' : 'Welcome back'}</p><h2>{isSignup ? 'Start creating momentum.' : 'Pick up where you left off.'}</h2><p>{isSignup ? 'Your new home for focused, collaborative work.' : 'Enter your details to access your workspace.'}</p></header>
          <button className="social-button" type="button"><span className="google-icon">G</span> Continue with Google</button>
          <div className="divider"><span>or continue with email</span></div>
          <form onSubmit={handleSubmit}><label htmlFor="email">Work email</label><input id="email" type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required /><div className="password-label"><label htmlFor="password">Password</label>{!isSignup && <a href="#forgot">Forgot password?</a>}</div><div className="password-input"><input id="password" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div>{isSignup && <label className="checkbox-row"><input type="checkbox" required /><span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</span></label>}<button className="submit-button" type="submit">{isSignup ? 'Create my workspace' : 'Log in'} <span>→</span></button>{submitted && <p className="success-message">{isSignup ? 'Your workspace is ready to begin.' : 'You are successfully logged in.'}</p>}</form>
          <p className="help-copy">{isSignup ? 'Already have an account?' : 'New to Flowspace?'} <button type="button" onClick={() => changeMode(isSignup ? 'login' : 'signup')}>{isSignup ? 'Log in' : 'Create an account'}</button></p><p className="legal">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
        </div>
        <footer><a href="#help">Help center</a><span>© 2026 Flowspace</span></footer>
      </section>
    </main>
  )
}

export default App
