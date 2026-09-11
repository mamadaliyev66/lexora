import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookA, BriefcaseBusiness, ChevronRight, Copy, ExternalLink, FileSearch, Filter, Globe2, LibraryBig, Scale, Search, ShieldCheck } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Badge, BookmarkButton, Button, EmptyState, PageHeader, SourceBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { searchRecords } from '../../services/searchService'

function DocumentCard({ document }) {
  const { bookmarks, toggleBookmark } = useData()
  const saved = bookmarks.some((item) => item.id === document.id && item.type === 'law')
  return <article className="document-card"><div className="document-card__meta"><SourceBadge source={document.source || 'SOURCE NOT SET'} /><Badge tone={document.status === 'active' ? 'success' : document.status === 'repealed' ? 'danger' : 'neutral'}>{document.status || 'status unknown'}</Badge></div><h2><Link to={`/library/${document.id}`}>{document.title}</Link></h2><p>{document.summary || 'No educational summary has been supplied.'}</p><dl><div><dt>Document</dt><dd>{document.documentType || 'Not classified'}{document.documentNumber ? ` · ${document.documentNumber}` : ''}</dd></div><div><dt>Jurisdiction</dt><dd>{document.jurisdiction || 'Not specified'}</dd></div><div><dt>Updated</dt><dd>{document.updatedAt ? new Date(document.updatedAt).toLocaleDateString() : 'Not specified'}</dd></div></dl><footer><Link to={`/library/${document.id}`} className="text-link">Read document <ArrowRight size={16} /></Link><BookmarkButton active={saved} onClick={() => toggleBookmark({ id: document.id, type: 'law', title: document.title, url: `/library/${document.id}`, source: document.source })} />{document.originalUrl && <a href={document.originalUrl} target="_blank" rel="noreferrer">Original source <ExternalLink size={15} /></a>}</footer></article>
}

function LibraryPage() {
  const { data } = useData()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ jurisdiction: 'all', documentType: 'all', source: 'all', status: 'all', sort: 'relevance' })
  const option = (key) => [...new Set(data.legalDocuments.map((item) => item[key]).filter(Boolean))]
  const filtered = useMemo(() => {
    const rows = data.legalDocuments.filter((item) => {
      const text = `${item.title} ${item.summary} ${item.documentNumber} ${item.category}`.toLowerCase()
      return text.includes(query.toLowerCase()) && ['jurisdiction','documentType','source','status'].every((key) => filters[key] === 'all' || item[key] === filters[key])
    })
    return [...rows].sort((a, b) => filters.sort === 'newest' ? String(b.publicationDate || '').localeCompare(String(a.publicationDate || '')) : filters.sort === 'oldest' ? String(a.publicationDate || '').localeCompare(String(b.publicationDate || '')) : filters.sort === 'updated' ? String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) : 0)
  }, [data.legalDocuments, query, filters])
  const reset = () => { setQuery(''); setFilters({ jurisdiction: 'all', documentType: 'all', source: 'all', status: 'all', sort: 'relevance' }) }
  return <div className="page library-page"><PageHeader eyebrow="Legal research" title="Legal library" description="Search your verified index, inspect source metadata, and return to the original authority." actions={<Link to="/sources" className="button button--secondary"><Globe2 size={17} /> Source directory</Link>} /><section className="library-search"><Search size={21} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, document number, topic, or keyword" aria-label="Search legal library" /><kbd>Enter</kbd></section><section className="library-controls"><span><Filter size={16} /> Filter results</span>{['jurisdiction','documentType','source','status'].map((key) => <label key={key}>{key === 'documentType' ? 'Type' : key.charAt(0).toUpperCase() + key.slice(1)}<select value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}><option value="all">All</option>{option(key).map((item) => <option key={item}>{item}</option>)}</select></label>)}<label>Sort<select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}><option value="relevance">Relevance</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="updated">Recently updated</option></select></label></section><div className="result-count"><strong>{filtered.length}</strong> legal record{filtered.length === 1 ? '' : 's'} in this catalog</div>{filtered.length ? <div className="document-list">{filtered.map((document) => <DocumentCard key={document.id} document={document} />)}</div> : <EmptyState icon={LibraryBig} title={data.legalDocuments.length ? 'No documents match your search' : 'The legal index is empty'} description={data.legalDocuments.length ? 'Remove one or more filters, or try a document number.' : 'No example legislation is bundled. Import verified document metadata and educational summaries from Settings.'} action={data.legalDocuments.length ? <Button variant="secondary" onClick={reset}>Clear all filters</Button> : <Link to="/settings" className="button button--secondary">Import verified records</Link>} />}</div>
}

function DocumentReaderPage() {
  const { documentId } = useParams()
  const { data, addRecent, bookmarks, toggleBookmark } = useData()
  const document = data.legalDocuments.find((item) => item.id === documentId)
  const [within, setWithin] = useState('')
  const [copied, setCopied] = useState(false)
  // A view is recorded once per route id, not whenever the data context refreshes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (document) addRecent({ id: document.id, type: 'law', title: document.title, url: `/library/${document.id}` }) }, [documentId])
  if (!document) return <MissingResearchRecord type="document" back="/library" />
  const sections = (document.sections || []).map((section) => ({ ...section, articles: (section.articles || []).filter((article) => !within || `${article.number} ${article.title} ${article.body}`.toLowerCase().includes(within.toLowerCase())) })).filter((section) => section.articles.length || !within)
  const saved = bookmarks.some((item) => item.id === document.id && item.type === 'law')
  const citation = document.citation || [document.title, document.documentNumber, document.source].filter(Boolean).join(', ')
  async function copyCitation() { try { await navigator.clipboard.writeText(citation); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { setCopied(false) } }
  return <div className="document-reader"><header className="document-masthead"><Link to="/library" className="back-link"><ArrowLeft size={16} /> Legal library</Link><div className="document-masthead__main"><div><div className="document-card__meta"><SourceBadge source={document.source || 'SOURCE NOT SET'} /><Badge tone={document.status === 'active' ? 'success' : 'neutral'}>{document.status || 'status unknown'}</Badge></div><h1 className="reader-title">{document.title}</h1><p>{document.summary || 'No platform summary has been supplied.'}</p></div><aside><BookmarkButton active={saved} onClick={() => toggleBookmark({ id: document.id, type: 'law', title: document.title, url: `/library/${document.id}` })} /><button className="icon-text-button" onClick={copyCitation}><Copy size={17} />{copied ? 'Copied' : 'Copy citation'}</button>{document.originalUrl && <a className="button button--primary" href={document.originalUrl} target="_blank" rel="noreferrer">View original source <ExternalLink size={16} /></a>}</aside></div><dl className="document-facts"><div><dt>Jurisdiction</dt><dd>{document.jurisdiction || 'Not specified'}</dd></div><div><dt>Document number</dt><dd>{document.documentNumber || 'Not specified'}</dd></div><div><dt>Adopted</dt><dd>{document.adoptionDate || 'Not specified'}</dd></div><div><dt>Last modified</dt><dd>{document.updatedAt || 'Not specified'}</dd></div><div><dt>Language</dt><dd>{document.language || 'Not specified'}</dd></div></dl></header><div className="document-layout"><aside className="document-toc"><p className="eyebrow">Contents</p>{document.sections?.length ? document.sections.map((section) => <a key={section.id || section.title} href={`#${section.id}`}>{section.title}</a>) : <p>No table of contents.</p>}</aside><article className="legal-prose"><label className="within-search"><Search size={17} /><input value={within} onChange={(event) => setWithin(event.target.value)} placeholder="Search within this document" /></label><div className="content-label"><ShieldCheck size={16} /> Indexed content · verify against the original source</div>{sections.length ? sections.map((section) => <section id={section.id} key={section.id || section.title}><h2>{section.title}</h2>{section.articles.map((article) => <div className="legal-article" id={article.id || article.number} key={article.id || article.number}><span>{article.number}</span><div>{article.title && <h3>{article.title}</h3>}<p>{article.body}</p></div></div>)}</section>) : <EmptyState icon={FileSearch} title={within ? 'No article matches this phrase' : 'No indexed article text'} description={within ? 'Try a shorter phrase or clear the search field.' : 'Only metadata is available for this record. Use the original source link for the authoritative text.'} action={within && <Button variant="secondary" onClick={() => setWithin('')}>Clear search</Button>} />}</article><aside className="document-context"><section><p className="eyebrow">Source transparency</p><dl><div><dt>Source</dt><dd>{document.source || 'Not set'}</dd></div><div><dt>Original URL</dt><dd>{document.originalUrl ? <a href={document.originalUrl} target="_blank" rel="noreferrer">Open source <ExternalLink size={13} /></a> : 'Not supplied'}</dd></div><div><dt>Last checked</dt><dd>{document.lastChecked || 'Not recorded'}</dd></div></dl></section><section><p className="eyebrow">Content type</p><p>The summary and learning notes are platform content. The original text remains authoritative.</p></section></aside></div></div>
}

function Highlight({ text, query }) {
  if (!query.trim()) return text
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return String(text).split(new RegExp(`(${safe})`, 'ig')).map((part, index) => part.toLowerCase() === query.toLowerCase() ? <mark key={index}>{part}</mark> : part)
}

function SearchPage() {
  const { data } = useData()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [type, setType] = useState('all')
  const [recent, setRecent] = useLocalStorage('lexora.recentSearches', [])
  const results = useMemo(() => searchRecords(data, query, { type }), [data, query, type])
  function submit(event) { event.preventDefault(); setParams(query ? { q: query } : {}); if (query.trim()) setRecent((items) => [query.trim(), ...items.filter((item) => item !== query.trim())].slice(0, 5)) }
  return <div className="page search-page"><PageHeader eyebrow="Global search" title="Search your legal workspace" description="Find laws, courses, lessons, terms, cases, and assessments from one query." /><form className="global-search" onSubmit={submit}><Search size={23} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by concept, title, citation, or topic" list="search-suggestions" /><datalist id="search-suggestions">{searchRecords(data, '').slice(0, 12).map((record) => <option value={record.title} key={`${record.type}-${record.id}`} />)}</datalist><Button type="submit">Search</Button></form><div className="search-tabs" role="tablist" aria-label="Result type">{[['all','All'],['law','Laws'],['course','Courses'],['lesson','Lessons'],['term','Definitions'],['case','Cases'],['quiz','Quizzes']].map(([value, label]) => <button role="tab" aria-selected={type === value} className={type === value ? 'is-active' : ''} key={value} onClick={() => setType(value)}>{label}</button>)}</div>{!query && recent.length > 0 && <section className="recent-searches"><p className="eyebrow">Recent searches</p>{recent.map((term) => <button key={term} onClick={() => setQuery(term)}><Search size={15} />{term}</button>)}</section>}{query && <div className="result-count"><strong>{results.length}</strong> result{results.length === 1 ? '' : 's'} for “{query}”</div>}{results.length ? <div className="search-results">{results.map((result) => <Link key={`${result.type}-${result.id}`} to={result.url}><span className="record-type">{result.type}</span><div><h2><Highlight text={result.title} query={query} /></h2><p><Highlight text={result.description} query={query} /></p><small>{[result.category, result.source].filter(Boolean).join(' · ')}</small></div><ChevronRight size={19} /></Link>)}</div> : <EmptyState icon={FileSearch} title={query ? 'No matching records' : 'Begin with a legal concept or citation'} description={query ? 'Check the spelling, remove filters, or add verified catalog data from Settings.' : 'Search suggestions will appear as your catalog grows. The platform contains no example records.'} action={query && <Button variant="secondary" onClick={() => { setQuery(''); setType('all'); setParams({}) }}>Clear search</Button>} />}</div>
}

function CasesPage() {
  const { data } = useData()
  const [query, setQuery] = useState('')
  const filtered = data.cases.filter((item) => `${item.title} ${item.court} ${item.legalArea} ${item.summary}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="page"><PageHeader eyebrow="Case-based learning" title="Court cases" description="Study facts, legal issues, reasoning, and outcomes with source status kept visible." /><label className="page-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cases by issue, court, or legal area" /></label>{filtered.length ? <div className="case-grid">{filtered.map((item) => <article className="case-card" key={item.id}><div><Badge tone={item.classification === 'hypothetical' ? 'warning' : 'blue'}>{item.classification === 'hypothetical' ? 'Educational hypothetical' : 'Sourced case'}</Badge><span>{item.date || 'Date not set'}</span></div><h2>{item.title}</h2><p>{item.summary || 'No educational summary supplied.'}</p><dl><div><dt>Court</dt><dd>{item.court || 'Not specified'}</dd></div><div><dt>Legal area</dt><dd>{item.legalArea || 'Not specified'}</dd></div><div><dt>Outcome</dt><dd>{item.outcome || 'Not specified'}</dd></div></dl><Link className="text-link" to={`/cases/${item.id}`}>Study this case <ArrowRight size={16} /></Link></article>)}</div> : <EmptyState icon={Scale} title={data.cases.length ? 'No cases match this search' : 'No case studies have been added'} description={data.cases.length ? 'Try the court name, a broader issue, or clear the search.' : 'The platform does not invent court decisions. Import sourced cases or clearly marked educational hypotheticals.'} action={!data.cases.length && <Link className="button button--secondary" to="/settings">Import case data</Link>} />}</div>
}

function CaseDetailPage() {
  const { caseId } = useParams()
  const { data, addRecent, bookmarks, toggleBookmark } = useData()
  const item = data.cases.find((record) => record.id === caseId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (item) addRecent({ id: item.id, type: 'case', title: item.title, url: `/cases/${item.id}` }) }, [caseId])
  if (!item) return <MissingResearchRecord type="case" back="/cases" />
  const saved = bookmarks.some((record) => record.id === item.id && record.type === 'case')
  return <div className="page case-detail"><Link to="/cases" className="back-link"><ArrowLeft size={16} /> All cases</Link><header><div><Badge tone={item.classification === 'hypothetical' ? 'warning' : 'blue'}>{item.classification === 'hypothetical' ? 'Educational hypothetical' : 'Sourced case'}</Badge><h1>{item.title}</h1><p>{[item.court, item.date, item.legalArea].filter(Boolean).join(' · ')}</p></div><BookmarkButton active={saved} onClick={() => toggleBookmark({ id: item.id, type: 'case', title: item.title, url: `/cases/${item.id}` })} /></header><div className="case-detail__layout"><article>{[['Facts',item.facts],['Legal issue',item.legalIssue],['Arguments',item.arguments],['Decision',item.decision],['Court reasoning',item.reasoning],['Key takeaway',item.takeaway]].map(([title, content]) => <section key={title}><p className="eyebrow">{title}</p>{Array.isArray(content) ? <ul>{content.map((line) => <li key={line}>{line}</li>)}</ul> : <p>{content || 'This section has not been supplied.'}</p>}</section>)}</article><aside><p className="eyebrow">Source record</p><dl><div><dt>Classification</dt><dd>{item.classification || 'Not classified'}</dd></div><div><dt>Source</dt><dd>{item.source || 'Not supplied'}</dd></div></dl>{item.originalUrl ? <a className="button button--secondary" href={item.originalUrl} target="_blank" rel="noreferrer">Open official source <ExternalLink size={16} /></a> : <p>No external source link is attached.</p>}</aside></div></div>
}

function DictionaryPage() {
  const { data, bookmarks, toggleBookmark } = useData()
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState('all')
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const filtered = data.dictionary.filter((item) => (letter === 'all' || item.term?.toUpperCase().startsWith(letter)) && `${item.term} ${item.simpleDefinition} ${item.legalDefinition}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="page"><PageHeader eyebrow="Legal terminology" title="Legal dictionary" description="Move from plain-language orientation to a precise legal definition and related authority." /><label className="page-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search legal terms" /></label><div className="alphabet"><button className={letter === 'all' ? 'is-active' : ''} onClick={() => setLetter('all')}>All</button>{alphabet.map((item) => <button className={letter === item ? 'is-active' : ''} onClick={() => setLetter(item)} key={item}>{item}</button>)}</div>{filtered.length ? <div className="term-list">{filtered.map((term) => { const saved = bookmarks.some((item) => item.id === term.id && item.type === 'term'); return <article key={term.id}><div><h2>{term.term}</h2><BookmarkButton active={saved} onClick={() => toggleBookmark({ id: term.id, type: 'term', title: term.term, url: '/dictionary' })} /></div><p className="term-simple">{term.simpleDefinition || 'No simple explanation supplied.'}</p><details><summary>Academic definition <ChevronRight size={16} /></summary><p>{term.legalDefinition || 'No academic definition supplied.'}</p>{term.example && <p><strong>Example:</strong> {term.example}</p>}{term.relatedTerms?.length && <p><strong>Related:</strong> {term.relatedTerms.join(', ')}</p>}</details></article> })}</div> : <EmptyState icon={BookA} title={data.dictionary.length ? 'No terms match this filter' : 'The dictionary is ready for verified terms'} description={data.dictionary.length ? 'Choose another letter or clear the search.' : 'No example definitions are bundled. Import reviewed terminology from Settings.'} />}</div>
}

const internationalAreas = [
  ['UN treaties', 'un-treaties', 'Treaty status, participants, and official depositary records.'], ['International Court of Justice', 'icj', 'Cases, advisory opinions, and court documents.'], ['European Union law', 'eur-lex', 'EU treaties, legislation, preparatory acts, and case law.'], ['Human rights', 'hudoc', 'European Court of Human Rights case-law database.'], ['Intellectual property', 'wipo-lex', 'Global IP laws, treaties, and judgments.'], ['International labour law', 'natlex', 'National labour, social security, and human-rights legislation.'], ['Environmental law', 'ecolex', 'Treaties, legislation, decisions, and literature.'],
]

function InternationalPage() {
  const { data } = useData()
  return <div className="page international-page"><PageHeader eyebrow="Comparative research" title="International law" description="Move between fields and open the responsible database before relying on a legal proposition." /><section className="international-intro"><Globe2 size={31} /><p>Lexora provides an organized doorway to external authorities. Availability, coverage, and update practices are controlled by each source.</p></section><div className="international-grid">{internationalAreas.map(([title, sourceId, description]) => { const source = data.sources.find((item) => item.id === sourceId); return <article key={sourceId}><span className="international-grid__icon"><BriefcaseBusiness size={20} /></span><h2>{title}</h2><p>{description}</p>{source && <a href={source.url} target="_blank" rel="noreferrer"><SourceBadge source={source.name} /> Open database <ExternalLink size={15} /></a>}</article> })}</div></div>
}

function SourcesPage() {
  const { data } = useData()
  const [region, setRegion] = useState('all')
  const regions = [...new Set(data.sources.map((item) => item.region))]
  const sources = data.sources.filter((item) => region === 'all' || item.region === region)
  return <div className="page sources-page"><PageHeader eyebrow="Source transparency" title="Legal source directory" description="Authoritative and research databases used as starting points for verification." /><div className="source-notice"><ShieldCheck size={21} /><div><strong>Always verify the current text</strong><p>Links open the responsible external publisher. Inclusion does not imply that Lexora reproduces or continuously monitors its content.</p></div></div><div className="search-tabs">{['all', ...regions].map((item) => <button key={item} className={region === item ? 'is-active' : ''} onClick={() => setRegion(item)}>{item === 'all' ? 'All regions' : item}</button>)}</div><div className="source-directory"><div className="source-directory__head"><span>Source</span><span>Coverage</span><span>Region</span><span>Type</span><span /></div>{sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}><strong>{source.name}</strong><span>{source.area}</span><span>{source.region}</span><Badge>{source.kind}</Badge><ExternalLink size={16} /></a>)}</div></div>
}

function MissingResearchRecord({ type, back }) {
  return <div className="page"><EmptyState icon={FileSearch} title={`${type.charAt(0).toUpperCase() + type.slice(1)} not found`} description={`This ${type} is not available in the current data catalog.`} action={<Link to={back} className="button button--secondary"><ArrowLeft size={16} /> Go back</Link>} /></div>
}

export default function ResearchPages({ page }) {
  if (page === 'document') return <DocumentReaderPage />
  if (page === 'search') return <SearchPage />
  if (page === 'cases') return <CasesPage />
  if (page === 'case') return <CaseDetailPage />
  if (page === 'dictionary') return <DictionaryPage />
  if (page === 'international') return <InternationalPage />
  if (page === 'sources') return <SourcesPage />
  return <LibraryPage />
}
