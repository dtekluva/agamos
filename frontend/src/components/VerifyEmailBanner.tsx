import { useState } from 'react'
import api from '../lib/api'
import { apiError } from '../lib/errors'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

// Soft-gate nudge: shown across the dashboard until the host verifies their email.
// Verification is only *enforced* at withdrawal — this just reminds and lets them resend.
export default function VerifyEmailBanner() {
  const { user } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  // Guests see the GuestBanner instead; only claimed-but-unverified users see this.
  if (!user || user.is_claimed === false || user.email_verified) return null

  const resend = async () => {
    setBusy(true)
    try {
      await api.post('/auth/resend-verification')
      toast.success('Verification email sent — check your inbox.')
    } catch (e) {
      toast.error(apiError(e, 'Could not send the email. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-warning/15 border-b border-warning/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-ink">
          <b>Confirm your email</b> so you don’t lose access — we sent a link to <b>{user.email}</b>.
        </p>
        <button onClick={resend} disabled={busy}
          className="text-sm font-semibold text-rose-deep underline underline-offset-2 disabled:opacity-60 whitespace-nowrap">
          {busy ? 'Sending…' : 'Resend email'}
        </button>
      </div>
    </div>
  )
}
