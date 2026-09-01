import { useEffect, useState } from 'react'
import { applyTheme, getStoredTheme, themes } from '../../utils/theme'

const themeCards = [
  { id: 'light', preview: 'light', swatches: ['#ffffff', '#f3f4f7', '#70409a'] },
  { id: 'dark', preview: 'dark', swatches: ['#211b2a', '#2b2335', '#9b6bc2'] },
  { id: 'grey', preview: 'grey', swatches: ['#f1f2f4', '#363a40', '#6d737c'] },
  { id: 'blue', preview: 'blue', swatches: ['#edf4fb', '#20364d', '#477eae'] },
  { id: 'contrast', preview: 'contrast', swatches: ['#000000', '#ffffff', '#ffe500'] },
]

function ThemeSettings() {
  const [selected, setSelected] = useState(getStoredTheme())
  const [saved, setSaved] = useState(false)

  useEffect(() => applyTheme(selected), [selected])

  function chooseTheme(id) {
    setSelected(id)
    setSaved(false)
    applyTheme(id)
  }

  return <main className="theme-settings-page"><header className="workspace-header"><a className="jira-logo" href="/jira"><span>✦</span> RH98 <small>JIRA</small></a><a className="back-link" href="/jira">← Back to dashboard</a></header><div className="theme-settings-layout"><aside className="settings-nav"><p className="jira-kicker">App settings</p><h2>Settings</h2><a href="/jira/customize">Project details</a><a className="settings-active" href="/jira/settings/theme">App theme</a><a href="/settings/profile">Profile & account</a><a href="/settings/notifications">Notifications</a><a href="/help">Help center</a></aside><section className="theme-settings-card"><p className="jira-kicker">Appearance</p><h1>Choose your app theme</h1><p className="heading-note">Customize the look and feel of your RH98 workspace.</p><div className="theme-grid">{themeCards.map((theme) => <button className={`theme-card ${selected === theme.id ? 'theme-selected' : ''}`} key={theme.id} onClick={() => chooseTheme(theme.id)}><div className={`theme-preview ${theme.preview}`}><span /><span /><span /><i /></div><div className="theme-card-copy"><strong>{themes[theme.id].label}</strong><small>{themes[theme.id].description}</small></div><div className="theme-swatches">{theme.swatches.map((swatch) => <i style={{ background: swatch }} key={swatch} />)}</div><span className="theme-check">{selected === theme.id ? '✓' : ''}</span></button>)}</div><div className="theme-actions"><span>{saved ? 'Theme preference saved' : 'Changes apply instantly'}</span><button className="jira-primary" onClick={() => { applyTheme(selected); setSaved(true) }}>Save preference</button></div></section></div></main>
}

export default ThemeSettings
