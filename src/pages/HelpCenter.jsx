import { useState } from 'react'

const faqs = [{ q: 'How do I create a task?', a: 'Open My tasks and choose New task. Add a name, project and priority, then select Create task.' }, { q: 'How can I invite a teammate?', a: 'Open your workspace menu and choose the invite option to send a secure team invitation.' }, { q: 'Where are my uploaded videos?', a: 'You can find and manage all uploaded videos in Media library from the sidebar.' }, { q: 'How do I update my profile?', a: 'Go to Settings, open Profile & account, update your details and choose Save changes.' }]

function HelpCenter() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(0)
  const filtered = faqs.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(query.toLowerCase()))
  return <main className="help-page"><header className="workspace-header"><a className="tasks-brand" href="/company/personal/user/1/tasks/"><span className="brand-mark">✦</span><span>RH98 Brand</span></a><a className="back-link" href="/company/personal/user/1/tasks/">← Back to workspace</a></header><section className="help-content"><p className="page-kicker">Support</p><h1>How can we help?</h1><p className="heading-note">Find an answer or send us your question.</p><label className="help-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help articles and common questions" /></label><div className="help-categories"><a href="#getting-started"><b>✦</b><strong>Getting started</strong><small>Learn the essentials</small></a><a href="#tasks"><b>✓</b><strong>Tasks & projects</strong><small>Organize your work</small></a><a href="/media"><b>▣</b><strong>Media library</strong><small>Upload and manage files</small></a></div><section className="faq-section"><h2>Popular questions</h2>{filtered.map((item, index) => <button className="faq-item" key={item.q} onClick={() => setOpen(open === index ? -1 : index)}><span>{item.q}</span><b>{open === index ? '−' : '+'}</b>{open === index && <p>{item.a}</p>}</button>)}{filtered.length === 0 && <p className="empty-state">No articles match your search.</p>}</section><div className="contact-support"><div><h2>Still need help?</h2><p>Our support team is here for you.</p></div><button className="new-task">Contact support →</button></div></section></main>
}

export default HelpCenter
