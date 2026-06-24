import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { usePageTitle } from '../lib/usePageTitle'
import EventTypePicker from '../components/EventTypePicker'

// Public, no-account entry to the builder. The guest account is created lazily —
// only once the visitor actually picks an event type — so idle "Create" clicks
// don't leave empty guest rows behind.
export default function StartEvent() {
  usePageTitle('Create your event — Agamos')
  const { user, guest } = useAuth()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)

  const pick = async (eventType: string) => {
    if (busy) return
    setBusy(true)
    try {
      if (!user) await guest()  // create the guest account now (first real action)
      nav('/dashboard/new', { state: { eventType } })
    } catch {
      nav('/signup')  // fall back to normal signup if the guest session fails
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-soft">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="font-display text-xl font-semibold">Agamos<span className="text-rose">.</span></Link>
          <span className="text-sm text-muted">
            Already have an account? <Link to="/login" className="text-rose-deep font-semibold">Log in</Link>
          </span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <EventTypePicker onPick={pick} />
          <p className="text-xs text-muted mt-6">Free to start · no account needed yet — you’ll save it when you’re ready.</p>
        </div>
      </main>
    </div>
  )
}
