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
  onClose: () => void
  onSuccess: () => void
}

export default function ContributeModal({ gift, currency, heading = 'Contribute', actionWord = 'Contribute', onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState(gift.allow_partial ? '' : String(gift.remaining || gift.target_amount))
  const [message, setMessage] = useState('')
  const [anon, setAnon] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

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
      })
      const { reference, public_key, mock, currency: cur } = r.data

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

      // Open the Paystack Inline payment modal on this page.
      const handler = Paystack.setup({
        key: public_key,
        email: email || 'guest@agamos.app',
        amount: Math.round(parseFloat(amount) * 100),
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
            <div className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center text-white text-3xl bg-gradient-to-br from-gold-light to-rose">✓</div>
            <h2 className="text-2xl font-semibold mb-2">Thank you{name ? `, ${name.split(' ')[0]}` : ''}!</h2>
            <p className="text-muted mb-6">Your contribution toward <b>{gift.title}</b> means more than you know.</p>
            <button className="btn-primary w-full" onClick={onSuccess}>Done</button>
          </div>
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
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
                Give anonymously
              </label>
              <button className="btn-primary w-full" disabled={busy}>
                {busy ? 'Processing…' : `${actionWord} ${amount ? money(amount, currency) : ''}`}
              </button>
              <p className="text-xs text-muted text-center">Secured by Paystack.</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
