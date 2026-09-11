export const DEFAULT_LOCALE = 'en'
export const SUPPORTED_LOCALES = ['en', 'uz', 'ru']

// UI copy is currently English. This boundary lets a translation adapter replace
// direct labels incrementally without changing route or data components.
export function createTranslator(messages = {}) {
  return (key, fallback) => messages[key] ?? fallback ?? key
}
