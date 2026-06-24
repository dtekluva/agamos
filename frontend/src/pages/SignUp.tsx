import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import AuthShell from '../components/AuthShell'
import PasswordInput from '../components/PasswordInput'

export default function SignUp() {
  const { user, loading, register } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await register(email, fullName, phone, password)
      toast.success('Welcome to Agamos! 🎉 Let’s create your first event.')
      nav('/dashboard/new')  // drop new users straight into event creation (activation)
    } catch (e: any) {
      const d = e?.response?.data
      setErr(d?.email?.[0] || d?.phone?.[0] || d?.password?.[0] || d?.detail || 'Could not create your account.')
    } finally {
      setBusy(false)
    }
  }

  // Already signed in? No need to register again — go to the dashboard.
  if (!loading && user) return <Navigate to="/dashboard" replace />

  return (
    <AuthShell
      title="Create your event"
      subtitle="It’s free — set up your event page in under a minute."
      footer={<>Already have an account? <Link to="/login" className="text-rose-deep font-semibold">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">{err}</div>}
        <div>
          <label className="label">Your name</label>
          <input className="input" type="text" autoComplete="name"
            value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ada Okafor" required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="label">Phone number</label>
          <input className="input" type="tel" autoComplete="tel" inputMode="tel"
            value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 803 134 6306" required />
        </div>
        <div>
          <label className="label">Password</label>
          <PasswordInput autoComplete="new-password" minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create my event'}
        </button>
        <p className="text-xs text-muted text-center">No payment needed to start.</p>
      </form>
    </AuthShell>
  )
}
