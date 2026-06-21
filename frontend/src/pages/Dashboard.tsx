import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Dashboard() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="border-b border-soft bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-semibold">Agamos<span className="text-rose">.</span></Link>
          <div className="flex items-center gap-5 text-sm">
            <span className="text-muted hidden sm:block">{user?.full_name || user?.email}</span>
            <button onClick={logout} className="btn-ghost btn-sm">Log out</button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold mb-2">Welcome, {user?.full_name?.split(' ')[0] || 'there'} 👋</h1>
        <p className="text-muted">Your dashboard is coming together — registries, gifts, contributions and withdrawals will live here.</p>
      </main>
    </div>
  )
}
