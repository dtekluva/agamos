import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useRegistry } from '../lib/registry'
import { getEvent } from '../lib/eventTypes'
import EventSwitcher from './EventSwitcher'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { registry } = useRegistry()

  const storyLabel = registry ? getEvent(registry.event_type).storyToggleLabel : 'Story'
  const NAV = [
    { to: '/dashboard', label: 'Overview', end: true, icon: '🏠' },
    { to: '/dashboard/registry', label: 'Event page', icon: '💍' },
    { to: '/dashboard/gifts', label: 'Gifts', icon: '🎁' },
    { to: '/dashboard/exhibition', label: storyLabel, icon: '💌' },
    { to: '/dashboard/gallery', label: 'Gallery', icon: '📸' },
    { to: '/dashboard/guest-uploads', label: 'Guest uploads', icon: '🤳' },
    { to: '/dashboard/contributions', label: 'Contributions', icon: '💸' },
    { to: '/dashboard/withdrawals', label: 'Withdrawals', icon: '🏦' },
  ]

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-soft sticky top-0 z-30">
        <div className="px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-display text-xl font-semibold">Agamos<span className="text-rose">.</span></Link>
            <EventSwitcher />
          </div>
          <div className="flex items-center gap-4 text-sm">
            {registry && (
              <a href={`/r/${registry.slug}`} target="_blank" rel="noreferrer"
                 className="text-rose-deep font-semibold hidden sm:block">View public page ↗</a>
            )}
            <Link to="/dashboard/account" className="text-muted hover:text-rose-deep hidden md:block">{user?.full_name || user?.email}</Link>
            <button onClick={logout} className="btn-ghost btn-sm">Log out</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-[220px_1fr] gap-8">
        <aside className="md:sticky md:top-20 self-start">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition ${
                    isActive ? 'bg-berry text-white' : 'text-ink hover:bg-soft'
                  }`
                }
              >
                <span>{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
