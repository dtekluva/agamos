import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error'
interface Toast { id: number; message: string; type: ToastType }
interface Ctx {
  notify: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
}

const C = createContext<Ctx>(null as unknown as Ctx)
export const useToast = () => useContext(C)

let _id = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++_id
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => remove(id), 4200)
  }, [])

  const success = useCallback((m: string) => notify(m, 'success'), [notify])
  const error = useCallback((m: string) => notify(m, 'error'), [notify])

  return (
    <C.Provider value={{ notify, success, error }}>
      {children}
      <div className="fixed top-6 inset-x-0 z-[100] flex flex-col items-center gap-3 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            onClick={() => remove(t.id)}
            className={`toast-pop pointer-events-auto cursor-pointer flex items-center gap-3 rounded-2xl px-6 py-4 shadow-lift text-white max-w-md ${
              t.type === 'success'
                ? 'bg-gradient-to-r from-success to-[#3aa37b]'
                : 'bg-gradient-to-r from-error to-[#cf4f60]'
            }`}
          >
            <span className="w-8 h-8 rounded-full bg-white/25 grid place-items-center text-lg shrink-0 font-bold">
              {t.type === 'success' ? '✓' : '!'}
            </span>
            <span className="font-semibold text-[15px] leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </C.Provider>
  )
}
