import { FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { apiError } from '../lib/errors'
import AuthShell from '../components/AuthShell'
import PasswordInput from '../components/PasswordInput'

export default function ResetPassword() {
  const [sp] = useSearchParams()
  const uid = sp.get('uid') || ''
  const token = sp.get('token') || ''
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const badLink = !uid || !token

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      await api.post('/auth/password-reset-confirm', { uid, token, password })
      setDone(true)
    } catch (e: any) {
      setErr(apiError(e, 'Could not reset your password.'))
    } finally { setBusy(false) }
  }

  return (
    <AuthShell
      title={done ? 'Password updated' : 'Choose a new password'}
      subtitle={done ? 'You can now log in with your new password.' : 'Enter a new password for your account.'}
      footer={<Link to="/login" className="text-rose-deep font-semibold">Back to log in</Link>}
    >
      {done ? (
        <Link to="/login" className="btn-primary w-full">Log in</Link>
      ) : badLink ? (
        <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">
          This reset link is incomplete. Please request a new one from the <Link to="/forgot-password" className="font-semibold underline">forgot password</Link> page.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">{err}</div>}
          <div>
            <label className="label">New password</label>
            <PasswordInput autoComplete="new-password" minLength={8}
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
        </form>
      )}
    </AuthShell>
  )
}
