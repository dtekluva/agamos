import { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted">Loading…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}
