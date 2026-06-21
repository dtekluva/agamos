import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import api from './api'
import type { User } from './types'

interface AuthCtx {
  user: User
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, full_name: string, password: string) => Promise<void>
  refreshUser: () => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('agamos_access')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('agamos_access'))
      .finally(() => setLoading(false))
  }, [])

  const persist = (access: string, refresh: string, u: User) => {
    localStorage.setItem('agamos_access', access)
    if (refresh) localStorage.setItem('agamos_refresh', refresh)
    setUser(u)
  }

  const login = async (email: string, password: string) => {
    const r = await api.post('/auth/login', { email, password })
    persist(r.data.access, r.data.refresh, r.data.user)
  }

  const register = async (email: string, full_name: string, password: string) => {
    const r = await api.post('/auth/register', { email, full_name, password })
    persist(r.data.access, r.data.refresh, r.data.user)
  }

  const refreshUser = async () => {
    const r = await api.get('/auth/me')
    setUser(r.data)
  }

  const logout = () => {
    localStorage.removeItem('agamos_access')
    localStorage.removeItem('agamos_refresh')
    setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, loading, login, register, refreshUser, logout }}>
      {children}
    </Ctx.Provider>
  )
}
