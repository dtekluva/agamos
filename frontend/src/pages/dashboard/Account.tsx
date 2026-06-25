import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { apiError } from '../../lib/errors'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../lib/toast'
import PasswordInput from '../../components/PasswordInput'

export default function Account() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()

  const [fullName, setFullName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameErr, setNameErr] = useState('')

  const [pw, setPw] = useState({ current: '', next: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [pwErr, setPwErr] = useState('')

  useEffect(() => { setFullName(user?.full_name || '') }, [user?.full_name])

  const saveName = async (e: FormEvent) => {
    e.preventDefault(); setNameErr(''); setSavingName(true)
    try {
      await api.patch('/auth/me', { full_name: fullName })
      await refreshUser()
      toast.success('Profile updated')
    } catch (e2) {
      setNameErr(apiError(e2, 'Could not update your profile.'))
    } finally { setSavingName(false) }
  }

  const changePw = async (e: FormEvent) => {
    e.preventDefault(); setPwErr(''); setSavingPw(true)
    try {
      await api.post('/auth/change-password', { current_password: pw.current, new_password: pw.next })
      setPw({ current: '', next: '' })
      toast.success('Password changed')
    } catch (e2) {
      setPwErr(apiError(e2, 'Could not change your password.'))
    } finally { setSavingPw(false) }
  }

  // Guests have no real account yet — prompt them to claim instead of showing
  // the email + change-password forms (which would be meaningless for them).
  if (user && !user.is_claimed) {
    return (
      <div className="space-y-6 max-w-xl">
        <h1 className="text-3xl font-semibold">Account settings</h1>
        <section className="card p-6 text-center">
          <p className="text-muted mb-5">
            You’re using a <b>guest account</b>. Create your free account to set a password,
            manage your profile, and keep your event safe.
          </p>
          <Link to="/signup" className="btn-primary">Save my event &amp; create account</Link>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-3xl font-semibold">Account settings</h1>

      <section className="card p-6">
        <h3 className="font-semibold mb-4">Profile</h3>
        {nameErr && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2 mb-3">{nameErr}</div>}
        <form onSubmit={saveName} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input bg-soft/40 text-muted" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="label">Full name</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <button className="btn-primary btn-sm" disabled={savingName}>{savingName ? 'Saving…' : 'Save profile'}</button>
          </div>
        </form>
      </section>

      <section className="card p-6">
        <h3 className="font-semibold mb-4">Change password</h3>
        {pwErr && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2 mb-3">{pwErr}</div>}
        <form onSubmit={changePw} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <PasswordInput autoComplete="current-password" placeholder="Your current password"
              value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
          </div>
          <div>
            <label className="label">New password</label>
            <PasswordInput autoComplete="new-password" minLength={8}
              value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="At least 8 characters" required />
          </div>
          <div className="flex justify-end">
            <button className="btn-primary btn-sm" disabled={savingPw}>{savingPw ? 'Updating…' : 'Change password'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
