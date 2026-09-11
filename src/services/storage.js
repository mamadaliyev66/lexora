export const STORAGE_KEYS = {
  accounts: 'lexora.accounts',
  session: 'lexora.session',
  profile: 'lexora.profile',
  progress: 'lexora.progress',
  bookmarks: 'lexora.bookmarks',
  collections: 'lexora.collections',
  recent: 'lexora.recent',
  quizzes: 'lexora.quizHistory',
  preferences: 'lexora.preferences',
  notifications: 'lexora.notifications',
  dataset: 'lexora.dataset',
  userData: 'lexora.userData',
  adminAudit: 'lexora.adminAudit',
}

export function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  return value
}
