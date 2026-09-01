import { useState } from 'react'

const defaultProfile = { name: 'Raja Haroon', email: 'raja@rh98brand.com', mobile: '+92 300 1234567', address: 'Lahore, Pakistan', dob: '1998-09-12', photo: '' }

function ProfileSettings() {
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('rh98-profile') || JSON.stringify(defaultProfile)))
  const [saved, setSaved] = useState(false)

  function update(field, value) { setProfile({ ...profile, [field]: value }); setSaved(false) }
  function uploadPhoto(event) { const file = event.target.files[0]; if (file) update('photo', URL.createObjectURL(file)) }
  function save(event) { event.preventDefault(); localStorage.setItem('rh98-profile', JSON.stringify(profile)); setSaved(true) }

  return <main className="settings-page"><header className="workspace-header"><a className="tasks-brand" href="/company/personal/user/1/tasks/"><span className="brand-mark">✦</span><span>RH98 Brand</span></a><a className="back-link" href="/company/personal/user/1/tasks/">← Back to workspace</a></header><div className="settings-layout"><aside className="settings-nav"><p className="page-kicker">Account</p><h2>Settings</h2><a className="settings-active" href="/settings/profile">Profile & account</a><a href="/settings/notifications">Notifications</a><a href="/settings/security">Security</a><a href="/settings/workspace">Workspace</a><a href="/media">Media library</a></aside><section className="settings-card"><p className="page-kicker">Personal details</p><h1>Profile & account</h1><p className="heading-note">Keep your personal information up to date.</p><form onSubmit={save}><div className="photo-row"><div className="profile-photo">{profile.photo ? <img src={profile.photo} alt="Profile" /> : <span>RH</span>}</div><div><strong>Profile picture</strong><p>JPG, PNG or GIF. Max 5MB.</p><label className="upload-button" htmlFor="photo-upload">Upload picture</label><input id="photo-upload" type="file" accept="image/*" onChange={uploadPhoto} /></div></div><div className="settings-fields"><div><label htmlFor="name">Full name</label><input id="name" value={profile.name} onChange={(event) => update('name', event.target.value)} /></div><div><label htmlFor="email">Email address</label><input id="email" type="email" value={profile.email} onChange={(event) => update('email', event.target.value)} /></div><div><label htmlFor="mobile">Mobile number</label><input id="mobile" value={profile.mobile} onChange={(event) => update('mobile', event.target.value)} /></div><div><label htmlFor="dob">Date of birth</label><input id="dob" type="date" value={profile.dob} onChange={(event) => update('dob', event.target.value)} /></div><div className="field-full"><label htmlFor="address">Address</label><textarea id="address" rows="3" value={profile.address} onChange={(event) => update('address', event.target.value)} /></div></div><div className="settings-actions"><a href="/company/personal/user/1/tasks/">Cancel</a><button className="submit-button" type="submit">Save changes <span>→</span></button></div>{saved && <p className="success-message">Profile updated successfully.</p>}</form></section></div></main>
}

export default ProfileSettings
