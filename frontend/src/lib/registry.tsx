import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import api from './api'
import type { Registry } from './types'

interface Ctx {
  registries: Registry[]
  registry: Registry | null
  loading: boolean
  reload: () => Promise<void>
  setActive: (id: number) => void
  create: (data: Partial<Registry>) => Promise<Registry>
  update: (data: Partial<Registry>) => Promise<Registry>
  remove: (id: number) => Promise<void>
}

const C = createContext<Ctx>(null as unknown as Ctx)
export const useRegistry = () => useContext(C)

const STORE = 'agamos_active_registry'

export function RegistryProvider({ children }: { children: ReactNode }) {
  const [registries, setRegistries] = useState<Registry[]>([])
  const [activeId, setActiveIdState] = useState<number | null>(() => {
    const v = localStorage.getItem(STORE)
    return v ? Number(v) : null
  })
  const [loading, setLoading] = useState(true)

  const setActive = (id: number | null) => {
    setActiveIdState(id)
    if (id) localStorage.setItem(STORE, String(id))
    else localStorage.removeItem(STORE)
  }

  const fetchAll = async () => {
    const r = await api.get('/registries/')
    const list: Registry[] = r.data.results ?? r.data
    setRegistries(list)
    setActiveIdState((prev) => {
      const next = list.some((x) => x.id === prev) ? prev : (list[0]?.id ?? null)
      if (next) localStorage.setItem(STORE, String(next))
      else localStorage.removeItem(STORE)
      return next
    })
    return list
  }

  useEffect(() => {
    fetchAll().catch(() => {}).finally(() => setLoading(false))
  }, [])

  const reload = async () => { await fetchAll() }

  const create = async (data: Partial<Registry>) => {
    const r = await api.post('/registries/', data)
    await fetchAll()
    setActive(r.data.id)
    return r.data
  }

  const update = async (data: Partial<Registry>) => {
    const r = await api.patch(`/registries/${activeId}/`, data)
    await fetchAll()
    return r.data
  }

  const remove = async (id: number) => {
    await api.delete(`/registries/${id}/`)
    if (id === activeId) setActive(null)
    await fetchAll()
  }

  const registry = registries.find((x) => x.id === activeId) ?? null

  return (
    <C.Provider value={{ registries, registry, loading, reload, setActive, create, update, remove }}>
      {children}
    </C.Provider>
  )
}
