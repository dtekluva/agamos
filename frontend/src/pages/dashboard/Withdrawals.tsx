import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { money, prettyDate } from '../../lib/format'
import { apiError } from '../../lib/errors'
import { useRegistry } from '../../lib/registry'
import { useToast } from '../../lib/toast'
import BankFields from '../../components/BankFields'

const emptyBank = { bank_name: '', bank_code: '', account_number: '', account_name: '' }

export default function Withdrawals() {
  const { registry, reload } = useRegistry()
  const toast = useToast()
  const [items, setItems] = useState<any[]>([])
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  // Inline bank details
  const [bank, setBank] = useState(emptyBank)
  const [bankEditing, setBankEditing] = useState(false)
  const [bankBusy, setBankBusy] = useState(false)
  const [bankErr, setBankErr] = useState('')

  const load = () => {
    if (!registry) return
    return api.get(`/withdrawals?registry=${registry.id}`)
      .then((r) => setItems(r.data.results ?? r.data))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [registry?.id])
  useEffect(() => {
    if (registry) setBank({
      bank_name: registry.bank_name || '', bank_code: registry.bank_code || '',
      account_number: registry.account_number || '', account_name: registry.account_name || '',
    })
  }, [registry?.id])

  if (!registry) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-2xl font-semibold mb-2">Create your event first</h2>
        <Link to="/dashboard/registry" className="btn-primary mt-2">Create event</Link>
      </div>
    )
  }

  const cur = registry.currency
  const hasBank = !!(registry.account_number && (registry.bank_code || registry.bank_name))
  const setB = (k: string, v: string) => setBank((b) => ({ ...b, [k]: v }))

  const saveBank = async (e: FormEvent) => {
    e.preventDefault(); setBankErr(''); setBankBusy(true)
    try {
      await api.patch(`/registries/${registry.id}/`, bank)
      await reload()
      setBankEditing(false)
      toast.success('Bank details saved 🏦')
    } catch (e2) {
      setBankErr(apiError(e2, 'Could not save bank details.'))
    } finally { setBankBusy(false) }
  }

  const request = async (e: FormEvent) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      const r = await api.post('/withdrawals', { registry: registry.id, amount })
      setAmount('')
      await Promise.all([load(), reload()])
      toast.success(r.data?.status === 'queued'
        ? 'Withdrawal queued — it’ll be sent automatically once your funds settle 🏦'
        : 'Withdrawal requested — funds are on the way 🏦')
    } catch (e2) {
      setErr(apiError(e2, 'Could not request withdrawal.'))
    } finally { setBusy(false) }
  }

  const showBankForm = !hasBank || bankEditing

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold mb-6">Withdrawals</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5"><p className="text-sm text-muted">Raised</p><p className="text-2xl font-display font-semibold mt-1">{money(registry.total_raised, cur)}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Withdrawn</p><p className="text-2xl font-display font-semibold mt-1">{money(registry.total_withdrawn || 0, cur)}</p></div>
        <div className="card p-5 ring-2 ring-rose/30"><p className="text-sm text-muted">Available</p><p className="text-2xl font-display font-semibold mt-1 text-rose-deep">{money(registry.available_balance, cur)}</p></div>
      </div>

      {/* Bank / payout account */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Payout account</h3>
          {hasBank && !bankEditing && (
            <button onClick={() => setBankEditing(true)} className="text-rose-deep font-semibold text-sm">Edit</button>
          )}
        </div>

        {showBankForm ? (
          <form onSubmit={saveBank}>
            {!hasBank && <p className="text-sm text-muted mb-4">Add the bank account where we’ll send your withdrawals.</p>}
            {bankErr && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2 mb-3">{bankErr}</div>}
            <BankFields value={bank} onChange={setBank} />
            <div className="flex justify-end gap-3 mt-4">
              {hasBank && <button type="button" onClick={() => setBankEditing(false)} className="btn-ghost btn-sm">Cancel</button>}
              <button className="btn-primary btn-sm" disabled={bankBusy || !bank.account_name}>{bankBusy ? 'Saving…' : 'Save bank details'}</button>
            </div>
          </form>
        ) : (
          <p className="text-muted">{registry.bank_name} · {registry.account_number} ({registry.account_name})</p>
        )}
      </div>

      {/* Withdraw form */}
      {hasBank && !bankEditing && (
        <form onSubmit={request} className="card p-6 mb-6">
          <h3 className="font-semibold mb-3">Request a withdrawal</h3>
          {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2 mb-3">{err}</div>}
          <div className="flex gap-3">
            <input className="input" type="number" min="100" placeholder={`Amount (${cur})`}
                   value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <button className="btn-primary whitespace-nowrap" disabled={busy}>{busy ? 'Requesting…' : 'Withdraw'}</button>
          </div>
          <p className="text-xs text-muted mt-2">
            Contributions become withdrawable after Paystack settles them — usually the next
            business day. A small Paystack fee applies per contribution.
          </p>
        </form>
      )}

      <h3 className="font-semibold mb-3">History</h3>
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted text-sm">No withdrawals yet.</p>
      ) : (
        <div className="card divide-y divide-line">
          {items.map((w) => (
            <div key={w.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-display font-semibold">{money(w.amount, cur)}</p>
                <p className="text-xs text-muted">{prettyDate(w.requested_at?.slice(0, 10))}</p>
              </div>
              <span className={`chip ${w.status === 'paid' ? 'bg-success/10 text-success' : w.status === 'failed' ? 'bg-error/10 text-error' : w.status === 'queued' ? 'bg-warning/15 text-ink' : ''}`}
                    title={w.status === 'queued' ? 'Will be sent automatically once your funds settle with Paystack' : undefined}>
                {w.status === 'queued' ? 'queued · awaiting settlement' : w.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
