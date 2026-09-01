import { useState } from 'react'

function AuthPage({ mode }) {
  const isLogin = mode === 'login'
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <a className="brand" href="/signup" aria-label="RH98 Brand home"><span className="brand-mark">✦</span><span>RH98 Brand</span></a>
        <p>{isLogin ? 'Don’t have an account?' : 'Already have an account?'} <a href={isLogin ? '/signup' : '/login'}>{isLogin ? 'Sign up' : 'Log in'}</a></p>
      </header>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="form-kicker">{isLogin ? 'Welcome back' : 'Seconds to get started'}</p>
        <h1 id="auth-title">{isLogin ? 'Log in to RH98 Brand' : 'Create your RH98 Brand account'}</h1>
        <p className="form-intro">{isLogin ? 'Enter your details to continue to your workspace.' : 'Bring your team and best ideas into one focused place.'}</p>
        <button className="social-button" type="button"><span className="google-icon">G</span> Continue with Google</button>
        <button className="sso-button" type="button"><span className="sso-icon">▦</span> Continue with SSO</button>
        <div className="divider"><span>or</span></div>
        <form onSubmit={handleSubmit}>
          <label htmlFor={`${mode}-email`}>Email</label>
          <input id={`${mode}-email`} type="email" placeholder="Enter your email" required />
          <div className="password-label"><label htmlFor={`${mode}-password`}>Password</label>{isLogin && <a href="#forgot">Forgot password?</a>}</div>
          <div className="password-input"><input id={`${mode}-password`} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" minLength="8" required /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div>
          {!isLogin && <label className="checkbox-row"><input type="checkbox" required /><span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</span></label>}
          <button className="submit-button" type="submit">{isLogin ? 'Log in' : 'Sign up'} <span>→</span></button>
          {submitted && <p className="success-message">{isLogin ? 'You are successfully logged in.' : 'Your account is ready to begin.'}</p>}
        </form>
        <p className="help-copy">Need help? <a href="#help">Visit our Help Center</a></p>
        <p className="legal">By continuing, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</p>
      </section>
      <footer><a href="#status">Status</a><span>© 2026 RH98 Brand</span><a href="#privacy">Privacy</a></footer>
    </main>
  )
}

export default AuthPage
