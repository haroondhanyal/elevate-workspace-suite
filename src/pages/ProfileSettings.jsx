import { useEffect, useState } from 'react'
import { getCurrentUser, getWorkspaceFilePreview, isBackendSession, updateCurrentUser, uploadWorkspaceFile } from '../services/auth'

const defaultProfile = { name: 'Raja Haroon', email: 'raja@example.com', mobile: '', address: '', dob: '', age: '', photo: '', avatarUrl: '' }
const localProfileKey = 'elevate-profile-details'

function ProfileSettings() {
  const [profile, setProfile] = useState(() => {
    try { return { ...defaultProfile, ...JSON.parse(localStorage.getItem(localProfileKey) || '{}') } }
    catch { return defaultProfile }
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(isBackendSession())
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ageEditing, setAgeEditing] = useState(false)
  const [previewObjectUrl, setPreviewObjectUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isBackendSession()) return
    let active = true
    getCurrentUser().then(async user => {
      const preview = user.avatar_url ? await getWorkspaceFilePreview(user.avatar_url) : ''
      if (active) {
        if (preview.startsWith('blob:')) setPreviewObjectUrl(preview)
        setProfile(current => ({ ...current, name: user.full_name, email: user.email, mobile: user.mobile || current.mobile, address: user.address || current.address, dob: user.date_of_birth || current.dob, age: user.age ?? current.age, photo: preview || current.photo, avatarUrl: user.avatar_url || current.avatarUrl }))
      } else if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    }).catch(requestError => { if (active) setError(`Profile could not be loaded: ${requestError.message}`) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => () => { if (previewObjectUrl.startsWith('blob:')) URL.revokeObjectURL(previewObjectUrl) }, [previewObjectUrl])

  function update(field, value) { setProfile(current => ({ ...current, [field]: value })); setSaved(false) }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Profile pictures must be 5 MB or smaller.'); return }
    setUploading(true); setError('')
    try {
      const uploaded = await uploadWorkspaceFile(file)
      if (uploaded.previewUrl.startsWith('blob:')) setPreviewObjectUrl(uploaded.previewUrl)
      setProfile(current => ({ ...current, photo: uploaded.previewUrl, avatarUrl: uploaded.url }))
      setSaved(false)
    } catch (requestError) { setError(requestError.message) }
    finally { setUploading(false); event.target.value = '' }
  }

  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setSaved(false)
    try {
      if (isBackendSession()) await updateCurrentUser({ full_name: profile.name, avatar_url: profile.avatarUrl || null, mobile: profile.mobile, address: profile.address, date_of_birth: profile.dob || null, age: profile.age === '' ? null : Number(profile.age) })
      localStorage.setItem(localProfileKey, JSON.stringify(isBackendSession() ? { mobile: profile.mobile, address: profile.address, dob: profile.dob, age: profile.age } : profile))
      setSaved(true)
    } catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }

  return <main className="settings-page"><header className="workspace-header"><a className="tasks-brand" href="/company/personal/user/1/tasks/"><span className="brand-mark">✦</span><span>Elevate</span></a><a className="back-link" href="/company/personal/user/1/tasks/">← Back to workspace</a></header><div className="settings-layout"><aside className="settings-nav"><p className="page-kicker">Account</p><h2>Settings</h2><a className="settings-active" href="/settings/profile">Profile & account</a><a href="/settings/notifications">Notifications</a><a href="/settings/security">Security</a><a href="/settings/workspace">Workspace</a><a href="/media">Media library</a></aside><section className="settings-card"><p className="page-kicker">Personal details</p><h1>Profile & account</h1><p className="heading-note">Keep your personal information up to date.</p>{loading && <p role="status">Loading your account…</p>}<form onSubmit={save}><div className="photo-row"><div className="profile-photo">{profile.photo ? <img src={profile.photo} alt="Profile" /> : <span>{profile.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</span>}</div><div><strong>Profile picture</strong><p>JPG, PNG or GIF. Max 5MB.</p><label className="upload-button" htmlFor="photo-upload">{uploading ? 'Uploading…' : 'Upload picture'}</label><input id="photo-upload" type="file" accept="image/*" onChange={uploadPhoto} disabled={uploading} /></div></div><div className="settings-fields"><div><label htmlFor="name">Full name</label><input id="name" value={profile.name} onChange={event => update('name', event.target.value)} required /></div><div><label htmlFor="email">Email address</label><input id="email" type="email" value={profile.email} readOnly={isBackendSession()} onChange={event => update('email', event.target.value)} /></div><div><label htmlFor="mobile">Mobile number</label><input id="mobile" value={profile.mobile} onChange={event => update('mobile', event.target.value)} /></div><div><label htmlFor="dob">Date of birth</label><input id="dob" type="date" value={profile.dob} onChange={event => update('dob', event.target.value)} /></div><div className="age-profile-field"><label htmlFor="age">Age</label><div className="age-profile-control"><input id="age" type="number" min="13" max="120" value={profile.age} disabled={!ageEditing} placeholder="Not set" onChange={event => update('age', event.target.value)} /><button type="button" aria-label={ageEditing ? 'Finish editing age' : 'Edit age'} title={ageEditing ? 'Finish editing age' : 'Edit age'} onClick={() => setAgeEditing(value => !value)}>{ageEditing ? '✓' : <PencilIcon />}</button><button type="button" aria-label="Delete age" title="Delete age" onClick={() => { update('age', ''); setAgeEditing(true) }}><TrashIcon /></button></div></div><div className="field-full"><label htmlFor="address">Address</label><textarea id="address" rows="3" value={profile.address} onChange={event => update('address', event.target.value)} /></div></div><div className="settings-actions"><a href="/company/personal/user/1/tasks/">Cancel</a><button className="submit-button" type="submit" disabled={saving || loading}>{saving ? 'Saving…' : 'Save changes'} <span>→</span></button></div>{error && <p className="error-message" role="alert">{error}</p>}{saved && <p className="success-message" role="status">Profile updated successfully.</p>}</form></section></div></main>
}

function PencilIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z" /></svg> }
function TrashIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg> }

export default ProfileSettings
