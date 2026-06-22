import { ReactNode, useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'

export type NavItem = { to: string; label: string; end?: boolean; icon: string }

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-berry text-white' : 'text-ink hover:bg-soft'
  }`

function NavList({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate} className={navClass}>
          <span className="shrink-0">{n.icon}</span>
          <span className="truncate">{n.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

const MenuIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
)
const XIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export default function DashboardChrome({
  nav, switcher, userLabel, publicUrl, onLogout, children,
}: {
  nav: NavItem[]
  switcher?: ReactNode
  userLabel?: string
  publicUrl?: string
  onLogout: () => void
  children: ReactNode
}) {
  const [drawer, setDrawer] = useState(false)

  // Lock body scroll + close on Escape while the mobile drawer is open.
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [drawer])

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-soft sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu"
                    className="md:hidden grid place-items-center w-10 h-10 -ml-1 rounded-xl text-ink hover:bg-soft shrink-0">
              {MenuIcon}
            </button>
            <Link to="/" className="font-display text-xl font-semibold shrink-0">Agamos<span className="text-rose">.</span></Link>
            <div className="min-w-0 flex flex-1">{switcher}</div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-sm shrink-0">
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noreferrer"
                 className="text-rose-deep font-semibold hidden sm:block">View public page ↗</a>
            )}
            <Link to="/dashboard/account" className="text-muted hover:text-rose-deep hidden md:block truncate max-w-[160px]">{userLabel}</Link>
            <button onClick={onLogout} className="btn-ghost btn-sm">Log out</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid md:grid-cols-[220px_1fr] gap-6 md:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block md:sticky md:top-20 self-start">
          <NavList nav={nav} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="md:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[1px] drawer-backdrop" onClick={() => setDrawer(false)} />
          <div className="drawer-panel absolute inset-y-0 left-0 w-72 max-w-[82%] bg-white shadow-lift flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-soft">
              <span className="font-display text-xl font-semibold">Agamos<span className="text-rose">.</span></span>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu"
                      className="grid place-items-center w-10 h-10 rounded-xl text-ink hover:bg-soft">
                {XIcon}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavList nav={nav} onNavigate={() => setDrawer(false)} />
              <div className="border-t border-line mt-3 pt-3 flex flex-col gap-1">
                {publicUrl && (
                  <a href={publicUrl} target="_blank" rel="noreferrer" onClick={() => setDrawer(false)}
                     className="rounded-xl px-4 py-2.5 text-sm font-medium text-rose-deep hover:bg-soft">View public page ↗</a>
                )}
                <Link to="/dashboard/account" onClick={() => setDrawer(false)}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink hover:bg-soft truncate">{userLabel || 'Account'}</Link>
                <button onClick={() => { setDrawer(false); onLogout() }}
                        className="text-left rounded-xl px-4 py-2.5 text-sm font-medium text-ink hover:bg-soft">Log out</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
