import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Bookmark, FileSearch, Gauge, Search, UserRound, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { searchRecords } from '../services/searchService'

const actions = [
  { title: 'Open dashboard', url: '/dashboard', icon: Gauge },
  { title: 'Browse courses', url: '/courses', icon: BookOpen },
  { title: 'Search legislation', url: '/library', icon: FileSearch },
  { title: 'Open bookmarks', url: '/bookmarks', icon: Bookmark },
  { title: 'Go to profile', url: '/profile', icon: UserRound },
]

export function CommandPalette({ open, onClose }) {
  const { data } = useData()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useLocalStorage('lexora.recentSearches', [])
  const results = useMemo(() => query.trim() ? searchRecords(data, query).slice(0, 7) : [], [data, query])

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    const close = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', close) }
  }, [open, onClose])

  function go(url) {
    if (query.trim()) setRecent((items) => [query.trim(), ...items.filter((item) => item !== query.trim())].slice(0, 5))
    navigate(url)
    setQuery('')
    onClose()
  }

  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command search" onMouseDown={(event) => event.stopPropagation()}>
      <div className="command-input"><Search size={20} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search laws, courses, cases, and actions" aria-label="Search" /><button onClick={onClose} aria-label="Close command search"><X size={18} /></button></div>
      <div className="command-results">
        {!query && <><p className="command-label">Quick actions</p>{actions.map(({ title, url, icon: Icon }) => <button key={url} onClick={() => go(url)}><Icon size={17} /><span>{title}</span><kbd>↵</kbd></button>)}{recent.length > 0 && <><p className="command-label">Recent searches</p>{recent.map((term) => <button key={term} onClick={() => { setQuery(term); inputRef.current?.focus() }}><Search size={17} /><span>{term}</span></button>)}</>}</>}
        {query && results.map((result) => <button key={`${result.type}-${result.id}`} onClick={() => go(result.url)}><Search size={17} /><span><strong>{result.title}</strong><small>{result.type}{result.category ? ` · ${result.category}` : ''}</small></span><kbd>↵</kbd></button>)}
        {query && !results.length && <div className="command-empty"><FileSearch size={22} /><strong>No catalog match</strong><span>Try fewer words, or open the full search page for filters.</span><button className="button button--secondary" onClick={() => go(`/search?q=${encodeURIComponent(query)}`)}>Open full search</button></div>}
      </div>
    </section>
  </div>
}
