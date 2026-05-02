import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { ACCESS_KEY, REFRESH_KEY, USER_KEY, apiClient } from '../api/client'
import type { LoginResponse, User } from '../api/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const access = localStorage.getItem(ACCESS_KEY)
    if (!access || user) return
    setLoading(true)
    apiClient
      .get<User>('/users/me/')
      .then((response) => {
        setUser(response.data)
        localStorage.setItem(USER_KEY, JSON.stringify(response.data))
      })
      .catch(() => {
        localStorage.removeItem(ACCESS_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [user])

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', {
      username,
      password,
    })
    const { access, refresh, user: loggedUser } = response.data
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser))
    setUser(loggedUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return ctx
}
