import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { apiError } from '../lib/errors'
import AuthShell from '../components/AuthShell'
import { usePageTitle } from '../lib/usePageTitle'

const CONTACT_EMAIL = 'getagamos@gmail.com'

export default function Contact() {
  usePageTitle('Contact us — Agamos')
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      await api.post('/contact', form)
      setDone(true)
    } catch (e2) {
      setErr(apiError(e2, 'Could not send your message. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Get in touch"
      subtitle="Questions, feedback, or partnership ideas — we’d love to hear from you."
      footer={<Link to="/" className="font-semibold text-rose-deep">← Back home</Link>}
    >
      <p className="text-sm text-muted mb-6">
        Prefer email? Reach us directly at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-rose-deep">{CONTACT_EMAIL}</a>.
      </p>

      {done ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center text-white text-3xl bg-gradient-to-br from-gold-light to-rose">✓</div>
          <h2 className="text-2xl font-semibold mb-2">Message sent!</h2>
          <p className="text-muted mb-6">Thanks for reaching out{form.name ? `, ${form.name.split(' ')[0]}` : ''} — we’ll get back to you soon.</p>
          <Link to="/" className="btn-primary w-full">Back home</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">{err}</div>}
          <div>
            <label className="label">Your name</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div>
            <label className="label">Subject (optional)</label>
            <input className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)} maxLength={160} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input min-h-[120px]" value={form.message} onChange={(e) => set('message', e.target.value)} required />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send message'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
