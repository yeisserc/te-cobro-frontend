import { createContext, useContext, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import { clearStoredUser, loadStoredUser, persistUser as saveUser } from '../lib/session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => loadStoredUser())

  const value = useMemo(
    () => ({
      currentUser,
      persistUser(user) {
        saveUser(user)
        setCurrentUser(user)
      },
      logout() {
        clearStoredUser()
        setCurrentUser(null)
      },
      async refreshUser(userId) {
        const user = await apiRequest(`users/${userId}`)
        saveUser(user)
        setCurrentUser(user)
        return user
      },
    }),
    [currentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
