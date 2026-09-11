import { useEffect, useState } from 'react'
import { Bell, BookA, BookMarked, BookOpen, Bookmark, ChevronDown, Columns3, FileQuestion, FileSearch, Gauge, Globe2, GraduationCap, LibraryBig, Menu, Scale, Search, Settings, ShieldCheck, UserRound, X } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Brand } from './Brand'
import { CommandPalette } from './CommandPalette'

const mainNav = [
  ['Dashboard', '/dashboard', Gauge], ['Learn', '/courses', GraduationCap], ['Legal Library', '/library', LibraryBig],
  ['Cases', '/cases', Scale], ['Quizzes', '/quizzes', FileQuestion], ['Dictionary', '/dictionary', BookA],
  ['International Law', '/international-law', Globe2], ['Bookmarks', '/bookmarks', Bookmark],
  ['Collections', '/collections', Columns3], ['Progress', '/progress', BookOpen],
]
const secondaryNav = [['Notifications', '/notifications', Bell], ['Profile', '/profile', UserRound], ['Settings', '/settings', Settings]]
const mobileNav = [['Home', '/dashboard', Gauge], ['Learn', '/courses', GraduationCap], ['Library', '/library', FileSearch], ['Saved', '/bookmarks', BookMarked]]

function Navigation({ onNavigate, isAdmin = false }) {
  return <><nav className="sidebar-nav" aria-label="Workspace navigation">{mainNav.map(([label, path, Icon]) => <NavLink key={path} to={path} onClick={onNavigate} className={({ isActive }) => isActive ? 'is-active' : ''}><Icon size={18} /><span>{label}</span></NavLink>)}</nav><nav className="sidebar-nav sidebar-nav--secondary" aria-label="Account navigation">{isAdmin && <NavLink to="/admin" onClick={onNavigate}><ShieldCheck size={18} /><span>Admin control center</span></NavLink>}{secondaryNav.map(([label, path, Icon]) => <NavLink key={path} to={path} onClick={onNavigate} className={({ isActive }) => isActive ? 'is-active' : ''}><Icon size={18} /><span>{label}</span></NavLink>)}</nav></>
}

export function AppShell() {
  const { user, signOut } = useAuth()
  const { notifications } = useData()
  const navigate = useNavigate()
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const unread = notifications.filter((item) => !item.read).length

  useEffect(() => { setDrawerOpen(false); window.scrollTo(0, 0) }, [location.pathname])
  useEffect(() => {
    const shortcut = (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen(true) } }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [])

  function logout() { signOut(); navigate('/') }

  return <div className="app-shell">
    <aside className="sidebar"><div className="sidebar__brand"><Brand /></div><Navigation isAdmin={user?.role === 'admin'} /><div className="sidebar__footer"><p>Educational information only. Verify current law at the original source.</p><button onClick={logout}><span className="avatar">{user?.fullName?.charAt(0).toUpperCase()}</span><span><strong>{user?.fullName}</strong><small>Sign out</small></span><ChevronDown size={15} /></button></div></aside>
    {drawerOpen && <div className="mobile-drawer-backdrop" onClick={() => setDrawerOpen(false)}><aside className="mobile-drawer" onClick={(event) => event.stopPropagation()}><div><Brand /><button aria-label="Close menu" onClick={() => setDrawerOpen(false)}><X /></button></div><Navigation isAdmin={user?.role === 'admin'} onNavigate={() => setDrawerOpen(false)} /><button className="button button--secondary" onClick={logout}>Sign out</button></aside></div>}
    <div className="workspace">
      <header className="topbar"><button className="mobile-menu" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><button className="search-trigger" onClick={() => setPaletteOpen(true)}><Search size={18} /><span>Search laws, courses, cases…</span><kbd>Ctrl K</kbd></button><div className="topbar__actions"><NavLink to="/sources" className="source-link"><Globe2 size={17} /> Sources</NavLink><NavLink to="/notifications" className="notification-button" aria-label={`${unread} unread notifications`}><Bell size={19} />{unread > 0 && <span>{unread}</span>}</NavLink><NavLink to="/profile" className="top-avatar" aria-label="Profile">{user?.fullName?.charAt(0).toUpperCase()}</NavLink></div></header>
      <main className="workspace__main"><Outlet /></main>
      <footer className="app-footer"><span>Lexora Legal Academy</span><span>Educational use only—not legal advice.</span><NavLink to="/about">Platform information</NavLink></footer>
    </div>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">{mobileNav.map(([label, path, Icon]) => <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'is-active' : ''}><Icon size={20} /><span>{label}</span></NavLink>)}<button onClick={() => setDrawerOpen(true)}><Menu size={20} /><span>More</span></button></nav>
    <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
  </div>
}
