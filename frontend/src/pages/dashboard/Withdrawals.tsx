import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { money, prettyDate } from '../../lib/format'
import { apiError } from '../../lib/errors'
import { useRegistry } from '../../lib/registry'
import { useToast } from '../../lib/toast'
import { useAuth } from '../../lib/auth'
import BankFields from '../../components/BankFields'

const emptyBank = { bank_name: '', bank_code: '', account_number: '', account_name: '' }

export default function Withdrawals() {
  const { registry, reload } = useRegistry()
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState<any[]>([])
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  // Bank details
  const [bank, setBank] = useState(emptyBank)
  const [bankEditing, setBankEditing] = useState(false)
  const [bankBusy, setBankBusy] = useState(false)
  const [bankErr, setBankErr] = useState('')

  // KYC (identity verification to lift the withdrawal cap)
  const [showKyc, setShowKyc] = useState(false)
  const [nin, setNin] = useState('')
  const [kycBusy, setKycBusy] = useState(false)
  const [kycErr, setKycErr] = useState('')

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
  const feeCfg = registry.withdrawal_fee || { model: 'flat', flat: 0, percent: 0, min_withdrawal: 0 }
  const verified = user?.kyc_status === 'verified'

  const feeFor = (a: number) => {
    if (!a) return 0
    const f = feeCfg.model === 'percent' ? (a * (feeCfg.percent || 0)) / 100 : (feeCfg.flat || 0)
    return Math.min(f, a)
  }
  const amt = Number(amount) || 0
  const fee = feeFor(amt)

  const saveBank = async (e: FormEvent) => {
    e.preventDefault(); setBankErr(''); setBankBusy(true)
    try {
      await api.patch(`/registries/${registry.id}/`, bank)
      await reload(); setBankEditing(false)
      toast.success('Bank details saved 🏦')
    } catch (e2) { setBankErr(apiError(e2, 'Could not save bank details.')) }
    finally { setBankBusy(false) }
  }

  const request = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const r = await api.post('/withdrawals', { registry: registry.id, amount })
      setAmount('')
      await Promise.all([load(), reload()])
      toast.success(r.data?.status === 'queued'
        ? 'Withdrawal queued — it’ll be sent automatically once your funds settle 🏦'
        : 'Withdrawal requested — funds are on the way 🏦')
    } catch (e2: any) {
      if (e2?.response?.data?.kyc_required) { setShowKyc(true); setErr('') }
      else setErr(apiError(e2, 'Could not request withdrawal.'))
    } finally { setBusy(false) }
  }

  const submitKyc = async (e: FormEvent) => {
    e.preventDefault(); setKycErr(''); setKycBusy(true)
    try {
      const r = await api.post('/auth/kyc', { nin })
      await refreshUser()
      if (r.data?.kyc_status === 'verified') { setShowKyc(false); toast.success('Identity verified — your cap is lifted ✓') }
      else toast.success('Submitted — we’ll review within 24 hours.')
    } catch (e2: any) {
      setKycErr(e2?.response?.data?.nin?.[0] || apiError(e2, 'Could not submit verification.'))
    } finally { setKycBusy(false) }
  }

  const showBankForm = !hasBank || bankEditing

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold mb-6">Wallet</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4"><p className="text-sm text-muted">Raised</p><p className="text-xl font-display mt-1">{money(registry.total_raised, cur)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Pending</p><p className="text-xl font-display mt-1 text-muted" title="In the settlement window — withdrawable soon">{money(registry.pending_balance || 0, cur)}</p></div>
        <div className="card p-4 ring-2 ring-sage/40"><p className="text-sm text-muted">Available</p><p className="text-xl font-display mt-1 text-sage-deep">{money(registry.available_balance, cur)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Withdrawn</p><p className="text-xl font-display mt-1">{money(registry.total_withdrawn || 0, cur)}</p></div>
      </div>

      {!verified && (
        <p className="text-xs text-muted mb-6">
          You can withdraw up to <b>{money(feeCfg.kyc_cap || 100000, cur)}</b> in total before verifying your identity.
        </p>
      )}

      {/* Payout account */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Payout account</h3>
          {hasBank && !bankEditing && <button onClick={() => setBankEditing(true)} className="text-rose-deep font-semibold text-sm">Edit</button>}
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

      {/* KYC gate (only when a withdrawal would cross the cap) */}
      {showKyc && !verified && (
        <form onSubmit={submitKyc} className="card p-6 mb-6 bg-warning/10 border border-warning/30">
          <h3 className="font-semibold mb-1">Verify your identity to withdraw more</h3>
          <p className="text-sm text-muted mb-3">
            You’ve reached the {money(feeCfg.kyc_cap || 100000, cur)} limit for unverified accounts. Enter your NIN to unlock unlimited withdrawals.
          </p>
          {kycErr && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2 mb-3">{kycErr}</div>}
          <input className="input mb-3" inputMode="numeric" placeholder="11-digit NIN" value={nin}
                 onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))} />
          <p className="text-xs text-muted mb-3">A selfie liveness check is added once our verification partner is live.</p>
          <button className="btn-primary btn-sm" disabled={kycBusy || nin.length !== 11}>{kycBusy ? 'Verifying…' : 'Verify identity'}</button>
        </form>
      )}

      {/* Withdraw form */}
      {hasBank && !bankEditing && (
        <form onSubmit={request} className="card p-6 mb-6">
          <h3 className="font-semibold mb-3">Request a withdrawal</h3>
          {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2 mb-3">{err}</div>}
          <div className="flex gap-3">
            <input className="input" type="number" min={feeCfg.min_withdrawal || 100} placeholder={`Amount (${cur})`}
                   value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <button className="btn-primary whitespace-nowrap" disabled={busy}>{busy ? 'Requesting…' : 'Withdraw'}</button>
          </div>
          {amt > 0 && fee > 0 && (
            <p className="text-sm text-ink mt-2">You’ll receive <b>{money(amt - fee, cur)}</b> after a {money(fee, cur)} fee.</p>
          )}
          <p className="text-xs text-muted mt-2">
            Funds become withdrawable once settled (usually the next business day). Minimum withdrawal {money(feeCfg.min_withdrawal || 0, cur)}.
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
                <p className="text-xs text-muted">
                  {prettyDate(w.requested_at?.slice(0, 10))}{Number(w.fee) > 0 && ` · ${money(w.fee, cur)} fee`}
                </p>
              </div>
              <span className={`chip ${w.status === 'paid' ? 'bg-success/10 text-success' : w.status === 'failed' ? 'bg-error/10 text-error' : w.status === 'queued' ? 'bg-warning/15 text-ink' : ''}`}
                    title={w.status === 'queued' ? 'Will be sent automatically once your funds settle' : undefined}>
                {w.status === 'queued' ? 'queued · awaiting settlement' : w.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
