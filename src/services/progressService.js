export function courseCompletion(course, progress) {
  const lessons = (course?.modules || []).flatMap((module) => module.lessons || [])
  if (!lessons.length) return 0
  const done = lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length
  return Math.round((done / lessons.length) * 100)
}

export function learningStats(data, progress, quizHistory) {
  const allLessons = data.courses.flatMap((course) => (course.modules || []).flatMap((module) => module.lessons || []))
  const courseRates = data.courses.map((course) => courseCompletion(course, progress))
  return {
    lessonsCompleted: progress.completedLessons.length,
    coursesCompleted: courseRates.filter((rate) => rate === 100).length,
    overallProgress: allLessons.length ? Math.round((progress.completedLessons.length / allLessons.length) * 100) : 0,
    quizAccuracy: quizHistory.length ? Math.round(quizHistory.reduce((sum, item) => sum + item.score, 0) / quizHistory.length) : 0,
    studyMinutes: progress.studySessions.reduce((sum, item) => sum + (item.minutes || 0), 0),
  }
}
