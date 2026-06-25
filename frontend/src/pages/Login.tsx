import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import AuthShell from '../components/AuthShell'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const { user, loading, login } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      nav('/dashboard')
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Wrong email or password.')
    } finally {
      setBusy(false)
    }
  }

  // Claimed account → dashboard. A guest with a draft must go through the
  // claim/merge form (raw login would strand their draft), so send them there.
  if (!loading && user) return <Navigate to={user.is_claimed ? '/dashboard' : '/signup'} replace />

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your events."
      footer={<>New here? <Link to="/signup" className="text-rose-deep font-semibold">Create an event</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">{err}</div>}
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
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  )
}
