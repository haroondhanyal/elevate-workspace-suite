import { useState } from 'react'

function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function sendMessage(event) {
    event.preventDefault()
    if (!message.trim()) return
    setSent(true)
    setMessage('')
  }

  return <div className="support-widget">{open && <section className="chat-panel" aria-label="Customer support chat"><header><span className="support-logo">✦</span><div><strong>RH98 Support</strong><small>Usually replies instantly</small></div><button onClick={() => setOpen(false)}>×</button></header><div className="chat-messages"><div className="welcome-message"><span className="support-logo">✦</span><div><small>RH98 Support</small><p>Hi Raja! Welcome to RH98 Brand support. How can we help you today?</p></div></div>{sent && <div className="user-message">Thanks, I need help with my workspace.</div>}</div><form onSubmit={sendMessage}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type your message..." /><button type="submit">↑</button></form></section>}<button className={`chat-launcher ${open ? 'chat-open' : ''}`} onClick={() => setOpen(!open)} aria-label={open ? 'Close customer support' : 'Open customer support'}>{open ? '×' : '✦'}{!open && <i />}</button></div>
}

export default ChatWidget
