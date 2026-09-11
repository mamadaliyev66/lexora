import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Clock3, FileText, GraduationCap, Languages, ListChecks, Search } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, BookmarkButton, Button, EmptyState, PageHeader, ProgressBar, SourceBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { courseCompletion } from '../../services/progressService'

function CourseCard({ course }) {
  const { progress, bookmarks, toggleBookmark } = useData()
  const rate = courseCompletion(course, progress)
  const lessons = (course.modules || []).flatMap((module) => module.lessons || [])
  const saved = bookmarks.some((item) => item.id === course.id && item.type === 'course')
  return <article className="course-card"><div className="course-card__top"><Badge tone="blue">{course.category || 'Uncategorized'}</Badge><BookmarkButton active={saved} label="Save" onClick={() => toggleBookmark({ id: course.id, type: 'course', title: course.title, url: `/courses/${course.id}`, category: course.category })} /></div><h2>{course.title}</h2><p>{course.description || 'No course description has been provided.'}</p><div className="meta-line"><span><ListChecks size={15} /> {lessons.length} lessons</span><span><Clock3 size={15} /> {course.duration || 'Not set'}</span><span><GraduationCap size={15} /> {course.difficulty || 'Open level'}</span></div>{rate > 0 && <ProgressBar value={rate} label="Course progress" />}<Link className="card-link" to={`/courses/${course.id}`}>{rate > 0 ? 'Continue course' : 'View course'} <ArrowRight size={17} /></Link></article>
}

function CoursesPage() {
  const { data, progress } = useData()
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [language, setLanguage] = useState('all')
  const subjects = [...new Set(data.courses.map((item) => item.category).filter(Boolean))]
  const levels = [...new Set(data.courses.map((item) => item.difficulty).filter(Boolean))]
  const languages = [...new Set(data.courses.map((item) => item.language).filter(Boolean))]
  const filtered = data.courses.filter((course) => {
    const text = `${course.title} ${course.description} ${course.category}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (subject === 'all' || course.category === subject) && (difficulty === 'all' || course.difficulty === difficulty) && (language === 'all' || course.language === language)
  })
  return <div className="page"><PageHeader eyebrow="Learn" title="Legal courses" description="Build a structured path through doctrine, sources, and assessment." /><div className="filter-bar"><label className="filter-search"><Search size={17} /><input aria-label="Search courses" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses" /></label><label>Subject<select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="all">All subjects</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label><label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="all">All levels</option>{levels.map((item) => <option key={item}>{item}</option>)}</select></label><label>Language<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="all">All languages</option>{languages.map((item) => <option key={item}>{item}</option>)}</select></label></div>{filtered.length ? <><div className="result-count"><strong>{filtered.length}</strong> course{filtered.length === 1 ? '' : 's'} · {progress.startedCourses.length} started</div><div className="course-grid">{filtered.map((course) => <CourseCard course={course} key={course.id} />)}</div></> : <EmptyState icon={GraduationCap} title={data.courses.length ? 'No courses match these filters' : 'No courses have been added'} description={data.courses.length ? 'Clear a filter or try a broader subject.' : 'The catalog intentionally ships empty. Import verified curriculum JSON from Settings to make courses available.'} action={data.courses.length ? <Button variant="secondary" onClick={() => { setQuery(''); setSubject('all'); setDifficulty('all'); setLanguage('all') }}>Clear filters</Button> : <Link className="button button--secondary" to="/settings">Import course data</Link>} />}</div>
}

function CourseDetailPage() {
  const { courseId } = useParams()
  const { data, progress, bookmarks, toggleBookmark } = useData()
  const course = data.courses.find((item) => item.id === courseId)
  if (!course) return <MissingRecord type="course" back="/courses" />
  const lessons = (course.modules || []).flatMap((module) => module.lessons || [])
  const rate = courseCompletion(course, progress)
  const firstIncomplete = lessons.find((lesson) => !progress.completedLessons.includes(lesson.id)) || lessons[0]
  const saved = bookmarks.some((item) => item.id === course.id && item.type === 'course')
  return <div className="page"><Link to="/courses" className="back-link"><ArrowLeft size={16} /> All courses</Link><section className="course-hero"><div><Badge tone="blue">{course.category || 'Course'}</Badge><h1>{course.title}</h1><p>{course.description || 'No description has been provided.'}</p><div className="course-hero__actions">{firstIncomplete && <Link to={`/courses/${course.id}/lessons/${firstIncomplete.id}`} className="button button--primary">{rate ? 'Continue course' : 'Start course'} <ArrowRight size={17} /></Link>}<BookmarkButton active={saved} onClick={() => toggleBookmark({ id: course.id, type: 'course', title: course.title, url: `/courses/${course.id}` })} /></div></div><aside><ProgressBar value={rate} label="Course completion" /><dl><div><dt>Difficulty</dt><dd>{course.difficulty || 'Not set'}</dd></div><div><dt>Duration</dt><dd>{course.duration || 'Not set'}</dd></div><div><dt>Lessons</dt><dd>{lessons.length}</dd></div><div><dt>Language</dt><dd>{course.language || 'Not set'}</dd></div></dl></aside></section><div className="course-detail-grid"><main><section className="content-section"><p className="eyebrow">Learning objectives</p><h2>What this course covers</h2>{course.objectives?.length ? <ul className="check-list">{course.objectives.map((item) => <li key={item}><Check size={17} />{item}</li>)}</ul> : <p className="muted-copy">Learning objectives have not been supplied for this course.</p>}</section><section className="content-section"><p className="eyebrow">Curriculum</p><h2>{course.modules?.length || 0} modules</h2>{course.modules?.length ? <div className="curriculum">{course.modules.map((module, moduleIndex) => <details key={module.id || module.title} open={moduleIndex === 0}><summary><span><small>Module {moduleIndex + 1}</small><strong>{module.title}</strong></span><span>{module.lessons?.length || 0} lessons <ChevronDown size={17} /></span></summary><div>{(module.lessons || []).map((lesson, lessonIndex) => <Link key={lesson.id} to={`/courses/${course.id}/lessons/${lesson.id}`}><span className={progress.completedLessons.includes(lesson.id) ? 'lesson-status is-complete' : 'lesson-status'}>{progress.completedLessons.includes(lesson.id) ? <Check size={14} /> : lessonIndex + 1}</span><span><strong>{lesson.title}</strong><small>{lesson.duration || 'Reading time not set'}</small></span><ArrowRight size={16} /></Link>)}</div></details>)}</div> : <EmptyState icon={BookOpen} title="No modules in this course" description="Add modules and lessons to the imported course record before students begin." />}</section></main><aside className="course-context"><section><p className="eyebrow">Course information</p><dl><div><dt>Author</dt><dd>{course.author || 'Not specified'}</dd></div><div><dt>Updated</dt><dd>{course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'Not specified'}</dd></div></dl></section><section><p className="eyebrow">Related sources</p>{course.relatedSources?.length ? course.relatedSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><SourceBadge source={source.name} />{source.title || source.name}</a>) : <p>No source links have been attached.</p>}</section></aside></div></div>
}

function renderBlock(block, index) {
  const key = block.id || index
  if (block.type === 'heading') return <h2 id={block.id} key={key}>{block.text}</h2>
  if (block.type === 'note') return <aside className="reader-callout" key={key}><strong>{block.label || 'Important'}</strong><p>{block.text}</p></aside>
  if (block.type === 'definition') return <aside className="reader-definition" key={key}><BookOpen size={20} /><div><strong>{block.term}</strong><p>{block.text}</p></div></aside>
  if (block.type === 'quote') return <blockquote key={key}>{block.text}{block.citation && <cite>{block.citation}</cite>}</blockquote>
  if (block.type === 'list') return <ul key={key}>{(block.items || []).map((item) => <li key={item}>{item}</li>)}</ul>
  if (block.type === 'table') return <div className="reader-table" key={key}><table><thead><tr>{(block.headers || []).map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{(block.rows || []).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
  return <p key={key}>{block.text}</p>
}

function LessonReaderPage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { data, progress, completeLesson, addRecent, bookmarks, toggleBookmark } = useData()
  const course = data.courses.find((item) => item.id === courseId)
  const lessons = useMemo(() => (course?.modules || []).flatMap((module) => module.lessons || []), [course])
  const lesson = lessons.find((item) => item.id === lessonId)
  const currentIndex = lessons.findIndex((item) => item.id === lessonId)
  // A view is recorded once per route id, not whenever the data context refreshes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (lesson) addRecent({ id: lesson.id, type: 'lesson', title: lesson.title, url: `/courses/${courseId}/lessons/${lesson.id}` }) }, [courseId, lessonId])
  if (!course || !lesson) return <MissingRecord type="lesson" back={course ? `/courses/${courseId}` : '/courses'} />
  const complete = progress.completedLessons.includes(lesson.id)
  const saved = bookmarks.some((item) => item.id === lesson.id && item.type === 'lesson')
  const previous = lessons[currentIndex - 1]
  const next = lessons[currentIndex + 1]
  return <div className="lesson-reader"><aside className="lesson-nav"><Link to={`/courses/${course.id}`}><ArrowLeft size={16} /> Course overview</Link><p className="eyebrow">{course.title}</p>{(course.modules || []).map((module) => <section key={module.id || module.title}><h3>{module.title}</h3>{(module.lessons || []).map((item) => <Link className={item.id === lesson.id ? 'is-active' : ''} key={item.id} to={`/courses/${course.id}/lessons/${item.id}`}><span>{progress.completedLessons.includes(item.id) ? <Check size={13} /> : <FileText size={13} />}</span>{item.title}</Link>)}</section>)}</aside><article className="reader-content"><nav className="reader-toolbar"><Badge tone="blue">Lesson {currentIndex + 1} of {lessons.length}</Badge><BookmarkButton active={saved} onClick={() => toggleBookmark({ id: lesson.id, type: 'lesson', title: lesson.title, url: `/courses/${course.id}/lessons/${lesson.id}` })} /></nav><header><p className="eyebrow">{course.category}</p><h1 className="reader-title">{lesson.title}</h1><div className="meta-line"><span><Clock3 size={15} /> {lesson.duration || 'Reading time not set'}</span><span><Languages size={15} /> {course.language || 'Language not set'}</span></div></header><div className="prose">{lesson.content?.length ? lesson.content.map(renderBlock) : <EmptyState icon={FileText} title="Lesson content is empty" description="Add verified lesson blocks to this record before publishing it to learners." />}</div><footer className="lesson-actions">{previous ? <Link to={`/courses/${course.id}/lessons/${previous.id}`} className="button button--secondary"><ArrowLeft size={17} /> Previous lesson</Link> : <span />}<Button variant={complete ? 'secondary' : 'primary'} onClick={() => completeLesson(lesson.id, course.id)}>{complete ? <><Check size={17} /> Completed</> : 'Mark as complete'}</Button>{next ? <button className="button button--secondary" onClick={() => navigate(`/courses/${course.id}/lessons/${next.id}`)}>Next lesson <ArrowRight size={17} /></button> : <Link className="button button--secondary" to={`/courses/${course.id}`}>Course overview</Link>}</footer></article><aside className="lesson-outline"><p className="eyebrow">On this page</p>{lesson.content?.filter((block) => block.type === 'heading').map((block) => <a key={block.id || block.text} href={`#${block.id}`}>{block.text}</a>)}<div><strong>Source discipline</strong><p>Course explanations are educational content. Verify referenced law at the original source.</p></div></aside></div>
}

function MissingRecord({ type, back }) {
  return <div className="page"><EmptyState icon={FileText} title={`${type.charAt(0).toUpperCase() + type.slice(1)} not found`} description={`This ${type} is not in the current catalog. It may have been removed or the link may be incorrect.`} action={<Link className="button button--secondary" to={back}><ArrowLeft size={16} /> Go back</Link>} /></div>
}

export default function CoursePages({ page }) {
  if (page === 'course') return <CourseDetailPage />
  if (page === 'lesson') return <LessonReaderPage />
  return <CoursesPage />
}
