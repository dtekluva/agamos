import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { apiError } from '../lib/errors'
import { useAuth } from '../lib/auth'
import AuthShell from '../components/AuthShell'
import { usePageTitle } from '../lib/usePageTitle'

export default function VerifyEmail() {
  usePageTitle('Verify your email — Agamos')
  const [params] = useSearchParams()
  const { user, refreshUser } = useAuth()
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working')
  const [msg, setMsg] = useState('Verifying your email…')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // guard against React StrictMode double-invoke
    ran.current = true
    const uid = params.get('uid')
    const token = params.get('token')
    if (!uid || !token) {
      setStatus('error'); setMsg('This verification link is incomplete.')
      return
    }
    api.post('/auth/verify-email', { uid, token })
      .then((r) => {
        setStatus('ok'); setMsg(r.data?.detail || 'Your email is verified. Thank you!')
        if (user) refreshUser().catch(() => {})
      })
      .catch((e) => {
        setStatus('error')
        setMsg(apiError(e, 'This verification link is invalid or has expired.'))
      })
  }, [])

  const icon = status === 'ok' ? '✓' : status === 'error' ? '!' : '…'
  const tone = status === 'ok'
    ? 'from-gold-light to-rose'
    : status === 'error' ? 'from-error to-error' : 'from-rose to-rose-deep'

  return (
    <AuthShell
      title="Email verification"
      subtitle="Confirming your Agamos account."
      footer={<Link to={user ? '/dashboard' : '/login'} className="font-semibold text-rose-deep">{user ? 'Go to dashboard' : 'Go to login'}</Link>}
    >
      <div className="text-center py-4">
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center text-white text-3xl bg-gradient-to-br ${tone}`}>{icon}</div>
        <h2 className="text-2xl font-semibold mb-2">
          {status === 'ok' ? 'Email verified!' : status === 'error' ? 'Couldn’t verify' : 'One moment…'}
        </h2>
        <p className="text-muted mb-6">{msg}</p>
        <Link to={user ? '/dashboard' : '/login'} className="btn-primary w-full">
          {user ? 'Back to dashboard' : 'Log in'}
        </Link>
      </div>
    </AuthShell>
  )
}
