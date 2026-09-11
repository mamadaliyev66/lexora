import { Bookmark, Inbox, LoaderCircle } from 'lucide-react'

export function Button({ variant = 'primary', className = '', loading = false, children, ...props }) {
  return <button className={`button button--${variant} ${className}`} disabled={loading || props.disabled} {...props}>
    {loading && <LoaderCircle size={17} className="spin" aria-hidden="true" />}{children}
  </button>
}

export function Field({ label, hint, error, id, children }) {
  return <div className="field"><label htmlFor={id}>{label}</label>{children}{hint && !error && <small>{hint}</small>}{error && <small className="field__error">{error}</small>}</div>
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return <div className="empty-state"><span className="empty-state__icon"><Icon size={23} /></span><h2>{title}</h2><p>{description}</p>{action}</div>
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-header__actions">{actions}</div>}</header>
}

export function ProgressBar({ value = 0, label }) {
  return <div className="progress-block">{label && <div className="progress-block__label"><span>{label}</span><strong>{value}%</strong></div>}<div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}><span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div></div>
}

export function SourceBadge({ source }) {
  return <span className="source-badge">{source}</span>
}

export function BookmarkButton({ active, onClick, label = 'Bookmark' }) {
  return <button type="button" className={`icon-text-button ${active ? 'is-active' : ''}`} onClick={onClick} aria-pressed={active}><Bookmark size={17} fill={active ? 'currentColor' : 'none'} />{active ? 'Saved' : label}</button>
}

export function SkeletonRows({ count = 4 }) {
  return <div className="skeleton-list" aria-label="Loading">{Array.from({ length: count }).map((_, index) => <span key={index} />)}</div>
}
