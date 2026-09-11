import { ArrowLeft, ArrowRight, Database, ExternalLink, ShieldCheck, Waypoints } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../../components/Brand'

function PublicHeader() {
  return <header className="public-nav"><Brand /><nav aria-label="Primary"><Link to="/#subjects">Subjects</Link><Link to="/#method">How it works</Link><Link to="/sources">Legal sources</Link><Link to="/about">About</Link></nav><div className="public-nav__actions"><Link to="/login" className="button button--ghost">Sign in</Link><Link to="/register" className="button button--primary">Start learning</Link></div></header>
}

function AboutPage() {
  return <div className="standalone-page"><PublicHeader /><main className="about-page"><header><p className="eyebrow">Platform information</p><h1>Legal study with a visible chain of authority.</h1><p>Lexora is a frontend legal education workspace designed for structured learning, careful source attribution, and private progress tracking.</p></header><section className="about-principles"><article><Scale size={24} /><h2>Educational by design</h2><p>Platform explanations, learning notes, and hypothetical material must be labeled and kept distinct from original law.</p></article><article><ShieldCheck size={24} /><h2>Source-transparent</h2><p>Externally sourced records can include publisher, jurisdiction, original URL, verification date, and legal status.</p></article><article><Database size={24} /><h2>Backend-ready</h2><p>Services isolate data and authentication from the interface so secure APIs can replace local browser storage later.</p></article></section><section className="about-details"><div><p className="eyebrow">Current data boundary</p><h2>Local-first, with no seeded records</h2><p>The application begins with empty courses, documents, cases, terminology, assessments, bookmarks, and progress. Accounts and personal activity stay in this browser. A production launch requires secure authentication, server-side authorization, durable storage, backups, and a reviewed legal-content pipeline.</p></div><div><p className="eyebrow">Legal information</p><h2>Not professional advice</h2><p>Lexora supports education and research. It does not provide legal representation or replace verification against current official sources.</p><a href="https://lex.uz" target="_blank" rel="noreferrer" className="text-link">Open LEX.UZ <ExternalLink size={16} /></a></div></section><section className="about-cta"><Waypoints size={28} /><h2>Start with an empty workspace.</h2><p>Add only material your institution or content team has reviewed.</p><Link to="/register" className="button button--primary">Create an account <ArrowRight size={16} /></Link></section></main></div>
}

function NotFoundPage() {
  return <main className="not-found"><Brand /><div><span>404</span><p className="eyebrow">Page not found</p><h1>This reference leads nowhere.</h1><p>The page may have moved, or the address may be incomplete.</p><Link to="/" className="button button--primary"><ArrowLeft size={17} /> Return home</Link></div></main>
}

export default function UtilityPages({ page }) {
  return page === 'not-found' ? <NotFoundPage /> : <AboutPage />
}
