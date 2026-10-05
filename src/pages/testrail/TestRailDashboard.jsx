import { useEffect, useState } from 'react'
import TestRailNav from './TestRailNav'
import { getWorkspaceProject, isBackendSession, listTestCases, listTestResults, listTestRuns } from '../../services/auth'

function TestRailDashboard() {
  const backend = isBackendSession()
  const [summary, setSummary] = useState({ cases: 20, passed: 14, failed: 2, blocked: 1, coverage: 80, run: 'Sprint 08 regression', progress: 90, requirements: 20, covered: 16 })
  const [loading, setLoading] = useState(backend)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!backend) return
    let active = true
    getWorkspaceProject().then(async project => {
      if (!project) return null
      const [cases, runs] = await Promise.all([listTestCases(project.id), listTestRuns(project.id)])
      const results = runs.length ? await listTestResults(runs[0].id) : []
      const passed = results.filter(result => result.status === 'passed').length
      const failed = results.filter(result => result.status === 'failed').length
      const blocked = results.filter(result => result.status === 'blocked').length
      const completed = results.filter(result => result.status !== 'untested').length
      const covered = cases.filter(testCase => testCase.linked_issue_id).length
      const coverage = cases.length ? Math.round(covered / cases.length * 100) : 0
      return { cases: cases.length, passed, failed, blocked, coverage, run: runs[0]?.name || 'No test run created', progress: results.length ? Math.round(completed / results.length * 100) : 0, requirements: cases.length, covered }
    }).then(result => { if (active && result) setSummary(result) }).catch(reason => { if (active) setError(reason.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [backend])

  const issuesTotal = summary.passed + summary.failed + summary.blocked
  const failureWidth = issuesTotal ? Math.round(summary.failed / issuesTotal * 100) : 0
  const blockedWidth = issuesTotal ? Math.round(summary.blocked / issuesTotal * 100) : 0
  return <main className="testrail-app"><TestRailNav active="Overview" /><section className="testrail-main"><header className="testrail-topbar"><div>Elevate Workspace <b>/</b> TestRail</div><div className="testrail-actions"><label>⌕ <input placeholder="Search test cases" /></label><button>＋</button><button className="jira-user">RH</button></div></header><div className="testrail-content"><div className="testrail-welcome"><div><p className="testrail-kicker">Quality workspace</p><h1>TestRail overview</h1><p>Plan, run and report on every test for Elevate Workspace.</p></div><a className="testrail-primary" href="/testrail/cases">＋ New test case</a></div>{error && <p className="error-message" role="alert">Could not load QA data: {error}</p>}<div className="testrail-stats"><Stat value={loading ? '…' : summary.cases} label="Total test cases" tone="purple" /><Stat value={loading ? '…' : summary.passed} label="Passed this run" tone="green" /><Stat value={loading ? '…' : summary.failed} label="Failed tests" tone="red" /><Stat value={loading ? '…' : `${summary.coverage}%`} label="Coverage" tone="blue" /></div><div className="testrail-overview-grid"><section className="testrail-panel"><header><div><h2>Active test run</h2><p>{summary.run}</p></div><a href="/testrail/cases">Open run →</a></header><div className="run-progress"><div className="run-ring"><strong>{summary.progress}%</strong><small>complete</small></div><div className="run-bars"><Bar label="Passed" value={summary.passed} width={summary.progress} tone="green" /><Bar label="Failed" value={summary.failed} width={failureWidth} tone="red" /><Bar label="Blocked" value={summary.blocked} width={blockedWidth} tone="orange" /></div></div></section><section className="testrail-panel"><header><div><h2>Traceability health</h2><p>Requirements linked to test coverage</p></div><a href="/testrail/rtm">View RTM →</a></header><div className="coverage-score"><strong>{summary.coverage}%</strong><div><b>{summary.coverage >= 90 ? 'Excellent coverage' : 'Coverage needs attention'}</b><p>{summary.covered} of {summary.requirements} test cases link to delivery work.</p></div></div><div className="coverage-line"><span style={{ width: `${summary.coverage}%` }} /></div></section></div><section className="testrail-panel recent-panel"><header><div><h2>Recent activity</h2><p>Latest updates from your QA team</p></div><a href="/testrail/cases">View all cases →</a></header><Activity initials="AK" text="Updated checkout payment test cases" time="12 minutes ago" /><Activity initials="SM" text="Completed UAT run for homepage release" time="1 hour ago" /><Activity initials="YK" text="Linked 6 requirements to regression suite" time="Yesterday" /></section></div></section></main>
}
function Stat({ value, label, tone }) { return <div className="testrail-stat"><span className={`testrail-stat-icon ${tone}`}>✓</span><div><strong>{value}</strong><small>{label}</small></div><i>↗</i></div> }
function Bar({ label, value, width, tone }) { return <div className="testrail-bar"><span>{label}</span><b>{value}</b><div><i className={tone} style={{ width: `${width}%` }} /></div></div> }
function Activity({ initials, text, time }) { return <div className="testrail-activity"><span>{initials}</span><p><strong>{text}</strong><small>{time}</small></p><b>›</b></div> }
export default TestRailDashboard
