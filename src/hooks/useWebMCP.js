import { useEffect } from 'react'
import { normalizeSearchData, searchRecords } from '../services/searchService'

function requireText(value, label, maxLength = 160) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`)
  if (value.trim().length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`)
  return value.trim()
}

export function useWebMCP({ data, createCollection, toggleBookmark }) {
  useEffect(() => {
    const context = typeof document === 'undefined' ? undefined : document.modelContext
    if (!context?.registerTool) return undefined
    const lifecycle = new AbortController()
    const register = (tool) => {
      try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}) } catch { /* Unsupported implementations remain non-blocking. */ }
    }

    register({
      name: 'search_legal_catalog',
      title: 'Search legal catalog',
      description: 'Search the current Lexora catalog across legal documents, courses, lessons, cases, legal terms, and quizzes.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', minLength: 1 }, type: { type: 'string', enum: ['all', 'law', 'course', 'lesson', 'case', 'term', 'quiz'] } },
        required: ['query'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute(input) {
        const query = requireText(input?.query, 'Query', 200)
        const type = input?.type || 'all'
        return { results: searchRecords(data, query, { type }).slice(0, 20) }
      },
    })

    register({
      name: 'create_study_collection',
      title: 'Create study collection',
      description: 'Create an empty named collection in the visible Lexora workspace.',
      inputSchema: { type: 'object', properties: { name: { type: 'string', minLength: 1, maxLength: 70 } }, required: ['name'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const item = createCollection(requireText(input?.name, 'Collection name', 70))
        return { id: item.id, name: item.name, itemCount: 0 }
      },
    })

    register({
      name: 'bookmark_catalog_material',
      title: 'Bookmark catalog material',
      description: 'Bookmark one existing item from the current Lexora catalog by type and id.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', minLength: 1 }, type: { type: 'string', enum: ['law', 'course', 'lesson', 'case', 'term', 'quiz'] } },
        required: ['id', 'type'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        const id = requireText(input?.id, 'Record id', 200)
        const record = normalizeSearchData(data).find((item) => item.id === id && item.type === input?.type)
        if (!record) throw new Error('No matching catalog record exists.')
        toggleBookmark(record)
        return { id: record.id, type: record.type, title: record.title, bookmarked: true }
      },
    })

    return () => lifecycle.abort()
  }, [data, createCollection, toggleBookmark])
}
