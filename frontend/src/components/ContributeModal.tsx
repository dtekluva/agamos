import { FormEvent, useState } from 'react'
import api from '../lib/api'
import { money } from '../lib/format'
import { apiError } from '../lib/errors'
import type { Gift } from '../lib/types'

interface Props {
  gift: Gift
  currency: string
  slug: string
  heading?: string
  actionWord?: string
  guestToken?: string
  onClose: () => void
  onSuccess: () => void
}

// Mirror of backend services.compute_card_fee (Paystack NGN local card).
function estimateCardFee(amount: number) {
  if (!amount) return 0
  let fee = amount * 0.015
  if (amount >= 2500) fee += 100
  return Math.min(fee, 2000)
}

export default function ContributeModal({ gift, currency, heading = 'Contribute', actionWord = 'Contribute', guestToken, onClose, onSuccess }: Props) {
  const isItem = gift.kind === 'item'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState(gift.allow_partial ? '' : String(gift.remaining || gift.target_amount))
  const [message, setMessage] = useState('')
  const [anon, setAnon] = useState(false)
  const [hideAmount, setHideAmount] = useState(false)
  const [coverFees, setCoverFees] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const amt = parseFloat(amount) || 0
  const cardFee = coverFees ? estimateCardFee(amt) : 0

  const verifyAndFinish = async (reference: string) => {
    try {
      await api.get(`/contributions/verify?reference=${reference}`)
      setDone(true)
    } catch (e: any) {
      setErr(apiError(e, 'We could not confirm your payment.'))
    } finally {
      setBusy(false)
    }
  }

  // Physical item: reserve it (no payment) so no one double-buys.
  const reserve = async (e: FormEvent) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      await api.post(`/gifts/${gift.id}/reserve`, { name, email })
      setDone(true)
    } catch (e2: any) {
      setErr(apiError(e2, 'Could not reserve this gift.'))
    } finally { setBusy(false) }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const r = await api.post('/contributions/init', {
        gift: gift.id,
        guest_name: name,
        guest_email: email,
        amount,
        message,
        is_anonymous: anon,
        show_amount: !hideAmount,
        cover_fees: coverFees,
        ...(guestToken ? { guest_token: guestToken } : {}),
      })
      const { reference, public_key, mock, currency: cur, amount: charge } = r.data

      if (mock) {
        // No live keys: confirm the (mock) payment immediately.
        await verifyAndFinish(reference)
        return
      }

      const Paystack = (window as any).PaystackPop
      if (!Paystack || !public_key) {
        setErr('Payments aren’t configured yet. Please try again later.')
        setBusy(false)
        return
      }

      // Open the Paystack Inline payment modal — charge the gross (incl. covered fee).
      const handler = Paystack.setup({
        key: public_key,
        email: email || 'guest@agamos.app',
        amount: Math.round(parseFloat(charge || amount) * 100),
        currency: cur || currency,
        ref: reference,
        metadata: { gift: gift.title },
        onClose: () => setBusy(false),
        callback: (resp: any) => { verifyAndFinish(resp.reference) },
      })
      handler.openIframe()
    } catch (e: any) {
      setErr(apiError(e, 'Could not start your contribution. Please try again.'))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/55 backdrop-blur-sm"
         onClick={onClose}>
      <div className="card w-full max-w-md p-7 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close"
                className="absolute top-3 right-4 text-2xl text-muted hover:text-rose-deep">×</button>

        {done ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center text-white text-3xl bg-gradient-to-br from-gold-light to-rose">{isItem ? '🎁' : '✓'}</div>
            <h2 className="text-2xl font-semibold mb-2">Thank you{name ? `, ${name.split(' ')[0]}` : ''}!</h2>
            <p className="text-muted mb-6">
              {isItem
                ? <>You’ve reserved <b>{gift.title}</b> — it’s yours to bring. No one else can claim it now.</>
                : <>Your contribution toward <b>{gift.title}</b> means more than you know.</>}
            </p>
            <button className="btn-primary w-full" onClick={onSuccess}>Done</button>
          </div>
        ) : isItem ? (
          <>
            <h2 className="text-2xl font-semibold mb-1">Reserve this gift</h2>
            <p className="text-muted text-sm mb-5">
              Claim <b className="text-ink">{gift.title}</b> so no one else buys it too. You’ll bring it yourself.
            </p>
            <form onSubmit={reserve} className="space-y-4">
              {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">{err}</div>}
              <div>
                <label className="label">Your name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Email (optional)</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button className="btn-primary w-full" disabled={busy}>
                {busy ? 'Reserving…' : 'Reserve this gift'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-1">{heading}</h2>
            <p className="text-muted text-sm mb-5">
              Toward <b className="text-ink">{gift.title}</b> · {money(gift.remaining || gift.target_amount, currency)} to go
            </p>
            <form onSubmit={submit} className="space-y-4">
              {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">{err}</div>}
              <div>
                <label className="label">Your name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Email (for your receipt)</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">Amount ({currency})</label>
                <input className="input" type="number" min="100" value={amount}
                       onChange={(e) => setAmount(e.target.value)}
                       disabled={!gift.allow_partial && !gift.is_cash_fund} required />
                {!gift.allow_partial && !gift.is_cash_fund && (
                  <p className="text-xs text-muted mt-1">This gift is funded in full.</p>
                )}
              </div>
              <div>
                <label className="label">Message (optional)</label>
                <textarea className="input min-h-[70px]" value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
                  Hide my name (give anonymously)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={hideAmount} onChange={(e) => setHideAmount(e.target.checked)} />
                  Don’t show how much I gave
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={coverFees} onChange={(e) => setCoverFees(e.target.checked)} />
                  <span>
                    Cover the card fee so they get the full amount
                    {amt > 0 && coverFees && <span className="text-muted"> (+{money(cardFee, currency)})</span>}
                  </span>
                </label>
              </div>
              <button className="btn-primary w-full" disabled={busy}>
                {busy ? 'Processing…' : `${actionWord} ${amt ? money(amt + cardFee, currency) : ''}`}
              </button>
              <p className="text-xs text-muted text-center">Secured by Paystack.</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
