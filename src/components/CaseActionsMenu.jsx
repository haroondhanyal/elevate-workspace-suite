import { useState } from 'react'
import EvidenceActions from './EvidenceActions'

function CaseActionsMenu({ item, onEdit, onDelete, onAttach }) {
  const [open, setOpen] = useState(false)

  return <span className="case-menu"><button className="case-menu-trigger" type="button" onClick={() => setOpen(!open)} aria-label={`Open actions for ${item.id}`} aria-expanded={open}>•••</button>{open && <span className="case-menu-dropdown"><button type="button" onClick={() => { onEdit(item); setOpen(false) }}>Edit case</button><button className="menu-delete" type="button" onClick={() => { onDelete(item.id); setOpen(false) }}>Delete case</button><span className="menu-divider" /><small>Attach evidence</small><EvidenceActions evidence={item.evidence} onAttach={(kind, file) => { onAttach(item.id, kind, file); setOpen(false) }} /></span>}</span>
}

export default CaseActionsMenu
