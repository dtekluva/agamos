import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../lib/api'
import { apiError } from '../lib/errors'
import { prettyDate } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'

type RsvpChoice = 'yes' | 'maybe' | 'no'
type Invite = {
  name: string
  rsvp_status: 'pending' | RsvpChoice
  party_size: number
  table: string
  code: string
  event: { display_name: string; slug: string; event_date: string | null; city: string; venue: string; published: boolean }
}

export default function InvitePage() {
  const { token } = useParams()
  const [data, setData] = useState<Invite | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [errMsg, setErrMsg] = useState('')
  const [party, setParty] = useState(1)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<RsvpChoice | null>(null)
  usePageTitle('Your invitation — Agamos')

  useEffect(() => {
    api.get(`/i/${token}`)
      .then((r) => {
        setData(r.data); setStatus('ok')
        setParty(r.data.party_size || 1)
        if (r.data.rsvp_status !== 'pending') setDone(r.data.rsvp_status)
      })
      .catch((e) => { setStatus('error'); setErrMsg(apiError(e, 'This invitation link is invalid.')) })
  }, [token])

  const rsvp = async (choice: RsvpChoice) => {
    setSaving(true)
    try {
      await api.post(`/i/${token}`, { rsvp_status: choice, party_size: choice === 'no' ? 1 : party })
      setDone(choice)
    } catch (e) {
      setErrMsg(apiError(e, 'Could not save your reply. Please try again.'))
    } finally { setSaving(false) }
  }

  if (status === 'loading') {
    return <div className="min-h-screen grid place-items-center text-muted">Loading your invitation…</div>
  }
  if (status === 'error' || !data) {
    return (
      <div className="min-h-screen grid place-items-center text-center px-6">
        <div>
          <h1 className="text-3xl font-display font-semibold mb-2">Invitation not found</h1>
          <p className="text-muted mb-6">{errMsg}</p>
          <Link to="/" className="btn-primary">Go to Agamos</Link>
        </div>
      </div>
    )
  }

  const ev = data.event
  const meta = [ev.event_date && prettyDate(ev.event_date), ev.city].filter(Boolean).join('  ·  ')
  const first = data.name.split(' ')[0]

  return (
    <div className="min-h-screen bg-cream grid place-items-center px-4 py-10">
      <div className="card p-8 max-w-md w-full text-center">
        <p className="uppercase tracking-[0.25em] text-xs font-semibold text-rose-deep mb-3">You’re invited</p>
        <h1 className="font-display text-3xl font-semibold mb-1">{ev.display_name}</h1>
        {meta && <p className="text-muted">{meta}</p>}
        {ev.venue && <p className="text-muted text-sm mt-1">{ev.venue}</p>}

        <div className="border-t border-line my-6" />

        {done ? (
          <div>
            <div className={`w-14 h-14 rounded-full mx-auto mb-3 grid place-items-center text-white text-2xl ${done === 'yes' ? 'bg-success' : done === 'maybe' ? 'bg-warning' : 'bg-muted'}`}>
              {done === 'yes' ? '✓' : done === 'maybe' ? '?' : '✿'}
            </div>
            <h2 className="text-xl font-semibold mb-1">
              {done === 'yes' ? `See you there, ${first}! 🎉`
                : done === 'maybe' ? `Thanks, ${first} — we’ll hope to see you.`
                : `Thanks for letting us know, ${first}.`}
            </h2>
            {done === 'yes' ? (
              <>
                <p className="text-muted text-sm mb-4">Your RSVP is saved. Here’s your entry pass — show it at the door.</p>
                <div className="rounded-2xl border border-line bg-soft/30 p-5 mb-3">
                  <p className="text-xs text-muted">Entry code</p>
                  <p className="font-mono text-2xl font-bold tracking-[0.25em] text-ink">{data.code}</p>
                  {data.table && <p className="text-sm text-ink mt-2">Your table: <b>{data.table}</b></p>}
                  <img src={`${api.defaults.baseURL}/i/${token}/qr.png`} alt="Your entry QR code"
                       width={168} height={168} className="mx-auto mt-3 rounded-lg border border-line bg-white" />
                </div>
                <p className="text-xs text-muted mb-4">We’ve emailed this pass to you too.</p>
              </>
            ) : done === 'maybe' ? (
              <p className="text-muted text-sm mb-6">We’ve noted your maybe — update your reply any time. You can still send a gift below.</p>
            ) : (
              <p className="text-muted text-sm mb-6">You’ll be missed — but you can still send a gift below.</p>
            )}
            <button onClick={() => setDone(null)} className="text-rose-deep text-sm font-semibold mb-4 block mx-auto">Change my reply</button>
          </div>
        ) : (
          <div>
            <p className="font-medium mb-4">Hi {first}, can you make it?</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <label className="text-sm text-muted">Party size</label>
              <input type="number" min="1" max="20" value={party} onChange={(e) => setParty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                     className="input w-20 py-2 text-center" />
            </div>
            {errMsg && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2 mb-3">{errMsg}</div>}
            <div className="flex flex-col gap-2">
              <button onClick={() => rsvp('yes')} disabled={saving} className="btn-primary">{saving ? '…' : "I’ll be there"}</button>
              <div className="flex gap-3">
                <button onClick={() => rsvp('maybe')} disabled={saving} className="btn-ghost flex-1">Maybe</button>
                <button onClick={() => rsvp('no')} disabled={saving} className="btn-ghost flex-1">Can’t make it</button>
              </div>
            </div>
          </div>
        )}

        {ev.published && (
          <Link to={`/r/${ev.slug}?g=${token}`} className="btn-gold w-full mt-2">See the gift list →</Link>
        )}
      </div>
    </div>
  )
}
