import { useEffect, useState } from 'react'
import { Activity, ArrowLeft, BookOpenCheck, ChevronDown, Database, Gauge, Menu, Scale, ShieldCheck, Users, X } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  ['Overview', '/admin', Gauge],
  ['People', '/admin/users', Users],
  ['Catalog', '/admin/content', Database],
  ['Content quality', '/admin/quality', BookOpenCheck],
  ['Learning activity', '/admin/activity', Activity],
  ['System', '/admin/system', ShieldCheck],
]

function AdminNavigation({ onNavigate }) {
  return <nav className="admin-nav" aria-label="Administration navigation">
    {navItems.map(([label, path, Icon]) => <NavLink key={path} to={path} end={path === '/admin'} onClick={onNavigate} className={({ isActive }) => isActive ? 'is-active' : ''}><Icon size={18} /><span>{label}</span></NavLink>)}
  </nav>
}

export function AdminShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => { setDrawerOpen(false); window.scrollTo(0, 0) }, [location.pathname])
  function logout() { signOut(); navigate('/') }

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <NavLink to="/admin" className="admin-brand"><span><Scale size={22} /></span><div><strong>Lexora</strong><small>Administration</small></div></NavLink>
      <div className="admin-scope"><ShieldCheck size={17} /><span><strong>Local control center</strong><small>This browser only</small></span></div>
      <AdminNavigation />
      <div className="admin-sidebar__footer">
        <NavLink to="/dashboard"><ArrowLeft size={17} /> Student workspace</NavLink>
        <button onClick={logout}><span className="avatar">{user?.fullName?.charAt(0).toUpperCase()}</span><span><strong>{user?.fullName}</strong><small>Administrator · Sign out</small></span><ChevronDown size={15} /></button>
      </div>
    </aside>
    {drawerOpen && <div className="admin-drawer-backdrop" onClick={() => setDrawerOpen(false)}><aside className="admin-drawer" onClick={(event) => event.stopPropagation()}><div className="admin-drawer__top"><strong>Administration</strong><button onClick={() => setDrawerOpen(false)} aria-label="Close navigation"><X /></button></div><AdminNavigation onNavigate={() => setDrawerOpen(false)} /><NavLink to="/dashboard" className="button button--secondary"><ArrowLeft size={17} /> Student workspace</NavLink></aside></div>}
    <section className="admin-workspace">
      <header className="admin-topbar"><button className="admin-menu-button" onClick={() => setDrawerOpen(true)} aria-label="Open administration navigation"><Menu size={21} /></button><div><span className="admin-presence" /> Operational <small>Local browser storage</small></div><span className="admin-user-chip"><ShieldCheck size={15} /> {user?.fullName}</span></header>
      <main className="admin-main"><Outlet /></main>
    </section>
  </div>
}
