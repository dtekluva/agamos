import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { apiError } from '../../lib/errors'
import { useRegistry } from '../../lib/registry'
import { useToast } from '../../lib/toast'

type Guest = {
  id: number; name: string; email: string; phone: string; code: string; token: string
  rsvp_status: 'pending' | 'yes' | 'no'; party_size: number
  invited_at: string | null; viewed_at: string | null; rsvp_at: string | null
}

const EMPTY = { name: '', email: '', phone: '', party_size: 1 }

export default function Guests() {
  const { registry } = useRegistry()
  const toast = useToast()
  const [guests, setGuests] = useState<Guest[]>([])
  const [form, setForm] = useState<any>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)

  const load = () => {
    if (!registry) return
    return api.get(`/guests/?registry=${registry.id}`)
      .then((r) => setGuests(r.data.results ?? r.data))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [registry?.id])

  if (!registry) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-2xl font-semibold mb-2">Create your event first</h2>
        <Link to="/dashboard/registry" className="btn-primary mt-2">Create event</Link>
      </div>
    )
  }

  const inviteUrl = (g: Guest) => `${window.location.origin}/i/${g.token}`

  const add = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      await api.post('/guests/', { registry: registry.id, ...form, party_size: Number(form.party_size) || 1 })
      setForm(EMPTY); await load()
      toast.success('Guest added')
    } catch (e2) {
      setErr(apiError(e2, 'Could not add guest.'))
    } finally { setBusy(false) }
  }

  const invite = async (g: Guest) => {
    setActingId(g.id)
    try {
      await api.post(`/guests/${g.id}/invite/`)
      await load()
      toast.success(`Invite sent to ${g.name}`)
    } catch (e2) {
      toast.error(apiError(e2, 'Could not send invite.'))
    } finally { setActingId(null) }
  }

  const remove = async (g: Guest) => {
    setActingId(g.id)
    try { await api.delete(`/guests/${g.id}/`); await load() }
    catch (e2) { toast.error(apiError(e2, 'Could not remove guest.')) }
    finally { setActingId(null) }
  }

  const copyLink = (g: Guest) => {
    navigator.clipboard?.writeText(inviteUrl(g))
    toast.success('Invite link copied')
  }

  const whatsapp = (g: Guest) => {
    const text = `Hi ${g.name.split(' ')[0]}, you're invited to ${registry.display_name}! RSVP & see the gift list: ${inviteUrl(g)}`
    const num = (g.phone || '').replace(/[^\d]/g, '')
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const statusChip = (g: Guest) => {
    if (g.rsvp_status === 'yes') return <span className="chip bg-success/10 text-success">Attending · {g.party_size}</span>
    if (g.rsvp_status === 'no') return <span className="chip bg-error/10 text-error">Declined</span>
    if (g.viewed_at) return <span className="chip bg-warning/15 text-ink">Viewed</span>
    if (g.invited_at) return <span className="chip">Invited</span>
    return <span className="chip opacity-70">Not invited</span>
  }

  // Summary
  const attending = guests.filter((g) => g.rsvp_status === 'yes')
  const heads = attending.reduce((s, g) => s + (g.party_size || 1), 0)
  const declined = guests.filter((g) => g.rsvp_status === 'no').length
  const pending = guests.filter((g) => g.rsvp_status === 'pending').length

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold mb-1">Guests &amp; invites</h1>
      <p className="text-muted mb-6">Add the people you’re inviting, send each a personalised invitation, and track who’s coming.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5"><p className="text-sm text-muted">Attending</p><p className="text-2xl font-display font-semibold mt-1 text-success">{heads}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Pending</p><p className="text-2xl font-display font-semibold mt-1">{pending}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Declined</p><p className="text-2xl font-display font-semibold mt-1 text-muted">{declined}</p></div>
      </div>

      {/* Add guest */}
      <form onSubmit={add} className="card p-6 mb-6">
        <h3 className="font-semibold mb-3">Add a guest</h3>
        {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2 mb-3">{err}</div>}
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" type="email" placeholder="Email (to send an invite)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" type="tel" placeholder="Phone (optional, for WhatsApp)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" type="number" min="1" max="20" placeholder="Party size" value={form.party_size} onChange={(e) => setForm({ ...form, party_size: e.target.value })} />
        </div>
        <div className="flex justify-end mt-4">
          <button className="btn-primary btn-sm" disabled={busy}>{busy ? 'Adding…' : 'Add guest'}</button>
        </div>
      </form>

      <h3 className="font-semibold mb-3">Your guest list {guests.length > 0 && <span className="text-muted font-normal">({guests.length})</span>}</h3>
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : guests.length === 0 ? (
        <div className="card p-10 text-center text-muted">No guests yet — add your first above.</div>
      ) : (
        <div className="card divide-y divide-line">
          {guests.map((g) => (
            <div key={g.id} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-medium truncate">{g.name}</p>
                <p className="text-xs text-muted truncate">{g.email || g.phone || 'no contact'}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {statusChip(g)}
                <button onClick={() => invite(g)} disabled={actingId === g.id || !g.email}
                  title={g.email ? '' : 'Add an email to send an invite'}
                  className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-rose-deep hover:border-rose hover:bg-soft disabled:opacity-50">
                  {g.invited_at ? 'Re-invite' : 'Send invite'}
                </button>
                <button onClick={() => copyLink(g)} className="rounded-full border border-line px-3 py-1 text-xs font-semibold hover:bg-soft">Copy link</button>
                <button onClick={() => whatsapp(g)} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-[#1c8a4a] hover:bg-soft">WhatsApp</button>
                <button onClick={() => remove(g)} disabled={actingId === g.id} className="text-muted hover:text-error text-xs px-1">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
