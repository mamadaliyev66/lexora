import { readStorage, STORAGE_KEYS, writeStorage } from './storage'

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

function normalizeAccounts(accounts) {
  if (!accounts.length) return accounts
  const hasAdmin = accounts.some((account) => account.role === 'admin')
  let changed = false
  const normalized = accounts.map((account, index) => {
    const next = {
      ...account,
      role: account.role || (!hasAdmin && index === 0 ? 'admin' : 'student'),
      status: account.status || 'active',
    }
    if (next.role !== account.role || next.status !== account.status) changed = true
    return next
  })
  if (changed) writeStorage(STORAGE_KEYS.accounts, normalized)
  return normalized
}

function publicAccount(account) {
  if (!account) return null
  const safe = { ...account }
  delete safe.password
  return safe
}

function sessionFor(account) {
  return { id: account.id, fullName: account.fullName, email: account.email, role: account.role, status: account.status }
}

export const authService = {
  current() {
    const stored = readStorage(STORAGE_KEYS.session, null)
    if (!stored) return null
    const account = normalizeAccounts(readStorage(STORAGE_KEYS.accounts, [])).find((item) => item.id === stored.id)
    if (!account || account.status !== 'active') {
      localStorage.removeItem(STORAGE_KEYS.session)
      return null
    }
    const session = sessionFor(account)
    writeStorage(STORAGE_KEYS.session, session)
    return session
  },
  async register({ fullName, email, password, university = '', year = '', interests = [] }) {
    await wait()
    const accounts = normalizeAccounts(readStorage(STORAGE_KEYS.accounts, []))
    if (accounts.some((account) => account.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account already exists for this email address.')
    }
    const account = { id: crypto.randomUUID(), fullName, email, password, university, year, interests, role: accounts.length === 0 ? 'admin' : 'student', status: 'active', createdAt: new Date().toISOString() }
    writeStorage(STORAGE_KEYS.accounts, [...accounts, account])
    const session = sessionFor(account)
    writeStorage(STORAGE_KEYS.session, session)
    return session
  },
  async signIn({ email, password }) {
    await wait()
    const account = normalizeAccounts(readStorage(STORAGE_KEYS.accounts, [])).find(
      (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password,
    )
    if (!account) throw new Error('Email or password is incorrect.')
    if (account.status !== 'active') throw new Error('This account is suspended. Contact an administrator.')
    const session = sessionFor(account)
    writeStorage(STORAGE_KEYS.session, session)
    return session
  },
  signOut() {
    localStorage.removeItem(STORAGE_KEYS.session)
  },
  async requestPasswordReset(email) {
    await wait()
    return Boolean(readStorage(STORAGE_KEYS.accounts, []).find((item) => item.email.toLowerCase() === email.toLowerCase()))
  },
  listAccounts() {
    return normalizeAccounts(readStorage(STORAGE_KEYS.accounts, [])).map(publicAccount)
  },
  createAccount({ fullName, email, password, role = 'student' }) {
    const accounts = normalizeAccounts(readStorage(STORAGE_KEYS.accounts, []))
    if (!fullName?.trim() || !email?.trim() || !password) throw new Error('Name, email, and temporary password are required.')
    if (password.length < 8) throw new Error('The temporary password must be at least 8 characters.')
    if (accounts.some((account) => account.email.toLowerCase() === email.toLowerCase())) throw new Error('An account already exists for this email address.')
    const account = { id: crypto.randomUUID(), fullName: fullName.trim(), email: email.trim(), password, university: '', year: '', interests: [], role: role === 'admin' ? 'admin' : 'student', status: 'active', createdAt: new Date().toISOString() }
    writeStorage(STORAGE_KEYS.accounts, [...accounts, account])
    return publicAccount(account)
  },
  updateAccount(id, changes) {
    const accounts = normalizeAccounts(readStorage(STORAGE_KEYS.accounts, []))
    const target = accounts.find((account) => account.id === id)
    if (!target) throw new Error('Account not found.')
    const adminCount = accounts.filter((account) => account.role === 'admin').length
    if (target.role === 'admin' && changes.role && changes.role !== 'admin' && adminCount === 1) throw new Error('The final administrator cannot be demoted.')
    if (target.role === 'admin' && changes.status === 'suspended' && adminCount === 1) throw new Error('The final administrator cannot be suspended.')
    const allowed = { ...target }
    if (changes.role) allowed.role = changes.role === 'admin' ? 'admin' : 'student'
    if (changes.status) allowed.status = changes.status === 'suspended' ? 'suspended' : 'active'
    const next = accounts.map((account) => account.id === id ? allowed : account)
    writeStorage(STORAGE_KEYS.accounts, next)
    const session = readStorage(STORAGE_KEYS.session, null)
    if (session?.id === id) writeStorage(STORAGE_KEYS.session, sessionFor(allowed))
    return publicAccount(allowed)
  },
  deleteAccount(id, currentUserId) {
    const accounts = normalizeAccounts(readStorage(STORAGE_KEYS.accounts, []))
    const target = accounts.find((account) => account.id === id)
    if (!target) throw new Error('Account not found.')
    if (id === currentUserId) throw new Error('You cannot delete the account you are currently using.')
    if (target.role === 'admin' && accounts.filter((account) => account.role === 'admin').length === 1) throw new Error('The final administrator cannot be deleted.')
    writeStorage(STORAGE_KEYS.accounts, accounts.filter((account) => account.id !== id))
    const userData = readStorage(STORAGE_KEYS.userData, {})
    if (id in userData) {
      const remaining = { ...userData }
      delete remaining[id]
      writeStorage(STORAGE_KEYS.userData, remaining)
    }
  },
}
