import { useMemo, useState } from 'react'
import './HelpCenter.css'

const faqs = [
  { category: 'Getting started', q: 'How do I create my Elevate account?', a: 'Choose Sign up, add your name, organization, contact number and password. An optional profile photo and age can be added too.' },
  { category: 'Getting started', q: 'I forgot my password. How can I reset it?', a: 'Choose “Forgot password?” on the login page, enter your account email, then follow the reset link. Password recovery needs the workspace administrator to have email delivery configured.' },
  { category: 'Projects & quality', q: 'How do I create a task?', a: 'Open My tasks and choose New task. Add a title, project, priority and any details, then select Create task.' },
  { category: 'Projects & quality', q: 'Where can I track tests and requirements?', a: 'Open TestRail from the workspace navigation to review test cases, UAT, user stories and the requirements traceability matrix.' },
  { category: 'Account & workspace', q: 'How do I update my profile?', a: 'Open Settings, choose Profile & account, update your information and select Save changes.' },
  { category: 'Account & workspace', q: 'How do I invite or switch workspaces?', a: 'Open People & workspace from the account menu to manage invitations. If you belong to more than one workspace, use the workspace selector in the top bar.' },
  { category: 'Account & workspace', q: 'Where are my uploaded files?', a: 'Open Media library to browse and manage workspace media. Profile photos are managed from Profile & account settings.' },
]

function HelpCenter() {
  const params = new URLSearchParams(window.location.search)
  const requestedReturn = params.get('returnTo')
  const returnTo = requestedReturn?.startsWith('/signup') && !requestedReturn.startsWith('//') ? requestedReturn : '/signup'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All topics')
  const [open, setOpen] = useState(faqs[0].q)
  const filtered = useMemo(() => faqs.filter(item => (category === 'All topics' || item.category === category) && `${item.q} ${item.a}`.toLowerCase().includes(query.trim().toLowerCase())), [query, category])
  const categories = ['All topics', 'Getting started', 'Projects & quality', 'Account & workspace']

  return <main className="help-center-page">
    <header className="help-center-topbar"><a className="legal-brand" href="/workspace"><span>✦</span> Elevate <small>SUPPORT</small></a><a className="legal-signup-link" href={returnTo}>Back to sign up <b>→</b></a></header>
    <section className="help-center-hero"><div><p>HELP CENTER</p><h1>How can we help?</h1><span>Quick answers to help you get moving with Elevate.</span><label className="help-center-search"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search accounts, tasks, projects…" aria-label="Search help articles" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>×</button>}</label></div><div className="help-orbit" aria-hidden="true"><i>✦</i></div></section>
    <section className="help-center-content"><div className="help-category-row">{categories.map((item, index) => <button className={category === item ? 'selected' : ''} key={item} onClick={() => setCategory(item)}><i>{['✦', '↗', '✓', '◎'][index]}</i>{item}</button>)}</div><div className="help-center-grid"><aside className="help-contact-card"><div>✦</div><p>HERE FOR YOU</p><h2>Still need help?</h2><span>Your workspace administrator can help with access, invitations and account questions.</span><a href={returnTo}>Return to sign up <b>→</b></a></aside><section className="help-faq-card"><header><div><p>ANSWERS</p><h2>Popular questions</h2></div><span>{filtered.length} articles</span></header>{filtered.map(item => <article className={`help-faq ${open === item.q ? 'is-open' : ''}`} key={item.q}><button aria-expanded={open === item.q} onClick={() => setOpen(open === item.q ? '' : item.q)}><span><small>{item.category}</small><b>{item.q}</b></span><i>{open === item.q ? '−' : '+'}</i></button>{open === item.q && <p>{item.a}</p>}</article>)}{!filtered.length && <div className="help-no-results">No results for “{query}”. Try another search term or choose a different topic.</div>}</section></div></section>
    <footer className="help-center-footer"><a href="/signup">Elevate Workspace</a><nav><a href={returnTo}>Sign up</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></nav><span>© 2026 Elevate</span></footer>
  </main>
}

export default HelpCenter
