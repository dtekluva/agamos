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
  const [phone, setPhone] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameErr, setNameErr] = useState('')

  const [pw, setPw] = useState({ current: '', next: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [pwErr, setPwErr] = useState('')

  const [savingPref, setSavingPref] = useState('')

  useEffect(() => { setFullName(user?.full_name || ''); setPhone(user?.phone || '') }, [user?.full_name, user?.phone])

  const saveName = async (e: FormEvent) => {
    e.preventDefault(); setNameErr(''); setSavingName(true)
    try {
      await api.patch('/auth/me', { full_name: fullName, phone })
      await refreshUser()
      toast.success('Profile updated')
    } catch (e2) {
      setNameErr(apiError(e2, 'Could not update your profile.'))
    } finally { setSavingName(false) }
  }

  // Notification preferences save instantly on toggle.
  const togglePref = async (key: 'notify_on_contribution' | 'notify_on_rsvp' | 'notify_product', value: boolean) => {
    setSavingPref(key)
    try {
      await api.patch('/auth/me', { [key]: value })
      await refreshUser()
    } catch (e2) {
      toast.error(apiError(e2, 'Could not save your preference.'))
    } finally { setSavingPref('') }
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
          <div>
            <label className="label">Phone</label>
            <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +234…" />
          </div>
          <div className="flex justify-end">
            <button className="btn-primary btn-sm" disabled={savingName}>{savingName ? 'Saving…' : 'Save profile'}</button>
          </div>
        </form>
      </section>

      <section className="card p-6">
        <h3 className="font-semibold mb-1">Notifications</h3>
        <p className="text-sm text-muted mb-4">Choose which emails we send you. Guests always get their own receipts and passes.</p>
        <div className="space-y-2 text-sm">
          {([
            ['notify_on_contribution', 'When someone sends a gift', 'Get an email each time a contribution comes in.'],
            ['notify_on_rsvp', 'When a guest RSVPs', 'Get an email when an invited guest replies.'],
            ['notify_product', 'Product news & tips', 'Occasional updates and ideas from Agamos.'],
          ] as const).map(([key, label, hint]) => {
            const on = (user as any)?.[key] !== false
            return (
              <label key={key} className="flex items-start gap-3 rounded-lg border border-line px-3 py-2.5 cursor-pointer">
                <input type="checkbox" className="mt-1" checked={on} disabled={savingPref === key}
                       onChange={(e) => togglePref(key, e.target.checked)} />
                <span>
                  <span className="font-medium text-ink">{label}</span>
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
              </label>
            )
          })}
        </div>
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
