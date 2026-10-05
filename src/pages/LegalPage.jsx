import './LegalPage.css'

const terms = {
  type: 'terms', label: 'TERMS OF SERVICE', title: 'A clear way to work together.', intro: 'These draft terms explain the basic rules for using Elevate Workspace.',
  sections: [
    ['using-elevate', 'Using Elevate', 'Elevate Workspace helps teams organize projects, quality work, and business operations. By creating an account or using a workspace, you agree to use the service lawfully and follow these terms.'],
    ['your-account', 'Your account', 'Keep your sign-in details private and provide information you are allowed to share. You are responsible for activity carried out through your account. Tell your workspace administrator if you think your account has been accessed without permission.'],
    ['workspace-content', 'Workspace content', 'You keep responsibility for the information, files, and other content you add. Make sure you have permission to upload or share it. Workspace members may be able to see content according to their workspace role and permissions.'],
    ['acceptable-use', 'Acceptable use', 'Do not use Elevate to break the law, interfere with the service, access another person’s account or workspace without permission, or upload harmful or malicious content. Do not try to bypass access controls.'],
    ['service-and-changes', 'Service and changes', 'Features may change as Elevate is maintained and improved. We aim to keep the service useful, but this draft does not promise uninterrupted availability or a specific feature set.'],
    ['access-and-closure', 'Access and closure', 'Workspace owners and administrators manage membership and access. Ask your workspace administrator about removing your account or workspace data.'],
    ['questions', 'Questions', 'For questions about these terms, contact the person or organization that administers your Elevate workspace.'],
  ],
}

const privacy = {
  type: 'privacy', label: 'PRIVACY OVERVIEW', title: 'Your workspace data, explained.', intro: 'A practical overview of the information Elevate uses to run your workspace.',
  sections: [
    ['information', 'Information in your account', 'Account details can include your name, email address, contact number, optional age, and profile photo. Your workspace can also contain projects, tasks, messages, test records, business records, and files that you or your team add.'],
    ['how-used', 'How information is used', 'Elevate uses account and workspace information to provide sign-in, display your workspace, support collaboration, save records, show notifications, and protect the service from misuse.'],
    ['workspace-visibility', 'Who can see workspace information', 'People in your organization may see information shared in their workspace. Workspace roles control access to some actions and records. Check with your workspace administrator if you are unsure who can access a particular item.'],
    ['files-and-storage', 'Files and browser storage', 'Uploaded profile photos and workspace files are stored by the configured Elevate backend and are served through authenticated access. During frontend-only use, some features can keep data in your browser. Elevate also uses browser session storage for the active sign-in session and local storage for selected preferences or local-only data.'],
    ['security', 'Keeping information safe', 'Elevate uses sign-in checks, workspace permissions, and access controls for uploaded files. No online service can promise perfect security, so avoid adding passwords, payment card details, or other sensitive information to ordinary workspace notes or attachments.'],
    ['retention-and-requests', 'Retention and data requests', 'Workspace data and account access are managed through the configured service and organization. Elevate does not currently provide a self-service account deletion screen. Contact your workspace administrator to ask about access, correction, retention, or account closure.'],
    ['updates', 'Updates to this page', 'This overview may change as Elevate features and data handling change. Check this page again when the workspace administrator announces an update.'],
  ],
}

function LegalPage({ type }) {
  const page = type === 'privacy' ? privacy : terms
  const requestedReturn = new URLSearchParams(window.location.search).get('returnTo')
  const returnTo = requestedReturn?.startsWith('/signup') && !requestedReturn.startsWith('//') ? requestedReturn : '/signup'
  return <main className={`legal-page legal-${page.type}`}>
    <header className="legal-topbar"><a className="legal-brand" href="/workspace"><span>✦</span> Elevate <small>WORKSPACE</small></a><a className="legal-signup-link" href={returnTo}>Back to sign up <b>→</b></a></header>
    <section className="legal-hero"><div className="legal-hero-inner"><div className="legal-breadcrumb"><a href={returnTo}>Create account</a><span>/</span><span>{page.type === 'terms' ? 'Terms' : 'Privacy'}</span></div><p>{page.label}</p><h1>{page.title}</h1><span>{page.intro}</span><small>Updated October 6, 2026 · Elevate Workspace</small></div></section>
    <div className="legal-layout"><aside className="legal-toc"><span>ON THIS PAGE</span>{page.sections.map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}</aside><article className="legal-article"><div className="legal-draft-note"><i>i</i><span>This is a product information draft. Have your organization review it and add any required legal details before public launch.</span></div>{page.sections.map(([id, title, body], index) => <section id={id} key={id}><span className="legal-index">{String(index + 1).padStart(2, '0')}</span><div><h2>{title}</h2><p>{body}</p></div></section>)}<footer><span>Need help understanding this page?</span><a href="/help">Visit the Help Center →</a></footer></article></div>
    <footer className="legal-footer"><a href="/signup">Elevate Workspace</a><nav><a href="/help">Help center</a><a href={`/terms?returnTo=${encodeURIComponent(returnTo)}`}>Terms</a><a href={`/privacy?returnTo=${encodeURIComponent(returnTo)}`}>Privacy</a></nav><span>© 2026 Elevate</span></footer>
  </main>
}

export default LegalPage
