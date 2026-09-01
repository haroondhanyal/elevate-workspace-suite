const apiUrl = import.meta.env.VITE_ERP_API_URL?.replace(/\/$/, '')
const authKey = 'elevate-auth-session'

async function request(path, options = {}) {
  if (!apiUrl) throw new Error('API is not configured. Set VITE_ERP_API_URL in .env and start Docker services.')
  const response = await fetch(`${apiUrl}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.detail || 'Unable to complete this request.')
  return payload
}

export async function signUp(payload) {
  const session = await request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) })
  localStorage.setItem(authKey, JSON.stringify(session))
  return session
}

export async function signIn(payload) {
  const session = await request('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
  localStorage.setItem(authKey, JSON.stringify(session))
  return session
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(authKey) || 'null') } catch { return null }
}

export function signOut() { localStorage.removeItem(authKey) }

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

export function markNotificationRead(id) { return authenticatedRequest(`/notifications/${id}/read`, { method: 'PATCH' }) }

export function subscribeNotifications(onNotification) {
  const token = getSession()?.access_token
  if (!apiUrl || !token || !window.WebSocket) return () => {}
  const socketUrl = `${apiUrl.replace(/^http/, 'ws')}/notifications/ws?token=${encodeURIComponent(token)}`
  const socket = new WebSocket(socketUrl)
  socket.onmessage = (event) => {
    try { onNotification(JSON.parse(event.data)) } catch { /* Ignore malformed socket messages. */ }
  }
  return () => socket.close()
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
  const organizationId = getSession()?.organization_id
  if (!organizationId) return null
  const projects = await authenticatedRequest(`/organizations/${organizationId}/projects`)
  return projects[0] || null
}

export function listIssues(projectId) { return authenticatedRequest(`/projects/${projectId}/issues`) }
export function createIssue(projectId, payload) { return authenticatedRequest(`/projects/${projectId}/issues`, { method: 'POST', body: JSON.stringify(payload) }) }
export function updateIssue(id, payload) { return authenticatedRequest(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
