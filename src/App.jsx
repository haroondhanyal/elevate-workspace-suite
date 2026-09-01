import './App.css'
import './pages/erp/ErpTheme.css'
import { useEffect } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Tasks from './pages/Tasks'
import NewTask from './pages/NewTask'
import Inbox from './pages/Inbox'
import ProfileSettings from './pages/ProfileSettings'
import HelpCenter from './pages/HelpCenter'
import MediaLibrary from './pages/MediaLibrary'
import ChatWidget from './components/ChatWidget'
import JiraDashboard from './pages/jira/JiraDashboard'
import ScrumBoard from './pages/jira/ScrumBoard'
import CreateProject from './pages/jira/CreateProject'
import JiraCustomize from './pages/jira/JiraCustomize'
import ThemeSettings from './pages/jira/ThemeSettings'
import { applyTheme, getStoredTheme } from './utils/theme'
import TestRailDashboard from './pages/testrail/TestRailDashboard'
import TestCases from './pages/testrail/TestCases'
import UATCases from './pages/testrail/UATCases'
import RTM from './pages/testrail/RTM'
import UserStories from './pages/testrail/UserStories'
import ErpDashboard from './pages/erp/ErpDashboard'
import SalesDashboard from './pages/erp/SalesDashboard'
import InventoryDashboard from './pages/erp/InventoryDashboard'
import BusinessDashboard from './pages/erp/BusinessDashboard'
import SupportDashboard from './pages/erp/SupportDashboard'
import OperationsHub from './pages/erp/OperationsHub'
import WorkspaceHub from './pages/WorkspaceHub'

function App() {
  useEffect(() => {
    applyTheme(getStoredTheme())
  }, [])

  if (window.location.pathname === '/' || window.location.pathname === '/workspace') return <WorkspaceHub />
  if (window.location.pathname === '/erp') return <ErpDashboard />
  if (window.location.pathname === '/erp/sales') return <SalesDashboard />
  if (window.location.pathname === '/erp/inventory') return <InventoryDashboard />
  if (window.location.pathname === '/erp/finance') return <BusinessDashboard type="finance" />
  if (window.location.pathname === '/erp/hr') return <BusinessDashboard type="hr" />
  if (window.location.pathname === '/erp/support') return <SupportDashboard />
  if (window.location.pathname === '/erp/crm') return <OperationsHub type="crm" />
  if (window.location.pathname === '/erp/purchase') return <OperationsHub type="purchase" />
  if (window.location.pathname === '/erp/projects') return <OperationsHub type="projects" />
  if (window.location.pathname === '/erp/manufacturing') return <OperationsHub type="manufacturing" />
  if (window.location.pathname === '/erp/quality') return <OperationsHub type="quality" />
  if (window.location.pathname === '/erp/maintenance') return <OperationsHub type="maintenance" />
  if (window.location.pathname === '/erp/expenses') return <OperationsHub type="expenses" />
  if (window.location.pathname === '/erp/approvals') return <OperationsHub type="approvals" />
  if (window.location.pathname.includes('/testrail/cases')) return <TestCases />
  if (window.location.pathname.includes('/testrail/uat')) return <UATCases />
  if (window.location.pathname.includes('/testrail/rtm')) return <RTM />
  if (window.location.pathname.includes('/testrail/stories')) return <UserStories />
  if (window.location.pathname.includes('/testrail')) return <TestRailDashboard />

  if (window.location.pathname.includes('/jira/projects/new')) return <><CreateProject /><ChatWidget /></>
  if (window.location.pathname.includes('/jira/settings/theme')) return <><ThemeSettings /><ChatWidget /></>
  if (window.location.pathname.includes('/jira/customize')) return <><JiraCustomize /><ChatWidget /></>
  if (window.location.pathname.includes('/jira/board')) return <><ScrumBoard /><ChatWidget /></>
  if (window.location.pathname === '/settings' || window.location.pathname.includes('/settings/profile')) return <><ProfileSettings /><ChatWidget /></>
  if (window.location.pathname.includes('/help')) return <><HelpCenter /><ChatWidget /></>
  if (window.location.pathname.includes('/media')) return <><MediaLibrary /><ChatWidget /></>
  if (window.location.pathname === '/company/personal/user/1/' || window.location.pathname === '/company/personal/user/1') return <><JiraDashboard /><ChatWidget /></>
  if (window.location.pathname.includes('/jira')) return <><JiraDashboard /><a className="testrail-dashboard-link" href="/testrail">◈ TestRail</a><ChatWidget /></>
  if (window.location.pathname.includes('/tasks/new')) return <><NewTask /><ChatWidget /></>
  if (window.location.pathname.includes('/inbox')) return <><Inbox /><ChatWidget /></>
  if (window.location.pathname.includes('/tasks')) return <><Tasks /><ChatWidget /></>

  const isLogin = window.location.pathname.startsWith('/login')

  return isLogin ? <Login /> : <Signup />
}

export default App
