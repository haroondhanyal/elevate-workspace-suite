const apiUrl = import.meta.env.VITE_ERP_API_URL?.replace(/\/$/, '')
const authKey = 'elevate-auth-session'

async function request(path, options = {}) {
  if (!apiUrl) throw new Error('API is not configured. Set VITE_ERP_API_URL in .env and start Docker services.')
  const response = await fetch(`${apiUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = Array.isArray(payload.detail) ? payload.detail.map(item => item.msg || String(item)).join('; ') : payload.detail
    const error = new Error(typeof detail === 'string' ? detail : 'Unable to complete this request.')
    error.status = response.status
    if (response.status === 401 && getSession()?.access_token && !path.startsWith('/auth/login')) {
      signOut()
      window.dispatchEvent(new Event('elevate:session-expired'))
    }
    throw error
  }
  return payload
}

export async function signUp(payload) {
  const session = await request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) })
  sessionStorage.setItem(authKey, JSON.stringify(session))
  return session
}

export async function signIn(payload) {
  const session = await request('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
  sessionStorage.setItem(authKey, JSON.stringify(session))
  return session
}

export function getSession() {
  try {
    const current = sessionStorage.getItem(authKey)
    if (current) return JSON.parse(current)
    const legacy = localStorage.getItem(authKey)
    if (!legacy) return null
    sessionStorage.setItem(authKey, legacy)
    localStorage.removeItem(authKey)
    return JSON.parse(legacy)
  } catch { return null }
}

export function signOut() { sessionStorage.removeItem(authKey); localStorage.removeItem(authKey) }

export async function logoutCurrentSession() {
  const token = getSession()?.access_token
  signOut()
  if (!apiUrl || !token) return
  try { await fetch(`${apiUrl}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }) }
  catch { /* The local session is cleared even when the server is offline. */ }
}

export function isBackendSession() { return Boolean(apiUrl && getSession()?.access_token && getSession()?.organization_id) }
export function isApiConfigured() { return Boolean(apiUrl) }

export function listOrganizations() { return authenticatedRequest('/organizations') }

export async function selectOrganization(organizationId) {
  const session = await authenticatedRequest('/auth/select-organization', { method: 'POST', body: JSON.stringify({ organization_id: organizationId }) })
  sessionStorage.setItem(authKey, JSON.stringify(session))
  return session
}

export function listOrganizationMembers(organizationId) { return authenticatedRequest(`/organizations/${organizationId}/members`) }
export function listInvitations(organizationId) { return authenticatedRequest(`/organizations/${organizationId}/invitations`) }
export function inviteWorkspaceMember(organizationId, payload) {
  return authenticatedRequest(`/organizations/${organizationId}/invitations`, { method: 'POST', body: JSON.stringify(payload) })
}
export function acceptWorkspaceInvitation(token) {
  return authenticatedRequest('/invitations/accept', { method: 'POST', body: JSON.stringify({ token }) })
}
export function listApprovals(organizationId) { return authenticatedRequest(`/organizations/${organizationId}/approvals`) }
export function createApproval(organizationId, payload) {
  return authenticatedRequest(`/organizations/${organizationId}/approvals`, { method: 'POST', body: JSON.stringify(payload) })
}
export function decideApproval(id, decision, note = '') {
  return authenticatedRequest(`/approvals/${id}/decision`, { method: 'PATCH', body: JSON.stringify({ decision, note }) })
}

export async function downloadSalesReport() {
  const session = getSession()
  if (!session?.organization_id) throw new Error('Sign in to export a sales report.')
  const response = await fetch(`${apiUrl}/organizations/${session.organization_id}/reports/sales.csv`, { headers: { Authorization: `Bearer ${session.access_token}` } })
  if (!response.ok) throw new Error('Unable to download the sales report.')
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url; link.download = 'elevate-sales-report.csv'; link.click()
  URL.revokeObjectURL(url)
}

export function requestPasswordReset(email) {
  return request('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) })
}

export function confirmPasswordReset(token, password) {
  return request('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) })
}

function workspaceStorageKey(key) {
  const session = getSession()
  return `elevate-workspace-${session?.organization_id || 'local'}-${key}`
}

export async function loadWorkspaceData(key, fallback) {
  const organizationId = getSession()?.organization_id
  if (apiUrl && organizationId) {
    try {
      const record = await authenticatedRequest(`/organizations/${organizationId}/data/${encodeURIComponent(key)}`)
      return record.value
    } catch (error) {
      if (error.status !== 404) throw error
      return fallback
    }
  }
  try {
    const saved = localStorage.getItem(workspaceStorageKey(key))
    return saved === null ? fallback : JSON.parse(saved)
  } catch {
    return fallback
  }
}

export async function saveWorkspaceData(key, value) {
  const session = getSession()
  const organizationId = session?.organization_id
  if (apiUrl && organizationId) {
    return authenticatedRequest(`/organizations/${organizationId}/data/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value, actor: session.user?.full_name || 'Workspace member' }),
    })
  }
  localStorage.setItem(workspaceStorageKey(key), JSON.stringify(value))
  return { value }
}

export function getCurrentUser() { return authenticatedRequest('/auth/me') }

export function updateCurrentUser(payload) {
  return authenticatedRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function uploadWorkspaceFile(file) {
  const session = getSession()
  if (!apiUrl || !session?.access_token) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ url: reader.result, previewUrl: reader.result })
      reader.onerror = () => reject(new Error('Unable to read this file.'))
      reader.readAsDataURL(file)
    })
  }
  const rootUrl = apiUrl.replace(/\/api\/v1\/?$/, '')
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${rootUrl}/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: formData })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.detail || 'Unable to upload this file.')
  return { ...payload, url: `${rootUrl}${payload.url}`, previewUrl: URL.createObjectURL(file) }
}

export async function getWorkspaceFilePreview(url) {
  if (!url || url.startsWith('data:')) return url
  let parsed
  try { parsed = new URL(url, window.location.origin) } catch { return url }
  if (!parsed.pathname.startsWith('/uploads/')) return url
  const uploadsOrigin = apiUrl?.replace(/\/api\/v1\/?$/, '')
  if (!uploadsOrigin || parsed.origin !== new URL(uploadsOrigin).origin) throw new Error('This file URL is outside the current workspace.')
  const session = getSession()
  if (!session?.access_token) throw new Error('Sign in to view this file.')
  const response = await fetch(parsed.href, { headers: { Authorization: `Bearer ${session.access_token}` } })
  if (!response.ok) {
    if (response.status === 401) { signOut(); window.dispatchEvent(new Event('elevate:session-expired')) }
    throw new Error('This file is unavailable or you do not have access.')
  }
  return URL.createObjectURL(await response.blob())
}

export async function authenticatedRequest(path, options = {}) {
  const token = getSession()?.access_token
  return request(path, { ...options, headers: { Authorization: `Bearer ${token}`, ...options.headers } })
}

export function getDashboardSummary() {
  const organizationId = getSession()?.organization_id
  if (!organizationId) return Promise.resolve(null)
  return authenticatedRequest(`/organizations/${organizationId}/dashboard`)
}

export function searchWorkspace(query) {
  const organizationId = getSession()?.organization_id
  if (!organizationId || !query.trim()) return Promise.resolve([])
  return authenticatedRequest(`/organizations/${organizationId}/search?q=${encodeURIComponent(query.trim())}`)
}

export function getNotifications() { return authenticatedRequest('/notifications') }

export function markAllNotificationsRead() {
  if (!isBackendSession()) return Promise.resolve([])
  return authenticatedRequest('/notifications/read-all', { method: 'PATCH' })
}

export function markNotificationRead(id) { return authenticatedRequest(`/notifications/${id}/read`, { method: 'PATCH' }) }

export function subscribeNotifications(onNotification) {
  const token = getSession()?.access_token
  if (!apiUrl || !token || !window.WebSocket) return () => {}
  const socketUrl = `${apiUrl.replace(/^http/, 'ws')}/notifications/ws?token=${encodeURIComponent(token)}`
  let socket
  let retryTimer
  let delay = 1000
  let stopped = false
  const connect = () => {
    if (stopped || document.visibilityState === 'hidden') return
    socket = new WebSocket(socketUrl)
    socket.onopen = () => { delay = 1000 }
    socket.onmessage = event => { try { onNotification(JSON.parse(event.data)) } catch { /* Ignore malformed socket messages. */ } }
    socket.onclose = () => {
      if (!stopped) { retryTimer = window.setTimeout(connect, delay); delay = Math.min(delay * 2, 30000) }
    }
    socket.onerror = () => socket.close()
  }
  const onVisibility = () => {
    if (document.visibilityState === 'visible' && (!socket || socket.readyState === WebSocket.CLOSED)) connect()
    else if (document.visibilityState === 'hidden' && socket?.readyState < WebSocket.CLOSING) socket.close()
  }
  document.addEventListener('visibilitychange', onVisibility)
  connect()
  return () => { stopped = true; window.clearTimeout(retryTimer); document.removeEventListener('visibilitychange', onVisibility); socket?.close() }
}

export async function listSalesOrders() {
  const organizationId = getSession()?.organization_id
  if (!organizationId) return null
  return authenticatedRequest(`/organizations/${organizationId}/sales-orders`)
}

export async function createSalesOrder(payload) {
  const organizationId = getSession()?.organization_id
  if (!organizationId) throw new Error('Please sign in before creating a sales order.')
  return authenticatedRequest(`/organizations/${organizationId}/sales-orders`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function getWorkspaceProject() {
  const projects = await listWorkspaceProjects()
  return projects[0] || null
}

export async function listWorkspaceProjects() {
  const organizationId = getSession()?.organization_id
  if (apiUrl && organizationId) return authenticatedRequest(`/organizations/${organizationId}/projects`)
  try { return JSON.parse(localStorage.getItem('elevate-workspace-projects') || '[]') } catch { return [] }
}

export async function createWorkspaceProject(payload) {
  const organizationId = getSession()?.organization_id
  if (apiUrl && organizationId) {
    return authenticatedRequest(`/organizations/${organizationId}/projects`, { method: 'POST', body: JSON.stringify(payload) })
  }
  const projects = await listWorkspaceProjects()
  const project = { ...payload, id: Date.now(), organization_id: null, status: 'active' }
  localStorage.setItem('elevate-workspace-projects', JSON.stringify([project, ...projects]))
  return project
}

export function listIssues(projectId) { return authenticatedRequest(`/projects/${projectId}/issues`) }
export function createIssue(projectId, payload) { return authenticatedRequest(`/projects/${projectId}/issues`, { method: 'POST', body: JSON.stringify(payload) }) }
export function updateIssue(id, payload) { return authenticatedRequest(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function listTestCases(projectId) { return authenticatedRequest(`/projects/${projectId}/test-cases`) }
export function listTestRuns(projectId) { return authenticatedRequest(`/projects/${projectId}/test-runs`) }
export function listTestResults(testRunId) { return authenticatedRequest(`/test-runs/${testRunId}/results`) }
