import './App.css'
import './pages/erp/ErpTheme.css'
import { lazy, Suspense, useEffect } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'
import ChatWidget from './components/ChatWidget'
import { applyTheme, getStoredTheme } from './utils/theme'
import { getSession, isApiConfigured } from './services/auth'

const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Tasks = lazy(() => import('./pages/Tasks'))
const NewTask = lazy(() => import('./pages/NewTask'))
const Inbox = lazy(() => import('./pages/Inbox'))
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'))
const HelpCenter = lazy(() => import('./pages/HelpCenter'))
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'))
const JiraDashboard = lazy(() => import('./pages/jira/JiraDashboard'))
const ScrumBoard = lazy(() => import('./pages/jira/ScrumBoard'))
const CreateProject = lazy(() => import('./pages/jira/CreateProject'))
const JiraCustomize = lazy(() => import('./pages/jira/JiraCustomize'))
const ThemeSettings = lazy(() => import('./pages/jira/ThemeSettings'))
const TestRailDashboard = lazy(() => import('./pages/testrail/TestRailDashboard'))
const TestCases = lazy(() => import('./pages/testrail/TestCases'))
const UATCases = lazy(() => import('./pages/testrail/UATCases'))
const RTM = lazy(() => import('./pages/testrail/RTM'))
const UserStories = lazy(() => import('./pages/testrail/UserStories'))
const ErpDashboard = lazy(() => import('./pages/erp/ErpDashboard'))
const SalesDashboard = lazy(() => import('./pages/erp/SalesDashboard'))
const InventoryDashboard = lazy(() => import('./pages/erp/InventoryDashboard'))
const BusinessDashboard = lazy(() => import('./pages/erp/BusinessDashboard'))
const SupportDashboard = lazy(() => import('./pages/erp/SupportDashboard'))
const OperationsHub = lazy(() => import('./pages/erp/OperationsHub'))
const ApprovalCenter = lazy(() => import('./pages/ApprovalCenter'))
const WorkspaceSettings = lazy(() => import('./pages/WorkspaceSettings'))
const AcceptInvitation = lazy(() => import('./pages/AcceptInvitation'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const WorkspaceHub = lazy(() => import('./pages/WorkspaceHub'))

const routes = [
  { match: path => path === '/' || path === '/workspace', component: WorkspaceHub },
  { match: path => path === '/login', component: Login, public: true },
  { match: path => path === '/signup', component: Signup, public: true },
  { match: path => path === '/reset-password', component: ResetPassword, public: true },
  { match: path => path === '/erp', component: ErpDashboard },
  { match: path => path === '/erp/sales', component: SalesDashboard },
  { match: path => path === '/erp/inventory', component: InventoryDashboard },
  { match: path => path === '/erp/finance', component: BusinessDashboard, props: { type: 'finance' } },
  { match: path => path === '/erp/hr', component: BusinessDashboard, props: { type: 'hr' } },
  { match: path => path === '/erp/support', component: SupportDashboard },
  ...['crm', 'purchase', 'projects', 'manufacturing', 'quality', 'maintenance', 'expenses'].map(type => ({ match: path => path === `/erp/${type}`, component: OperationsHub, props: { type } })),
  { match: path => path === '/erp/approvals', component: ApprovalCenter },
  { match: path => path === '/testrail/cases', component: TestCases },
  { match: path => path === '/testrail/uat', component: UATCases },
  { match: path => path === '/testrail/rtm', component: RTM },
  { match: path => path === '/testrail/stories', component: UserStories },
  { match: path => path === '/testrail', component: TestRailDashboard },
  { match: path => path === '/jira/projects/new', component: CreateProject, chat: true },
  { match: path => path === '/jira/settings/theme', component: ThemeSettings, chat: true },
  { match: path => path === '/jira/customize', component: JiraCustomize, chat: true },
  { match: path => path === '/jira/board', component: ScrumBoard, chat: true },
  { match: path => path === '/settings' || path === '/settings/profile', component: ProfileSettings, chat: true },
  { match: path => path === '/settings/workspace', component: WorkspaceSettings },
  { match: path => path === '/accept-invitation', component: AcceptInvitation, public: true },
  { match: path => path === '/terms', component: LegalPage, props: { type: 'terms' }, public: true },
  { match: path => path === '/privacy', component: LegalPage, props: { type: 'privacy' }, public: true },
  { match: path => path === '/help', component: HelpCenter, public: true },
  { match: path => path === '/media', component: MediaLibrary, chat: true },
  { match: path => path === '/company/personal/user/1' || path === '/company/personal/user/1/', component: JiraDashboard, chat: true },
  { match: path => path === '/jira', component: JiraDashboard, chat: true },
  { match: path => path === '/tasks/new' || path.endsWith('/tasks/new'), component: NewTask, chat: true },
  { match: path => path === '/inbox' || path.endsWith('/inbox'), component: Inbox, chat: true },
  { match: path => path === '/tasks' || path.endsWith('/tasks'), component: Tasks, chat: true },
]

function App() {
  useEffect(() => {
    applyTheme(getStoredTheme())
    const onSessionExpired = () => {
      const next = `${window.location.pathname}${window.location.search}`
      window.location.replace(`/login?next=${encodeURIComponent(next)}`)
    }
    window.addEventListener('elevate:session-expired', onSessionExpired)
    return () => window.removeEventListener('elevate:session-expired', onSessionExpired)
  }, [])

  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const route = routes.find(item => item.match(path))
  const requiresLogin = Boolean(route && !route.public && isApiConfigured() && !getSession()?.access_token)
  useEffect(() => {
    if (requiresLogin) {
      const next = `${window.location.pathname}${window.location.search}`
      window.location.replace(`/login?next=${encodeURIComponent(next)}`)
    }
  }, [path, requiresLogin])
  if (!route) return <NotFound />
  if (requiresLogin) {
    return <Login />
  }

  const Page = route.component
  return <Suspense fallback={<div className="app-loading" role="status">Loading workspace…</div>}><Page {...route.props} />{route.chat && <ChatWidget />}</Suspense>
}

export default App
