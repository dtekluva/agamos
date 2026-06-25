import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { usePageTitle } from '../lib/usePageTitle'

export default function MagicLogin() {
  usePageTitle('Signing you in — Agamos')
  const [params] = useSearchParams()
  const { magicLogin } = useAuth()
  const nav = useNavigate()
  const [err, setErr] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return  // guard StrictMode double-invoke
    ran.current = true
    const uid = params.get('uid'); const token = params.get('token'); const g = params.get('g') || undefined
    if (!uid || !token) { setErr('This sign-in link is incomplete.'); return }
    magicLogin(uid, token, g)
      .then(() => nav('/dashboard', { replace: true }))
      .catch((e: any) => setErr(e?.response?.data?.detail || 'This sign-in link is invalid or has expired.'))
  }, [])

  if (!err) return <div className="min-h-screen grid place-items-center text-muted">Signing you in…</div>
  return (
    <div className="min-h-screen grid place-items-center text-center px-6">
      <div>
        <h1 className="text-2xl font-display font-semibold mb-2">Couldn’t sign you in</h1>
        <p className="text-muted mb-6">{err}</p>
        <Link to="/login" className="btn-primary">Request a new link</Link>
      </div>
    </div>
  )
}
