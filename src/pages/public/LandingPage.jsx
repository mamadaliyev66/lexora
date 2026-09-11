import { ArrowRight, BookOpen, Check, Command, ExternalLink, FileSearch, GraduationCap, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../../components/Brand'

const subjects = ['Constitutional law', 'Civil law', 'Criminal law', 'Administrative law', 'Business law', 'International law', 'Human rights', 'Legal research']

export function LandingPage() {
  return <div className="landing">
    <header className="public-nav"><Brand /><nav aria-label="Primary"><a href="#subjects">Subjects</a><a href="#method">How it works</a><Link to="/sources">Legal sources</Link><Link to="/about">About</Link></nav><div className="public-nav__actions"><Link to="/login" className="button button--ghost">Sign in</Link><Link to="/register" className="button button--primary">Start learning</Link></div></header>

    <main>
      <section className="hero">
        <div className="hero__copy"><p className="eyebrow">Legal study, thoughtfully organized</p><h1>Learn the law.<br /><em>Trace every source.</em></h1><p className="hero__lead">One focused workspace for coursework, legal research, assessments, and study progress—with a clear path back to the original authority.</p><div className="hero__actions"><Link to="/register" className="button button--primary button--large">Create your workspace <ArrowRight size={18} /></Link><Link to="/library" className="button button--secondary button--large">Explore the library</Link></div><p className="hero__note"><Check size={16} /> Starts empty. Your records stay on this device.</p></div>
        <div className="product-frame" aria-label="Product interface preview">
          <div className="product-frame__top"><span /><span /><span /><div><Command size={14} /> Search law, lessons, cases… <kbd>Ctrl K</kbd></div></div>
          <div className="product-frame__body"><aside><div className="mini-brand"><Scale size={16} /></div>{['Overview','Learn','Library','Cases','Progress'].map((item, index) => <span className={index === 0 ? 'is-active' : ''} key={item}>{item}</span>)}</aside><section><p className="eyebrow">Study overview</p><h2>Your legal work, in one place.</h2><div className="preview-grid"><div className="preview-main"><span className="preview-label">Continue learning</span><div className="preview-empty"><BookOpen size={24} /><strong>Choose your first course</strong><small>Your active lessons will appear here.</small></div></div><div className="preview-aside"><span className="preview-label">Research desk</span><div><FileSearch size={20} /><strong>Source-led search</strong><small>Filter by authority, jurisdiction, and status.</small></div></div></div></section></div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Platform principles"><span>Built for focused reading</span><span>Source-transparent research</span><span>Progress that reflects real study</span><span>Local-first personal data</span></section>

      <section className="subjects-section" id="subjects"><div className="section-intro"><p className="eyebrow">A broader field of view</p><h2>Move from doctrine to context without losing your place.</h2><p>Organize university study across national, comparative, and international law. The content catalog is ready for verified materials you add.</p></div><div className="subject-index">{subjects.map((subject, index) => <div key={subject}><span>{String(index + 1).padStart(2, '0')}</span><strong>{subject}</strong><ArrowRight size={17} /></div>)}</div></section>

      <section className="method-section" id="method"><div className="method-statement"><Scale size={30} /><p>Serious legal study needs more than a folder of links. Lexora connects reading, recall, and source verification in one continuous workflow.</p></div><ol><li><span>01</span><div><h3>Build a study path</h3><p>Import verified course material, choose a subject, and keep curriculum progress visible.</p></div></li><li><span>02</span><div><h3>Research with context</h3><p>Search across your learning catalog and open the original legal source from every indexed record.</p></div></li><li><span>03</span><div><h3>Turn reading into recall</h3><p>Complete assessments, review weak areas, and collect material for the next study session.</p></div></li></ol></section>

      <section className="source-callout"><div><p className="eyebrow">Authoritative starting points</p><h2>Open official law at the source.</h2><p>The source directory links directly to trusted national and international legal databases. Lexora does not present copied proprietary material as its own.</p><Link to="/sources" className="text-link">Browse the source directory <ArrowRight size={17} /></Link></div><div className="source-list"><a href="https://lex.uz" target="_blank" rel="noreferrer"><span>Uzbekistan</span><strong>LEX.UZ</strong><ExternalLink size={16} /></a><a href="https://eur-lex.europa.eu" target="_blank" rel="noreferrer"><span>European Union</span><strong>EUR-Lex</strong><ExternalLink size={16} /></a><a href="https://treaties.un.org" target="_blank" rel="noreferrer"><span>International</span><strong>UN Treaty Collection</strong><ExternalLink size={16} /></a></div></section>

      <section className="final-cta"><GraduationCap size={34} /><h2>A clearer way to prepare for what comes next.</h2><p>Create a private, empty study workspace and shape it around your curriculum.</p><Link to="/register" className="button button--gold button--large">Start with a clean workspace <ArrowRight size={18} /></Link></section>
    </main>
    <footer className="public-footer"><Brand /><p>Educational information only—not legal advice. Verify current legislation with the original source.</p><div><Link to="/about">Platform information</Link><Link to="/sources">Sources</Link><span>© {new Date().getFullYear()} Lexora</span></div></footer>
  </div>
}
