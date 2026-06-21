import { useEffect, useRef, useState } from 'react'
import api from '../lib/api'
import { apiError } from '../lib/errors'
import { BANKS } from '../lib/banks'

export interface BankValue {
  bank_name: string
  bank_code: string
  account_number: string
  account_name: string
}

// Bank dropdown + account number with live Paystack account-name verification.
// When a 10-digit number + bank are entered, it resolves the account holder's
// name (and surfaces a clear error if Paystack can't resolve it).
export default function BankFields({ value, onChange }: {
  value: BankValue
  onChange: (v: BankValue) => void
}) {
  const [resolving, setResolving] = useState(false)
  const [err, setErr] = useState('')
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const valueRef = useRef(value)
  valueRef.current = value

  const acct = value.account_number.replace(/\D/g, '')

  useEffect(() => {
    setErr('')
    if (acct.length !== 10 || !value.bank_code) {
      if (valueRef.current.account_name) onChangeRef.current({ ...valueRef.current, account_name: '' })
      return
    }
    let cancelled = false
    setResolving(true)
    api.get(`/bank/resolve?account_number=${acct}&bank_code=${value.bank_code}`)
      .then((r) => { if (!cancelled) onChangeRef.current({ ...valueRef.current, account_name: r.data.account_name }) })
      .catch((e) => {
        if (cancelled) return
        setErr(apiError(e, 'We couldn’t verify this account.'))
        if (valueRef.current.account_name) onChangeRef.current({ ...valueRef.current, account_name: '' })
      })
      .finally(() => { if (!cancelled) setResolving(false) })
    return () => { cancelled = true }
  }, [acct, value.bank_code])

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="label">Bank</label>
        <select className="input" value={value.bank_code}
          onChange={(e) => {
            const b = BANKS.find((x) => x.code === e.target.value)
            onChange({ ...value, bank_code: e.target.value, bank_name: b?.name || '' })
          }}>
          <option value="">Select your bank…</option>
          {BANKS.map((b, i) => <option key={`${b.code}-${i}`} value={b.code}>{b.name}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Account number</label>
        <input className="input" value={value.account_number} inputMode="numeric" maxLength={10}
          placeholder="0123456789"
          onChange={(e) => onChange({ ...value, account_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
        {resolving && <p className="text-xs text-muted mt-1">Verifying account…</p>}
        {!resolving && value.account_name && (
          <p className="text-xs text-success mt-1">✓ {value.account_name}</p>
        )}
        {!resolving && err && <p className="text-xs text-error mt-1">{err}</p>}
      </div>
    </div>
  )
}
