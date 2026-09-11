import { useMemo, useRef, useState } from 'react'
import { Activity, AlertCircle, ArrowRight, BookOpenCheck, Check, CheckCircle2, ClipboardList, Database, Download, FileJson, FileQuestion, FileSearch, GraduationCap, HardDrive, LibraryBig, Pencil, Plus, Search, ShieldCheck, Trash2, Upload, UserCheck, Users, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { authService } from '../../services/authService'
import { legalDataService } from '../../services/legalDataService'

const catalogTypes = [
  { key: 'courses', label: 'Courses', singular: 'course', icon: GraduationCap },
  { key: 'legalDocuments', label: 'Legal documents', singular: 'document', icon: LibraryBig },
  { key: 'cases', label: 'Cases', singular: 'case', icon: FileSearch },
  { key: 'dictionary', label: 'Dictionary', singular: 'term', icon: BookOpenCheck },
  { key: 'quizzes', label: 'Quizzes', singular: 'quiz', icon: FileQuestion },
]

const emptyUserState = { bookmarks: [], collections: [], recentViews: [], quizHistory: [], progress: { completedLessons: [], startedCourses: [], studySessions: [] } }

function getUserState(allUserData, id) {
  const state = allUserData[id] || {}
  return { ...emptyUserState, ...state, progress: { ...emptyUserState.progress, ...(state.progress || {}) } }
}

function recordTitle(record) {
  return record.title || record.term || record.name || record.id
}

function formatDate(value, includeTime = false) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return date.toLocaleString(undefined, includeTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' })
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function findQualityIssues(data) {
  const issues = []
  const add = (type, record, field, severity, message) => issues.push({ id: `${type}-${record.id}-${field}`, type, recordId: record.id, title: recordTitle(record), field, severity, message })
  ;(data.courses || []).forEach((record) => {
    if (!record.title?.trim()) add('courses', record, 'title', 'critical', 'Course title is missing.')
    if (!record.description?.trim()) add('courses', record, 'description', 'review', 'Course description is missing.')
    if (!record.modules?.length) add('courses', record, 'modules', 'critical', 'Course has no modules or lessons.')
  })
  ;(data.legalDocuments || []).forEach((record) => {
    if (!record.title?.trim()) add('legalDocuments', record, 'title', 'critical', 'Document title is missing.')
    if (!record.source?.trim()) add('legalDocuments', record, 'source', 'critical', 'Publisher or original authority is missing.')
    if (!record.originalUrl?.trim()) add('legalDocuments', record, 'originalUrl', 'critical', 'Original source URL is missing.')
    if (!record.lastChecked) add('legalDocuments', record, 'lastChecked', 'review', 'Source verification date is missing.')
    if (!record.status) add('legalDocuments', record, 'status', 'review', 'Legal status is not labeled.')
  })
  ;(data.cases || []).forEach((record) => {
    if (!record.title?.trim()) add('cases', record, 'title', 'critical', 'Case title is missing.')
    if (!['sourced', 'hypothetical'].includes(record.classification)) add('cases', record, 'classification', 'critical', 'Case must be labeled sourced or hypothetical.')
    if (record.classification === 'sourced' && !record.source?.trim()) add('cases', record, 'source', 'critical', 'Sourced case has no named authority.')
    if (record.classification === 'sourced' && !record.originalUrl?.trim()) add('cases', record, 'originalUrl', 'critical', 'Sourced case has no original URL.')
    if (!record.facts?.trim()) add('cases', record, 'facts', 'review', 'Facts summary is empty.')
  })
  ;(data.dictionary || []).forEach((record) => {
    if (!record.term?.trim()) add('dictionary', record, 'term', 'critical', 'Dictionary term is missing.')
    if (!record.simpleDefinition?.trim()) add('dictionary', record, 'simpleDefinition', 'review', 'Plain-language definition is missing.')
    if (!record.legalDefinition?.trim()) add('dictionary', record, 'legalDefinition', 'review', 'Legal definition is missing.')
  })
  ;(data.quizzes || []).forEach((record) => {
    if (!record.title?.trim()) add('quizzes', record, 'title', 'critical', 'Quiz title is missing.')
    if (!record.questions?.length) add('quizzes', record, 'questions', 'critical', 'Quiz has no questions.')
  })
  return issues
}

function AdminPageHeader({ eyebrow, title, description, actions }) {
  return <header className="admin-page-header"><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{actions && <div className="admin-page-actions">{actions}</div>}</header>
}

function StatCard({ icon: Icon, label, value, detail, tone = 'blue' }) {
  return <article className={`admin-stat admin-stat--${tone}`}><span><Icon size={20} /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>
}

function AuditList({ entries, compact = false }) {
  if (!entries.length) return <div className="admin-inline-empty"><ClipboardList size={22} /><span><strong>No administrative actions yet</strong><small>Changes made in this control center will appear here.</small></span></div>
  return <div className={`admin-audit-list ${compact ? 'is-compact' : ''}`}>{entries.map((entry) => <div key={entry.id}><span className="admin-audit-dot" /><div><strong>{entry.action.replaceAll('.', ' · ').replaceAll('_', ' ')}</strong><small>{entry.actorName} · {formatDate(entry.createdAt, true)}</small></div>{entry.details?.title && <span>{entry.details.title}</span>}</div>)}</div>
}

function OverviewPage() {
  const { data, allUserData, adminAudit } = useData()
  const accounts = authService.listAccounts()
  const issues = findQualityIssues(data)
  const contentTotal = catalogTypes.reduce((sum, item) => sum + (data[item.key]?.length || 0), 0)
  const learning = Object.values(allUserData).reduce((totals, state) => ({
    lessons: totals.lessons + (state.progress?.completedLessons?.length || 0),
    attempts: totals.attempts + (state.quizHistory?.length || 0),
  }), { lessons: 0, attempts: 0 })
  const health = contentTotal ? Math.max(0, Math.round(((contentTotal - new Set(issues.map((issue) => `${issue.type}-${issue.recordId}`)).size) / contentTotal) * 100)) : null

  return <div className="admin-page">
    <AdminPageHeader eyebrow="Command overview" title="Administration at a glance" description="Monitor people, learning activity, catalog coverage, and content integrity from one workspace." actions={<Link to="/admin/content" className="button button--primary"><Plus size={17} /> Add catalog record</Link>} />
    <section className="admin-metrics">
      <StatCard icon={Users} label="Registered accounts" value={accounts.length} detail={`${accounts.filter((item) => item.status === 'active').length} active`} />
      <StatCard icon={Database} label="Catalog records" value={contentTotal} detail="Across five managed collections" tone="gold" />
      <StatCard icon={CheckCircle2} label="Lessons completed" value={learning.lessons} detail="Across all local accounts" tone="green" />
      <StatCard icon={FileQuestion} label="Quiz attempts" value={learning.attempts} detail="Recorded assessment runs" tone="violet" />
    </section>
    <section className="admin-dashboard-grid">
      <article className="admin-panel admin-panel--span"><header><div><p>Catalog coverage</p><h2>Content distribution</h2></div><Link to="/admin/content">Manage catalog <ArrowRight size={15} /></Link></header><div className="admin-distribution">{catalogTypes.map(({ key, label, icon: Icon }) => { const count = data[key]?.length || 0; const width = contentTotal ? Math.max(4, (count / contentTotal) * 100) : 0; return <div key={key}><span><Icon size={16} />{label}</span><div><i style={{ width: `${width}%` }} /></div><strong>{count}</strong></div> })}</div></article>
      <article className="admin-panel admin-health-panel"><header><div><p>Editorial health</p><h2>Source and structure checks</h2></div><Link to="/admin/quality">Review <ArrowRight size={15} /></Link></header><div className={`admin-health ${health === null ? 'is-empty' : ''}`} style={{ '--health': `${(health || 0) * 3.6}deg` }}><div><strong>{health === null ? '—' : `${health}%`}</strong><span>{health === null ? 'Awaiting content' : 'records passing'}</span></div></div><p className="admin-health-summary"><strong>{issues.length}</strong> open quality issue{issues.length === 1 ? '' : 's'} · <strong>{issues.filter((issue) => issue.severity === 'critical').length}</strong> critical</p></article>
      <article className="admin-panel admin-panel--span"><header><div><p>Account activity</p><h2>Learning coverage</h2></div><Link to="/admin/activity">Full activity <ArrowRight size={15} /></Link></header>{accounts.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Learner</th><th>Status</th><th>Courses started</th><th>Lessons done</th><th>Quiz attempts</th></tr></thead><tbody>{accounts.slice(0, 6).map((account) => { const state = getUserState(allUserData, account.id); return <tr key={account.id}><td><span className="admin-person"><i>{account.fullName.charAt(0).toUpperCase()}</i><span><strong>{account.fullName}</strong><small>{account.email}</small></span></span></td><td><Badge tone={account.status === 'active' ? 'success' : 'neutral'}>{account.status}</Badge></td><td>{state.progress.startedCourses.length}</td><td>{state.progress.completedLessons.length}</td><td>{state.quizHistory.length}</td></tr> })}</tbody></table></div> : <div className="admin-inline-empty"><Users size={22} /><span><strong>No accounts registered</strong><small>New accounts will appear as soon as someone registers in this browser.</small></span></div>}</article>
      <article className="admin-panel"><header><div><p>Control history</p><h2>Recent actions</h2></div><Link to="/admin/system">System log <ArrowRight size={15} /></Link></header><AuditList entries={adminAudit.slice(0, 6)} compact /></article>
    </section>
  </div>
}

function UsersPage() {
  const { user, refreshSession } = useAuth()
  const { allUserData, appendAudit, removeUserData } = useData()
  const [accounts, setAccounts] = useState(() => authService.listAccounts())
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState(null)

  const filtered = accounts.filter((account) => {
    const matches = `${account.fullName} ${account.email}`.toLowerCase().includes(query.toLowerCase())
    return matches && (filter === 'all' || account.status === filter || account.role === filter)
  })
  function refresh() { setAccounts(authService.listAccounts()) }
  function notify(text, type = 'success') { setMessage({ text, type }) }
  function createAccount(event) {
    event.preventDefault()
    try {
      const form = new FormData(event.currentTarget)
      const account = authService.createAccount({ fullName: form.get('fullName'), email: form.get('email'), password: form.get('password'), role: form.get('role') })
      appendAudit('user.created', { id: account.id, title: account.fullName, role: account.role })
      refresh(); setCreating(false); notify(`${account.fullName} was added.`)
    } catch (error) { notify(error.message, 'error') }
  }
  function update(id, changes) {
    try {
      const account = authService.updateAccount(id, changes)
      appendAudit('user.updated', { id, title: account.fullName, ...changes })
      refresh(); if (id === user.id) refreshSession(); notify(`${account.fullName} was updated.`)
    } catch (error) { notify(error.message, 'error') }
  }
  function remove(account) {
    if (!window.confirm(`Delete ${account.fullName}'s local account and learning data? This cannot be undone.`)) return
    try {
      authService.deleteAccount(account.id, user.id)
      removeUserData(account.id)
      appendAudit('user.deleted', { id: account.id, title: account.fullName })
      refresh(); notify(`${account.fullName} was deleted.`)
    } catch (error) { notify(error.message, 'error') }
  }

  return <div className="admin-page">
    <AdminPageHeader eyebrow="People and access" title="Account management" description="Review every local account, assign administrators, suspend access, and inspect study totals." actions={<Button onClick={() => setCreating(true)}><Plus size={17} /> Add account</Button>} />
    {message && <div className={`admin-notice admin-notice--${message.type}`} role="status">{message.type === 'error' ? <AlertCircle size={17} /> : <Check size={17} />}{message.text}<button onClick={() => setMessage(null)} aria-label="Dismiss"><X size={15} /></button></div>}
    <section className="admin-filterbar"><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or email" aria-label="Search accounts" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter accounts"><option value="all">All accounts</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="admin">Administrators</option><option value="student">Students</option></select><span>{filtered.length} of {accounts.length}</span></section>
    <section className="admin-panel admin-panel--flush"><div className="admin-table-wrap"><table className="admin-table admin-people-table"><thead><tr><th>Account</th><th>Access</th><th>State</th><th>Learning record</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((account) => { const state = getUserState(allUserData, account.id); return <tr key={account.id}><td><span className="admin-person"><i>{account.fullName.charAt(0).toUpperCase()}</i><span><strong>{account.fullName}{account.id === user.id && <em>You</em>}</strong><small>{account.email}</small></span></span></td><td><select value={account.role} onChange={(event) => update(account.id, { role: event.target.value })} aria-label={`Role for ${account.fullName}`}><option value="student">Student</option><option value="admin">Administrator</option></select></td><td><select value={account.status} onChange={(event) => update(account.id, { status: event.target.value })} aria-label={`Status for ${account.fullName}`}><option value="active">Active</option><option value="suspended">Suspended</option></select></td><td><span className="admin-study-totals"><span><strong>{state.progress.completedLessons.length}</strong> lessons</span><span><strong>{state.quizHistory.length}</strong> quizzes</span><span><strong>{state.bookmarks.length}</strong> saved</span></span></td><td>{formatDate(account.createdAt)}</td><td><button className="admin-icon-button danger-text" onClick={() => remove(account)} aria-label={`Delete ${account.fullName}`} disabled={account.id === user.id}><Trash2 size={17} /></button></td></tr> })}</tbody></table></div>{!filtered.length && <EmptyState icon={Users} title="No accounts match" description="Change the search or access filter to see more accounts." />}</section>
    {creating && <div className="admin-modal-backdrop" onMouseDown={() => setCreating(false)}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="create-account-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p>New local account</p><h2 id="create-account-title">Add a person</h2></div><button onClick={() => setCreating(false)} aria-label="Close"><X /></button></header><form onSubmit={createAccount}><label>Full name<input name="fullName" required autoFocus /></label><label>Email address<input name="email" type="email" required /></label><label>Temporary password<input name="password" type="password" minLength="8" required /><small>Stored locally in this browser. Share it outside the platform.</small></label><label>Access level<select name="role" defaultValue="student"><option value="student">Student</option><option value="admin">Administrator</option></select></label><footer><Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit"><UserCheck size={17} /> Create account</Button></footer></form></section></div>}
  </div>
}

function createBlankRecord(type) {
  const common = { id: crypto.randomUUID() }
  if (type === 'courses') return { ...common, title: '', category: '', description: '', modules: [] }
  if (type === 'legalDocuments') return { ...common, title: '', source: '', status: 'draft', originalUrl: '', lastChecked: '', sections: [] }
  if (type === 'cases') return { ...common, title: '', classification: 'hypothetical', source: '', originalUrl: '', facts: '', legalIssue: '', decision: '' }
  if (type === 'dictionary') return { ...common, term: '', simpleDefinition: '', legalDefinition: '' }
  return { ...common, title: '', description: '', questions: [] }
}

function RecordEditor({ type, record, onClose, onSave }) {
  const meta = catalogTypes.find((item) => item.key === type)
  const [raw, setRaw] = useState(() => JSON.stringify(record || createBlankRecord(type), null, 2))
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    try {
      const parsed = JSON.parse(raw)
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('The record must be a JSON object.')
      if (!parsed.id || typeof parsed.id !== 'string') throw new Error('A string id is required.')
      if (record && parsed.id !== record.id) throw new Error('A record ID cannot be changed after creation.')
      if (type === 'dictionary' ? !parsed.term?.trim() : !parsed.title?.trim()) throw new Error(type === 'dictionary' ? 'A term is required.' : 'A title is required.')
      onSave(parsed)
    } catch (issue) { setError(issue.message) }
  }
  return <div className="admin-modal-backdrop" onMouseDown={onClose}><section className="admin-modal admin-record-editor" role="dialog" aria-modal="true" aria-labelledby="record-editor-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p>{record ? 'Edit' : 'New'} {meta.singular}</p><h2 id="record-editor-title">{record ? recordTitle(record) : `Create ${meta.singular}`}</h2></div><button onClick={onClose} aria-label="Close"><X /></button></header><form onSubmit={submit}><div className="admin-schema-note"><FileJson size={18} /><p><strong>Structured record editor</strong><span>Arrays can contain nested curriculum, section, citation, or question objects. Changes are validated before saving.</span></p></div><label>Record JSON<textarea className="admin-json-editor" value={raw} onChange={(event) => { setRaw(event.target.value); setError('') }} spellCheck="false" aria-label={`${meta.singular} JSON`} /></label>{error && <div className="admin-notice admin-notice--error"><AlertCircle size={17} />{error}</div>}<footer><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit"><Check size={17} /> Save record</Button></footer></form></section></div>
}

function ContentPage() {
  const { data, importDataset, upsertCatalogRecord, deleteCatalogRecord } = useData()
  const [activeType, setActiveType] = useState('courses')
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState(null)
  const [notice, setNotice] = useState(null)
  const fileRef = useRef(null)
  const meta = catalogTypes.find((item) => item.key === activeType)
  const records = (data[activeType] || []).filter((record) => JSON.stringify(record).toLowerCase().includes(query.toLowerCase()))
  const total = catalogTypes.reduce((sum, item) => sum + (data[item.key]?.length || 0), 0)

  function save(record) {
    try { upsertCatalogRecord(activeType, record); setEditor(null); setNotice({ type: 'success', text: `${recordTitle(record)} was saved.` }) } catch (error) { setNotice({ type: 'error', text: error.message }) }
  }
  function remove(record) {
    if (!window.confirm(`Delete “${recordTitle(record)}” from the catalog?`)) return
    deleteCatalogRecord(activeType, record.id)
    setNotice({ type: 'success', text: `${recordTitle(record)} was deleted.` })
  }
  async function importFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try { importDataset(JSON.parse(await file.text())); setNotice({ type: 'success', text: 'Catalog imported successfully.' }) } catch (error) { setNotice({ type: 'error', text: error.message }) }
    event.target.value = ''
  }

  return <div className="admin-page">
    <AdminPageHeader eyebrow="Curriculum operations" title="Catalog management" description="Create, inspect, edit, import, and remove every learner-facing record without seeded content." actions={<><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importFile} /><Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload size={17} /> Import JSON</Button><Button onClick={() => setEditor({ type: 'new' })}><Plus size={17} /> New {meta.singular}</Button></>} />
    {notice && <div className={`admin-notice admin-notice--${notice.type}`} role="status">{notice.type === 'error' ? <AlertCircle size={17} /> : <Check size={17} />}{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={15} /></button></div>}
    <section className="admin-catalog-tabs" aria-label="Catalog type">{catalogTypes.map(({ key, label, icon: Icon }) => <button key={key} className={activeType === key ? 'is-active' : ''} onClick={() => { setActiveType(key); setQuery('') }}><Icon size={18} /><span>{label}</span><strong>{data[key]?.length || 0}</strong></button>)}</section>
    <section className="admin-panel admin-panel--flush"><div className="admin-record-toolbar"><div><strong>{meta.label}</strong><span>{data[activeType]?.length || 0} record{data[activeType]?.length === 1 ? '' : 's'} · {total} total</span></div><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${meta.label.toLowerCase()}`} aria-label={`Search ${meta.label.toLowerCase()}`} /></label></div>{records.length ? <div className="admin-record-list">{records.map((record) => <article key={record.id}><span className="admin-record-icon"><meta.icon size={19} /></span><div><span><Badge tone={record.status === 'active' || record.status === 'in-force' ? 'success' : 'neutral'}>{record.status || record.classification || record.category || meta.singular}</Badge></span><h2>{recordTitle(record)}</h2><p>{record.description || record.simpleDefinition || record.facts || record.source || 'No summary has been supplied.'}</p><small>ID · {record.id}</small></div><div className="admin-record-actions"><button onClick={() => setEditor({ type: 'edit', record })}><Pencil size={17} /> Edit</button><button className="danger-text" onClick={() => remove(record)}><Trash2 size={17} /> Delete</button></div></article>)}</div> : <EmptyState icon={meta.icon} title={data[activeType]?.length ? 'No matching records' : `No ${meta.label.toLowerCase()} yet`} description={data[activeType]?.length ? 'Try a broader search.' : `Create the first ${meta.singular} when reviewed material is ready. Nothing is prefilled.`} action={<Button onClick={() => setEditor({ type: 'new' })}><Plus size={17} /> New {meta.singular}</Button>} />}</section>
    {editor && <RecordEditor type={activeType} record={editor.record} onClose={() => setEditor(null)} onSave={save} />}
  </div>
}

function QualityPage() {
  const { data } = useData()
  const issues = useMemo(() => findQualityIssues(data), [data])
  const records = catalogTypes.reduce((sum, item) => sum + (data[item.key]?.length || 0), 0)
  const affected = new Set(issues.map((issue) => `${issue.type}-${issue.recordId}`)).size
  const documents = data.legalDocuments || []
  const sourcedCases = (data.cases || []).filter((record) => record.classification === 'sourced')
  const sourceComplete = [...documents, ...sourcedCases].filter((record) => record.source && record.originalUrl).length
  const sourceTotal = documents.length + sourcedCases.length
  const passing = records ? Math.round(((records - affected) / records) * 100) : 0

  return <div className="admin-page">
    <AdminPageHeader eyebrow="Editorial assurance" title="Content quality" description="Surface incomplete learning structures, weak provenance, and records that need a legal-editor review." actions={<Link className="button button--secondary" to="/admin/content">Open catalog <ArrowRight size={17} /></Link>} />
    <section className="admin-metrics">
      <StatCard icon={Database} label="Records checked" value={records} detail="Automatic structural review" />
      <StatCard icon={CheckCircle2} label="Passing records" value={records - affected} detail={`${passing}% of the catalog`} tone="green" />
      <StatCard icon={AlertCircle} label="Open issues" value={issues.length} detail={`${issues.filter((item) => item.severity === 'critical').length} critical`} tone="red" />
      <StatCard icon={ShieldCheck} label="Source complete" value={`${sourceComplete}/${sourceTotal}`} detail="Sourced records with authority + URL" tone="gold" />
    </section>
    <section className="admin-quality-layout">
      <article className="admin-panel admin-panel--span"><header><div><p>Review queue</p><h2>Records needing attention</h2></div><span>{issues.length} issue{issues.length === 1 ? '' : 's'}</span></header>{issues.length ? <div className="admin-quality-list">{issues.map((issue) => <div key={issue.id}><span className={`admin-severity admin-severity--${issue.severity}`}><AlertCircle size={16} /></span><div><span><Badge tone={issue.severity === 'critical' ? 'warning' : 'neutral'}>{issue.severity}</Badge><small>{catalogTypes.find((item) => item.key === issue.type)?.label} · {issue.field}</small></span><strong>{issue.title}</strong><p>{issue.message}</p></div><Link to="/admin/content">Edit record <ArrowRight size={15} /></Link></div>)}</div> : <div className="admin-quality-clear"><CheckCircle2 size={35} /><h2>{records ? 'All automated checks pass' : 'Ready for reviewed content'}</h2><p>{records ? 'No missing source or structure fields were detected.' : 'Quality checks will run as soon as the first catalog record is added.'}</p></div>}</article>
      <aside className="admin-panel admin-quality-policy"><header><div><p>Publication discipline</p><h2>Review standard</h2></div></header><ol><li><span>1</span><div><strong>Identify the material</strong><p>Every record needs a stable ID and clear title or term.</p></div></li><li><span>2</span><div><strong>Label its authority</strong><p>Separate sourced legal material from educational or hypothetical content.</p></div></li><li><span>3</span><div><strong>Link the original</strong><p>Provide the publisher, direct URL, status, and verification date.</p></div></li><li><span>4</span><div><strong>Review before release</strong><p>Automatic checks support—but do not replace—legal-editor judgment.</p></div></li></ol></aside>
    </section>
  </div>
}

function ActivityPage() {
  const { allUserData } = useData()
  const accounts = authService.listAccounts()
  const [query, setQuery] = useState('')
  const rows = accounts.map((account) => {
    const state = getUserState(allUserData, account.id)
    const scores = state.quizHistory.map((item) => Number(item.score) || 0)
    const latest = [...state.recentViews.map((item) => item.viewedAt), ...state.quizHistory.map((item) => item.completedAt), ...state.progress.studySessions.map((item) => item.completedAt || item.startedAt)].filter(Boolean).sort().at(-1)
    return { account, state, average: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null, latest }
  }).filter(({ account }) => `${account.fullName} ${account.email}`.toLowerCase().includes(query.toLowerCase()))
  const events = accounts.flatMap((account) => {
    const state = getUserState(allUserData, account.id)
    return [
      ...state.recentViews.map((item) => ({ id: `view-${account.id}-${item.id}-${item.viewedAt}`, person: account.fullName, kind: 'Viewed', title: item.title, date: item.viewedAt })),
      ...state.quizHistory.map((item, index) => ({ id: `quiz-${account.id}-${index}-${item.completedAt}`, person: account.fullName, kind: 'Quiz', title: item.title || item.quizTitle || item.quizId, detail: `${item.score}%`, date: item.completedAt })),
    ]
  }).filter((item) => item.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30)

  return <div className="admin-page">
    <AdminPageHeader eyebrow="Learning intelligence" title="Activity monitor" description="Understand participation and progress recorded by accounts using this local installation." />
    <div className="admin-boundary-note"><HardDrive size={19} /><div><strong>Monitoring boundary</strong><span>This view includes activity stored in this browser only. It does not claim to report cross-device or server activity.</span></div></div>
    <section className="admin-panel admin-panel--flush"><div className="admin-record-toolbar"><div><strong>Account engagement</strong><span>{accounts.length} registered account{accounts.length === 1 ? '' : 's'}</span></div><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an account" aria-label="Search account activity" /></label></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Account</th><th>Last activity</th><th>Courses</th><th>Lessons</th><th>Quiz attempts</th><th>Average</th><th>Saved</th></tr></thead><tbody>{rows.map(({ account, state, average, latest }) => <tr key={account.id}><td><span className="admin-person"><i>{account.fullName.charAt(0).toUpperCase()}</i><span><strong>{account.fullName}</strong><small>{account.email}</small></span></span></td><td>{formatDate(latest, true)}</td><td>{state.progress.startedCourses.length}</td><td>{state.progress.completedLessons.length}</td><td>{state.quizHistory.length}</td><td>{average === null ? '—' : `${average}%`}</td><td>{state.bookmarks.length}</td></tr>)}</tbody></table></div>{!rows.length && <EmptyState icon={Activity} title="No matching activity" description="Try a different account search." />}</section>
    <section className="admin-panel admin-activity-panel"><header><div><p>Chronological feed</p><h2>Recent learning events</h2></div><span>Latest 30</span></header>{events.length ? <div className="admin-activity-feed">{events.map((event) => <div key={event.id}><span className={event.kind === 'Quiz' ? 'is-quiz' : ''}>{event.kind === 'Quiz' ? <FileQuestion size={17} /> : <FileSearch size={17} />}</span><div><strong>{event.person}</strong><p>{event.kind} · {event.title || 'Untitled record'} {event.detail && <b>{event.detail}</b>}</p></div><time>{formatDate(event.date, true)}</time></div>)}</div> : <div className="admin-inline-empty"><Activity size={22} /><span><strong>No learning events recorded</strong><small>Views and completed assessments will appear here.</small></span></div>}</section>
  </div>
}

function SystemPage() {
  const { data, allUserData, adminAudit, clearAudit } = useData()
  const [notice, setNotice] = useState('')
  const accounts = authService.listAccounts()
  const bytes = Object.keys(localStorage).reduce((sum, key) => sum + key.length + (localStorage.getItem(key)?.length || 0), 0) * 2
  const size = bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`
  function exportBackup() {
    downloadJson(`lexora-admin-backup-${new Date().toISOString().slice(0, 10)}.json`, { schemaVersion: 1, exportedAt: new Date().toISOString(), accounts, catalog: legalDataService.exportDataset(), userData: allUserData, adminAudit })
    setNotice('Full local backup downloaded. Passwords were excluded.')
  }
  function exportCatalog() {
    downloadJson(`lexora-catalog-${new Date().toISOString().slice(0, 10)}.json`, legalDataService.exportDataset())
    setNotice('Catalog export downloaded.')
  }
  function eraseAudit() {
    if (!window.confirm('Clear the administrative action log from this browser?')) return
    clearAudit(); setNotice('Administrative action log cleared.')
  }
  const recordCount = catalogTypes.reduce((sum, item) => sum + (data[item.key]?.length || 0), 0)

  return <div className="admin-page">
    <AdminPageHeader eyebrow="Local installation" title="System and data" description="Inspect storage, export recoverable backups, and understand the operating boundary of this frontend build." actions={<Button onClick={exportBackup}><Download size={17} /> Download full backup</Button>} />
    {notice && <div className="admin-notice admin-notice--success" role="status"><Check size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    <section className="admin-system-grid">
      <article className="admin-panel admin-system-status"><header><div><p>Installation status</p><h2>Operational summary</h2></div><span className="admin-status-label"><i /> Ready</span></header><dl><div><dt>Persistence</dt><dd>Browser local storage</dd></div><div><dt>Registered accounts</dt><dd>{accounts.length}</dd></div><div><dt>Catalog records</dt><dd>{recordCount}</dd></div><div><dt>Audit events</dt><dd>{adminAudit.length}</dd></div><div><dt>Estimated storage used</dt><dd>{size}</dd></div><div><dt>Backend connection</dt><dd>Not configured</dd></div></dl></article>
      <article className="admin-panel admin-system-actions"><header><div><p>Data portability</p><h2>Backup and export</h2></div></header><button onClick={exportBackup}><span><Download size={19} /></span><div><strong>Full administration backup</strong><p>Accounts without passwords, catalog, learning data, and audit history.</p></div><ArrowRight size={17} /></button><button onClick={exportCatalog}><span><Database size={19} /></span><div><strong>Catalog-only export</strong><p>Portable curriculum and legal-content JSON.</p></div><ArrowRight size={17} /></button><button className="danger-action" onClick={eraseAudit} disabled={!adminAudit.length}><span><Trash2 size={19} /></span><div><strong>Clear audit history</strong><p>Remove up to 500 stored administration events.</p></div><ArrowRight size={17} /></button></article>
      <article className="admin-panel admin-panel--span admin-security-boundary"><div><span><ShieldCheck size={25} /></span><div><p>Current trust model</p><h2>Suitable for a small, controlled local audience</h2><p>Roles, suspension, monitoring, and content controls are enforced in the interface and stored on this device. Browser users with developer access can still inspect or alter local data. Before wider distribution, move authentication, authorization, auditing, and durable storage to a protected backend.</p></div></div><ul><li><Check size={16} /> Role-gated administration routes</li><li><Check size={16} /> No seeded learner or catalog data</li><li><Check size={16} /> Password-free administrative exports</li><li><AlertCircle size={16} /> No server-side security boundary</li></ul></article>
      <article className="admin-panel admin-panel--span"><header><div><p>Audit history</p><h2>Administrative action log</h2></div><span>{adminAudit.length} events</span></header><AuditList entries={adminAudit.slice(0, 50)} /></article>
    </section>
  </div>
}

const pages = { overview: OverviewPage, users: UsersPage, content: ContentPage, quality: QualityPage, activity: ActivityPage, system: SystemPage }

export default function AdminPages({ page }) {
  const Page = pages[page] || OverviewPage
  return <Page />
}
