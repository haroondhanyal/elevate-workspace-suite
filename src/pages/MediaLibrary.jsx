import { useEffect, useRef, useState } from 'react'
import { isFirebaseConfigured, uploadVideoToStorage } from '../services/firebase'
import { getWorkspaceFilePreview, isBackendSession, uploadWorkspaceFile } from '../services/auth'
import useWorkspaceCollection from '../hooks/useWorkspaceCollection'

const starterVideos = [{ id: 1, name: 'Elevate introduction', type: 'MP4', size: '18.4 MB', date: 'Today', color: 'purple' }, { id: 2, name: 'Homepage walkthrough', type: 'MOV', size: '42.1 MB', date: 'Yesterday', color: 'orange' }]

function MediaLibrary() {
  const { data: videos, saveData: saveVideos, loading, error } = useWorkspaceCollection('media-library', starterVideos)
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState({})
  const previewUrlsRef = useRef({})

  useEffect(() => {
    let active = true
    Promise.all(videos.map(async video => {
      if (!video.url || video.url.startsWith('data:') || previewUrlsRef.current[video.id]) return
      try {
        const preview = await getWorkspaceFilePreview(video.url)
        if (active) {
          previewUrlsRef.current[video.id] = preview
          setPreviewUrls(current => ({ ...current, [video.id]: preview }))
        } else if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
      } catch { /* A missing private file leaves the card available with its placeholder preview. */ }
    }))
    return () => { active = false }
  }, [videos])

  useEffect(() => () => Object.values(previewUrlsRef.current).forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url) }), [])

  async function upload(event) {
    const files = [...event.target.files]
    if (!files.length) return
    setUploading(true)
    const additions = []
    for (const [index, file] of files.entries()) {
      try {
        const uploaded = isBackendSession() ? await uploadWorkspaceFile(file) : isFirebaseConfigured ? { url: await uploadVideoToStorage(file) } : { url: null }
        const id = Date.now() + index
        const previewUrl = uploaded.previewUrl || (uploaded.url ? URL.createObjectURL(file) : '')
        if (previewUrl.startsWith('blob:')) { previewUrlsRef.current[id] = previewUrl; setPreviewUrls(current => ({ ...current, [id]: previewUrl })) }
        additions.push({ id, name: file.name.replace(/\.[^/.]+$/, ''), type: file.name.split('.').pop().toUpperCase(), size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, date: 'Just now', color: 'green', url: uploaded.url })
      } catch {
        setNotice('Firebase upload failed. Check Storage rules and configuration.')
      }
    }
    if (additions.length) await saveVideos([...additions, ...videos])
    setUploading(false)
    if (additions.length) setNotice(`${additions.length} video${additions.length > 1 ? 's' : ''} ${isFirebaseConfigured ? 'uploaded to Firebase Storage' : 'added locally'} successfully.`)
  }

  function remove(id) { saveVideos(videos.filter((video) => video.id !== id)); setNotice('Video removed from the library.') }
  function rename(video) { const name = window.prompt('Update video name', video.name); if (name?.trim()) saveVideos(videos.map((item) => item.id === video.id ? { ...item, name: name.trim() } : item)) }

  return <main className="media-page"><header className="workspace-header"><a className="tasks-brand" href="/company/personal/user/1/tasks/"><span className="brand-mark">✦</span><span>Elevate</span></a><a className="back-link" href="/company/personal/user/1/tasks/">← Back to workspace</a></header><section className="media-content"><div className="tasks-heading"><div><p className="page-kicker">Workspace files</p><h1>Media library</h1><p className="heading-note">Upload, organize and share your creative files.</p></div><label className="new-task upload-label">{uploading ? 'Uploading...' : '＋ Upload video'}<input type="file" accept="video/*" multiple onChange={upload} disabled={uploading} /></label></div><div className="media-toolbar"><span>{videos.length} videos</span><button>▤ Sort: Recent</button><button>▦</button></div>{error && <p className="error-message" role="alert">Could not save media library: {error}</p>}{notice && <p className="success-message" role="status">{notice}</p>}{loading ? <p className="empty-state">Loading media…</p> : <div className="video-grid">{videos.map((video) => <article className="video-card" key={video.id}><div className={`video-thumb ${video.color}`}><span>▶</span><small>{video.type}</small></div><div className="video-info"><h2>{video.name}</h2><p>{video.size} · Uploaded {video.date}</p><div><button onClick={() => setEditing(video)}>Preview</button><button onClick={() => rename(video)}>Rename</button><button className="delete-button" onClick={() => remove(video.id)}>Delete</button></div></div>{editing?.id === video.id && <div className="preview-overlay" onClick={() => setEditing(null)}><div onClick={(event) => event.stopPropagation()}><button onClick={() => setEditing(null)}>×</button>{previewUrls[video.id] ? <video src={previewUrls[video.id]} controls /> : <span>▶</span>}<h2>{video.name}</h2><p>{video.url ? 'Uploaded video preview' : 'Local preview placeholder'}</p></div></div>}</article>)}{videos.length === 0 && <div className="upload-empty"><span>＋</span><h2>Your media library is empty</h2><p>Upload your first video to get started.</p></div>}</div>}</section></main>
}

export default MediaLibrary
