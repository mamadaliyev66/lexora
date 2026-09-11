import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AdminRoute } from './components/AdminRoute'
import { AdminShell } from './components/AdminShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SkeletonRows } from './components/ui'
import { LandingPage } from './pages/public/LandingPage'

const AuthPages = lazy(() => import('./pages/public/AuthPages'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const CoursePages = lazy(() => import('./pages/learn/CoursePages'))
const ResearchPages = lazy(() => import('./pages/research/ResearchPages'))
const QuizPages = lazy(() => import('./pages/assessments/QuizPages'))
const StudentPages = lazy(() => import('./pages/student/StudentPages'))
const UtilityPages = lazy(() => import('./pages/utility/UtilityPages'))
const AdminPages = lazy(() => import('./pages/admin/AdminPages'))

function PageLoader() { return <div className="route-loader"><SkeletonRows count={5} /></div> }

export function App() {
  return <Suspense fallback={<PageLoader />}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<AuthPages page="login" />} />
    <Route path="/register" element={<AuthPages page="register" />} />
    <Route path="/forgot-password" element={<AuthPages page="forgot" />} />
    <Route path="/reset-password" element={<AuthPages page="reset" />} />
    <Route path="/verify-email" element={<AuthPages page="verify" />} />
    <Route path="/onboarding" element={<ProtectedRoute><AuthPages page="onboarding" /></ProtectedRoute>} />
    <Route path="/about" element={<UtilityPages page="about" standalone />} />
    <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/courses" element={<CoursePages page="courses" />} />
      <Route path="/courses/:courseId" element={<CoursePages page="course" />} />
      <Route path="/courses/:courseId/lessons/:lessonId" element={<CoursePages page="lesson" />} />
      <Route path="/library" element={<ResearchPages page="library" />} />
      <Route path="/library/:documentId" element={<ResearchPages page="document" />} />
      <Route path="/search" element={<ResearchPages page="search" />} />
      <Route path="/cases" element={<ResearchPages page="cases" />} />
      <Route path="/cases/:caseId" element={<ResearchPages page="case" />} />
      <Route path="/dictionary" element={<ResearchPages page="dictionary" />} />
      <Route path="/international-law" element={<ResearchPages page="international" />} />
      <Route path="/sources" element={<ResearchPages page="sources" />} />
      <Route path="/quizzes" element={<QuizPages page="quizzes" />} />
      <Route path="/quizzes/:quizId" element={<QuizPages page="quiz" />} />
      <Route path="/bookmarks" element={<StudentPages page="bookmarks" />} />
      <Route path="/collections" element={<StudentPages page="collections" />} />
      <Route path="/collections/:collectionId" element={<StudentPages page="collection" />} />
      <Route path="/progress" element={<StudentPages page="progress" />} />
      <Route path="/notifications" element={<StudentPages page="notifications" />} />
      <Route path="/profile" element={<StudentPages page="profile" />} />
      <Route path="/settings" element={<StudentPages page="settings" />} />
    </Route>
    <Route path="/admin" element={<AdminRoute><AdminShell /></AdminRoute>}>
      <Route index element={<AdminPages page="overview" />} />
      <Route path="users" element={<AdminPages page="users" />} />
      <Route path="content" element={<AdminPages page="content" />} />
      <Route path="quality" element={<AdminPages page="quality" />} />
      <Route path="activity" element={<AdminPages page="activity" />} />
      <Route path="system" element={<AdminPages page="system" />} />
    </Route>
    <Route path="/404" element={<UtilityPages page="not-found" standalone />} />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes></Suspense>
}
