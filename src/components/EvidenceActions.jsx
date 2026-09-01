function EvidenceActions({ evidence = {}, onAttach }) {
  const fields = [
    { key: 'screenshot', icon: '▧', label: 'Attach screenshot', accept: 'image/*' },
    { key: 'audio', icon: '🎧', label: 'Attach audio', accept: 'audio/*' },
    { key: 'video', icon: '🎥', label: 'Attach video', accept: 'video/*' },
  ]

  return <span className="evidence-actions">{fields.map((field) => <label key={field.key} title={field.label} className={evidence[field.key] ? 'has-evidence' : ''}>{field.icon}<input type="file" accept={field.accept} onChange={(event) => onAttach(field.key, event.target.files[0])} /></label>)}</span>
}

export function EvidenceNames({ evidence = {} }) {
  const names = Object.entries(evidence).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`)
  return names.length ? <small className="evidence-names">{names.join(' · ')}</small> : null
}

export default EvidenceActions
