import courses from '../data/courses.json'
import legalDocuments from '../data/legalDocuments.json'
import cases from '../data/cases.json'
import dictionary from '../data/dictionary.json'
import quizzes from '../data/quizzes.json'
import sources from '../data/legalSources.json'
import { readStorage, STORAGE_KEYS, writeStorage } from './storage'

const baseData = { courses, legalDocuments, cases, dictionary, quizzes, sources }
const recordTypes = ['courses', 'legalDocuments', 'cases', 'dictionary', 'quizzes']

function validateDataset(data) {
  if (!data || typeof data !== 'object') throw new Error('The selected file must contain a JSON object.')
  recordTypes.forEach((key) => {
    if (key in data && !Array.isArray(data[key])) throw new Error(`${key} must be an array.`)
  })
  return Object.fromEntries(recordTypes.map((key) => [key, data[key] || []]))
}

export const legalDataService = {
  getAll() {
    const imported = readStorage(STORAGE_KEYS.dataset, {})
    return { ...baseData, ...imported, sources }
  },
  getById(type, id) {
    return this.getAll()[type]?.find((item) => item.id === id) || null
  },
  importDataset(data) {
    const clean = validateDataset(data)
    writeStorage(STORAGE_KEYS.dataset, clean)
    return clean
  },
  clearDataset() {
    localStorage.removeItem(STORAGE_KEYS.dataset)
  },
  exportDataset() {
    const data = this.getAll()
    return Object.fromEntries(recordTypes.map((key) => [key, data[key]]))
  },
  upsertRecord(type, record) {
    if (!recordTypes.includes(type)) throw new Error('Unsupported catalog type.')
    if (!record?.id || typeof record.id !== 'string') throw new Error('Every record needs a string id.')
    const current = this.exportDataset()
    const exists = current[type].some((item) => item.id === record.id)
    current[type] = exists ? current[type].map((item) => item.id === record.id ? record : item) : [record, ...current[type]]
    writeStorage(STORAGE_KEYS.dataset, current)
    return record
  },
  deleteRecord(type, id) {
    if (!recordTypes.includes(type)) throw new Error('Unsupported catalog type.')
    const current = this.exportDataset()
    current[type] = current[type].filter((item) => item.id !== id)
    writeStorage(STORAGE_KEYS.dataset, current)
  },
}
