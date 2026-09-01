import { useState } from 'react'
import { applyTheme, getStoredTheme, themes } from '../utils/theme'
import './ThemeToggle.css'

function ThemeToggle() {
  const [selected, setSelected] = useState(getStoredTheme)
  const [open, setOpen] = useState(false)
  const icons = { light: '☼', dark: '☾', grey: '◐', blue: '◈', contrast: '◑' }
  function choose(theme) { applyTheme(theme); setSelected(theme); setOpen(false) }
  return <div className="theme-switcher"><button className="theme-toggle" type="button" onClick={() => setOpen(!open)} aria-label="Choose theme" aria-expanded={open}>{icons[selected] || '☾'}</button>{open && <div className="theme-menu" role="menu"><p>APPEARANCE</p>{Object.entries(themes).map(([key, theme]) => <button key={key} className={selected === key ? 'theme-active' : ''} onClick={() => choose(key)} role="menuitem"><span>{icons[key]}</span><b>{theme.label}</b><small>{theme.description}</small>{selected === key && <i>✓</i>}</button>)}</div>}</div>
}

export default ThemeToggle
