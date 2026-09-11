const routeByType = {
  course: (id) => `/courses/${id}`,
  lesson: (id, item) => `/courses/${item.courseId}/lessons/${id}`,
  law: (id) => `/library/${id}`,
  case: (id) => `/cases/${id}`,
  term: () => '/dictionary',
  quiz: (id) => `/quizzes/${id}`,
}

export function normalizeSearchData(data) {
  const records = [
    ...data.courses.map((item) => ({ ...item, type: 'course' })),
    ...data.courses.flatMap((course) => (course.modules || []).flatMap((module) => (module.lessons || []).map((lesson) => ({ ...lesson, courseId: course.id, type: 'lesson' })))),
    ...data.legalDocuments.map((item) => ({ ...item, type: 'law' })),
    ...data.cases.map((item) => ({ ...item, type: 'case' })),
    ...data.dictionary.map((item) => ({ ...item, type: 'term', title: item.term })),
    ...data.quizzes.map((item) => ({ ...item, type: 'quiz' })),
  ]
  return records.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title || 'Untitled record',
    description: item.description || item.summary || item.simpleDefinition || '',
    category: item.category || item.subject || '',
    source: item.source || '',
    url: routeByType[item.type](item.id, item),
  }))
}

export function searchRecords(data, query, filters = {}) {
  const needle = query.trim().toLowerCase()
  return normalizeSearchData(data).filter((record) => {
    const matchesQuery = !needle || [record.title, record.description, record.category, record.source].join(' ').toLowerCase().includes(needle)
    const matchesType = !filters.type || filters.type === 'all' || record.type === filters.type
    return matchesQuery && matchesType
  })
}
