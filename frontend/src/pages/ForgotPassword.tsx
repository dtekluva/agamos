import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { apiError } from '../lib/errors'
import AuthShell from '../components/AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      await api.post('/auth/password-reset', { email })
      setSent(true)
    } catch (e: any) {
      setErr(apiError(e, 'Could not send the reset link.'))
    } finally { setBusy(false) }
  }

  return (
    <AuthShell
      title={sent ? 'Check your email' : 'Reset your password'}
      subtitle={sent ? 'If that address has an account, a reset link is on its way.' : 'Enter your email and we’ll send you a reset link.'}
      footer={<Link to="/login" className="text-rose-deep font-semibold">Back to log in</Link>}
    >
      {sent ? (
        <div className="rounded-xl bg-success/10 text-success text-sm px-4 py-3">
          We’ve emailed a link to <b>{email}</b>. Open it to choose a new password.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">{err}</div>}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
    </AuthShell>
  )
}
