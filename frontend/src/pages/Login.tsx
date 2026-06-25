import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import AuthShell from '../components/AuthShell'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const { user, loading, login, requestMagicLink } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [sent, setSent] = useState(false)

  const sendLink = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await requestMagicLink(email); setSent(true) }
    catch { setErr('Could not send the link. Please try again.') }
    finally { setBusy(false) }
  }

  const passwordLogin = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await login(email, password); toast.success('Welcome back!'); nav('/dashboard') }
    catch (e2: any) { setErr(e2?.response?.data?.detail || 'Wrong email or password.') }
    finally { setBusy(false) }
  }

  // Claimed account → dashboard. A guest with a draft goes through the claim/merge form.
  if (!loading && user) return <Navigate to={user.is_claimed ? '/dashboard' : '/signup'} replace />

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="We’ve sent you a sign-in link."
        footer={<button onClick={() => setSent(false)} className="text-rose-deep font-semibold">Use a different email</button>}>
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center text-white text-3xl bg-gradient-to-br from-sage to-sage-deep">✉️</div>
          <p className="text-muted">If <b>{email}</b> has an account, a one-tap sign-in link is on its way. Open it on this device to continue.</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your events."
      footer={<>New here? <Link to="/signup" className="text-rose-deep font-semibold">Create an event</Link></>}
    >
      {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2 mb-4">{err}</div>}
      {!usePassword ? (
        <form onSubmit={sendLink} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" autoComplete="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
          <p className="text-xs text-muted text-center">
            Prefer a password? <button type="button" onClick={() => setUsePassword(true)} className="text-rose-deep font-semibold">Sign in with password</button>
          </p>
        </form>
      ) : (
        <form onSubmit={passwordLogin} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" autoComplete="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Password</label>
              <Link to="/forgot-password" className="text-xs text-rose-deep font-semibold mb-1.5">Forgot password?</Link>
            </div>
            <PasswordInput autoComplete="current-password" placeholder="Enter your password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="text-xs text-muted text-center">
            <button type="button" onClick={() => setUsePassword(false)} className="text-rose-deep font-semibold">Email me a link instead</button>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
