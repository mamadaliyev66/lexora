import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useWebMCP } from '../hooks/useWebMCP'
import { legalDataService } from '../services/legalDataService'
import { toggleBookmark as calculateBookmarks } from '../services/bookmarkService'
import { readStorage, STORAGE_KEYS } from '../services/storage'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)
const initialProgress = { completedLessons: [], studySessions: [], startedCourses: [] }
const initialPreferences = { language: 'en', emailNotifications: false, studyReminders: true, legalUpdates: true }
const initialUserState = {
  bookmarks: [], collections: [], recentViews: [], progress: initialProgress,
  quizHistory: [], notifications: [], preferences: initialPreferences, profile: {},
}

function normalizeUserState(value = {}) {
  return {
    ...initialUserState,
    ...value,
    progress: { ...initialProgress, ...(value.progress || {}) },
    preferences: { ...initialPreferences, ...(value.preferences || {}) },
  }
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [data, setData] = useState(() => legalDataService.getAll())
  const [allUserData, setAllUserData] = useLocalStorage(STORAGE_KEYS.userData, {})
  const [adminAudit, setAdminAudit] = useLocalStorage(STORAGE_KEYS.adminAudit, [])
  const userState = normalizeUserState(user?.id ? allUserData[user.id] : {})
  const { bookmarks, collections, recentViews, progress, quizHistory, notifications, preferences, profile } = userState

  useEffect(() => {
    if (!user?.id || allUserData[user.id]) return
    setAllUserData((current) => {
      if (current[user.id]) return current
      const isFirstMigration = Object.keys(current).length === 0
      const nextState = isFirstMigration ? normalizeUserState({
        bookmarks: readStorage(STORAGE_KEYS.bookmarks, []),
        collections: readStorage(STORAGE_KEYS.collections, []),
        recentViews: readStorage(STORAGE_KEYS.recent, []),
        progress: readStorage(STORAGE_KEYS.progress, initialProgress),
        quizHistory: readStorage(STORAGE_KEYS.quizzes, []),
        notifications: readStorage(STORAGE_KEYS.notifications, []),
        preferences: readStorage(STORAGE_KEYS.preferences, initialPreferences),
        profile: readStorage(STORAGE_KEYS.profile, {}),
      }) : normalizeUserState()
      return { ...current, [user.id]: nextState }
    })
  }, [allUserData, setAllUserData, user?.id])

  const value = useMemo(() => {
    function updateUserSlice(slice, next) {
      if (!user?.id) return
      setAllUserData((current) => {
        const currentUser = normalizeUserState(current[user.id])
        const resolved = typeof next === 'function' ? next(currentUser[slice]) : next
        return { ...current, [user.id]: { ...currentUser, [slice]: resolved } }
      })
    }

    function appendAudit(action, details = {}) {
      const entry = {
        id: crypto.randomUUID(), action, details,
        actorId: user?.id || null, actorName: user?.fullName || 'System',
        createdAt: new Date().toISOString(),
      }
      setAdminAudit((items) => [entry, ...items].slice(0, 500))
      return entry
    }

    return {
      data, bookmarks, collections, recentViews, progress, quizHistory, notifications, preferences, profile,
      allUserData, adminAudit,
      toggleBookmark(item) { updateUserSlice('bookmarks', (items) => calculateBookmarks(items, item)) },
      addRecent(item) { updateUserSlice('recentViews', (items) => [{ ...item, viewedAt: new Date().toISOString() }, ...items.filter((entry) => !(entry.id === item.id && entry.type === item.type))].slice(0, 20)) },
      completeLesson(lessonId, courseId) {
        updateUserSlice('progress', (current) => ({ ...current, completedLessons: current.completedLessons.includes(lessonId) ? current.completedLessons : [...current.completedLessons, lessonId], startedCourses: current.startedCourses.includes(courseId) ? current.startedCourses : [...current.startedCourses, courseId] }))
      },
      saveQuizAttempt(attempt) { updateUserSlice('quizHistory', (items) => [{ ...attempt, completedAt: new Date().toISOString() }, ...items]) },
      createCollection(name) { const item = { id: crypto.randomUUID(), name, items: [], createdAt: new Date().toISOString() }; updateUserSlice('collections', (items) => [item, ...items]); return item },
      renameCollection(id, name) { updateUserSlice('collections', (items) => items.map((item) => item.id === id ? { ...item, name } : item)) },
      deleteCollection(id) { updateUserSlice('collections', (items) => items.filter((item) => item.id !== id)) },
      addToCollection(id, record) { updateUserSlice('collections', (items) => items.map((item) => item.id === id && !item.items.some((entry) => entry.id === record.id && entry.type === record.type) ? { ...item, items: [...item.items, record] } : item)) },
      removeFromCollection(id, recordId) { updateUserSlice('collections', (items) => items.map((item) => item.id === id ? { ...item, items: item.items.filter((entry) => entry.id !== recordId) } : item)) },
      updatePreferences(next) { updateUserSlice('preferences', (current) => ({ ...current, ...next })) },
      updateProfile(next) { updateUserSlice('profile', (current) => ({ ...current, ...next })) },
      markNotificationRead(id) { updateUserSlice('notifications', (items) => items.map((item) => item.id === id ? { ...item, read: true } : item)) },
      importDataset(next) { legalDataService.importDataset(next); setData(legalDataService.getAll()); appendAudit('catalog.imported') },
      clearDataset() { legalDataService.clearDataset(); setData(legalDataService.getAll()); appendAudit('catalog.cleared') },
      upsertCatalogRecord(type, record) { legalDataService.upsertRecord(type, record); setData(legalDataService.getAll()); appendAudit('catalog.record_saved', { type, id: record.id, title: record.title || record.term || record.id }) },
      deleteCatalogRecord(type, id) { legalDataService.deleteRecord(type, id); setData(legalDataService.getAll()); appendAudit('catalog.record_deleted', { type, id }) },
      appendAudit,
      clearAudit() { setAdminAudit([]) },
      removeUserData(id) { setAllUserData((current) => { const next = { ...current }; delete next[id]; return next }) },
      resetPersonalData() { if (user?.id) setAllUserData((current) => ({ ...current, [user.id]: normalizeUserState() })) },
    }
  }, [adminAudit, allUserData, bookmarks, collections, data, notifications, preferences, profile, progress, quizHistory, recentViews, setAdminAudit, setAllUserData, user?.fullName, user?.id])

  useWebMCP(value)

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  return useContext(DataContext)
}
