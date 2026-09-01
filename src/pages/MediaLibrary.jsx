import { useState } from 'react'
import { isFirebaseConfigured, uploadVideoToStorage } from '../services/firebase'

const starterVideos = [{ id: 1, name: 'RH98 Brand introduction', type: 'MP4', size: '18.4 MB', date: 'Today', color: 'purple' }, { id: 2, name: 'Homepage walkthrough', type: 'MOV', size: '42.1 MB', date: 'Yesterday', color: 'orange' }]

function MediaLibrary() {
  const [videos, setVideos] = useState(starterVideos)
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const [uploading, setUploading] = useState(false)

  async function upload(event) {
    const files = [...event.target.files]
    if (!files.length) return
    setUploading(true)
    const additions = []
    for (const [index, file] of files.entries()) {
      try {
        const url = await uploadVideoToStorage(file)
        additions.push({ id: Date.now() + index, name: file.name.replace(/\.[^/.]+$/, ''), type: file.name.split('.').pop().toUpperCase(), size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, date: 'Just now', color: 'green', url })
      } catch {
        setNotice('Firebase upload failed. Check Storage rules and configuration.')
      }
    }
    setVideos([...additions, ...videos])
    setUploading(false)
    if (additions.length) setNotice(`${additions.length} video${additions.length > 1 ? 's' : ''} ${isFirebaseConfigured ? 'uploaded to Firebase Storage' : 'added locally'} successfully.`)
  }

  function remove(id) { setVideos(videos.filter((video) => video.id !== id)); setNotice('Video deleted.') }
  function rename(video) { const name = window.prompt('Update video name', video.name); if (name?.trim()) setVideos(videos.map((item) => item.id === video.id ? { ...item, name: name.trim() } : item)) }

  return <main className="media-page"><header className="workspace-header"><a className="tasks-brand" href="/company/personal/user/1/tasks/"><span className="brand-mark">✦</span><span>RH98 Brand</span></a><a className="back-link" href="/company/personal/user/1/tasks/">← Back to workspace</a></header><section className="media-content"><div className="tasks-heading"><div><p className="page-kicker">Workspace files</p><h1>Media library</h1><p className="heading-note">Upload, organize and share your creative files.</p></div><label className="new-task upload-label">{uploading ? 'Uploading...' : '＋ Upload video'}<input type="file" accept="video/*" multiple onChange={upload} disabled={uploading} /></label></div><div className="media-toolbar"><span>{videos.length} videos</span><button>▤ Sort: Recent</button><button>▦</button></div>{notice && <p className="success-message">{notice}</p>}<div className="video-grid">{videos.map((video) => <article className="video-card" key={video.id}><div className={`video-thumb ${video.color}`}><span>▶</span><small>{video.type}</small></div><div className="video-info"><h2>{video.name}</h2><p>{video.size} · Uploaded {video.date}</p><div><button onClick={() => setEditing(video)}>Preview</button><button onClick={() => rename(video)}>Rename</button><button className="delete-button" onClick={() => remove(video.id)}>Delete</button></div></div>{editing?.id === video.id && <div className="preview-overlay" onClick={() => setEditing(null)}><div onClick={(event) => event.stopPropagation()}><button onClick={() => setEditing(null)}>×</button>{video.url ? <video src={video.url} controls /> : <span>▶</span>}<h2>{video.name}</h2><p>{video.url ? 'Uploaded video preview' : 'Local preview placeholder'}</p></div></div>}</article>)}{videos.length === 0 && <div className="upload-empty"><span>＋</span><h2>Your media library is empty</h2><p>Upload your first video to get started.</p></div>}</div></section></main>
}

export default MediaLibrary
