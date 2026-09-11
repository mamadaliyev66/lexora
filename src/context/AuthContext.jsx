import { createContext, useContext, useMemo, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.current())
  const value = useMemo(() => ({
    user,
    async signIn(credentials) {
      const session = await authService.signIn(credentials)
      setUser(session)
      return session
    },
    async register(details) {
      const session = await authService.register(details)
      setUser(session)
      return session
    },
    signOut() {
      authService.signOut()
      setUser(null)
    },
    refreshSession() {
      const session = authService.current()
      setUser(session)
      return session
    },
  }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
