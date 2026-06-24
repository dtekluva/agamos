import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

// Shown across the dashboard while the user is an unclaimed guest, nudging them
// to create an account so their event is saved and they can come back to it.
export default function GuestBanner() {
  const { user } = useAuth()
  if (!user || user.is_claimed !== false) return null

  return (
    <div className="bg-rose/10 border-b border-rose/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-ink">
          <b>You’re building as a guest.</b> Sign up to save your event and get back to it anytime.
        </p>
        <div className="flex items-center gap-4 text-sm whitespace-nowrap">
          <Link to="/signup" className="btn-primary btn-sm">Save my event</Link>
          <Link to="/login" className="font-semibold text-rose-deep">Log in</Link>
        </div>
      </div>
    </div>
  )
}
