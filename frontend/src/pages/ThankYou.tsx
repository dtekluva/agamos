import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import api from '../lib/api'
import { money } from '../lib/format'

export default function ThankYou() {
  const { slug } = useParams()
  const [sp] = useSearchParams()
  const reference = sp.get('reference') || sp.get('trxref')
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!reference) { setStatus('failed'); return }
    api.get(`/contributions/verify?reference=${reference}`)
      .then((r) => { setData(r.data); setStatus(r.data.status === 'success' ? 'success' : 'failed') })
      .catch(() => setStatus('failed'))
  }, [reference])

  return (
    <div className="min-h-screen grid place-items-center px-6 bg-cream">
      <div className="card p-10 text-center max-w-md w-full">
        {status === 'loading' && <p className="text-muted py-8">Confirming your payment…</p>}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center text-white text-3xl bg-gradient-to-br from-gold-light to-rose">✓</div>
            <h1 className="text-3xl font-semibold mb-2">Thank you!</h1>
            <p className="text-muted mb-6">
              Your gift{data ? <> of <b className="text-ink">{money(data.amount)}</b> toward <b className="text-ink">{data.gift_title}</b></> : ''} was received. The couple will be so grateful.
            </p>
            <Link to={`/r/${slug}`} className="btn-primary w-full">Back to the event</Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center text-white text-3xl bg-muted">!</div>
            <h1 className="text-3xl font-semibold mb-2">Payment not confirmed</h1>
            <p className="text-muted mb-6">We couldn’t confirm this payment. If you were charged, it will reflect shortly — or try again.</p>
            <Link to={`/r/${slug}`} className="btn-primary w-full">Back to the event</Link>
          </>
        )}
      </div>
    </div>
  )
}
