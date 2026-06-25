import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import AuthShell from '../components/AuthShell'
import { trackSignup } from '../lib/analytics'

export default function SignUp() {
  const { user, loading, register, claim } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  // A logged-in but unclaimed user is a guest converting their draft to an account.
  const isClaiming = !!user && user.is_claimed === false

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      if (isClaiming) {
        const res = await claim(email, fullName, '', '')  // name + email only; passwordless
        if (res?.magic_sent) { setMagicSent(true); return }
        if (!res?.merged) trackSignup()
        toast.success(res?.merged
          ? 'Welcome back — your event was added to your account! 🎉'
          : 'Account created — your event is saved! 🎉')
        nav('/dashboard')
      } else {
        await register(email, fullName, '', '')
        trackSignup()
        toast.success('Welcome to Agamos! 🎉 Let’s create your first event.')
        nav('/dashboard/new')
      }
    } catch (e: any) {
      const d = e?.response?.data
      setErr(d?.email?.[0] || d?.detail || 'Could not create your account.')
    } finally { setBusy(false) }
  }

  // Already a real account? No need to sign up again — go to the dashboard.
  if (!loading && user && user.is_claimed) return <Navigate to="/dashboard" replace />

  if (magicSent) {
    return (
      <AuthShell title="Check your email" subtitle="One quick step to add this event to your account."
        footer={<Link to="/" className="text-rose-deep font-semibold">← Back home</Link>}>
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center text-white text-3xl bg-gradient-to-br from-sage to-sage-deep">✉️</div>
          <p className="text-muted">You already have an account, so we’ve emailed a <b>sign-in link</b> to <b>{email}</b>. Open it and your event will be added to your account.</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={isClaiming ? 'Save your event' : 'Create your event'}
      subtitle="Just your name and email — no password needed. We’ll email you a link to get back in."
      footer={<>Already have an account? <Link to="/login" className="text-rose-deep font-semibold">Sign in</Link></>}
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
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Saving…' : isClaiming ? 'Save my event' : 'Create my event'}
        </button>
        <p className="text-xs text-muted text-center">No payment needed to start.</p>
      </form>
    </AuthShell>
  )
}
