import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { money, prettyDate } from '../../lib/format'
import { useRegistry } from '../../lib/registry'
import { useToast } from '../../lib/toast'
import type { Contribution } from '../../lib/types'

export default function Contributions() {
  const { registry } = useRegistry()
  const toast = useToast()
  const [items, setItems] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!registry) return
    setLoading(true)
    api.get(`/contributions?registry=${registry.id}`)
      .then((r) => setItems(r.data.results ?? r.data))
      .finally(() => setLoading(false))
  }, [registry?.id])

  const cur = registry?.currency || 'NGN'
  const success = items.filter((c) => c.status === 'success')
  const total = success.reduce((s, c) => s + parseFloat(c.amount), 0)
  const thankedCount = success.filter((c) => c.thanked).length

  const toggleThank = async (c: Contribution) => {
    const next = !c.thanked
    setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, thanked: next } : x)))
    try {
      await api.patch(`/contributions/${c.id}/thank`, { thanked: next })
      if (next) toast.success(`Marked ${c.display_name} as thanked 💌`)
    } catch {
      setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, thanked: !next } : x)))
      toast.error('Could not update.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-semibold">Contributions</h1>
        <div className="flex items-center gap-2">
          {success.length > 0 && <span className="chip">{thankedCount}/{success.length} thanked</span>}
          <span className="chip">{money(total, cur)} received</span>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No contributions yet. Share your <Link to="/dashboard/registry" className="text-rose-deep font-semibold">public page</Link> to start receiving gifts.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-soft text-left text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Guest</th>
                <th className="px-5 py-3 font-medium">Gift</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Status</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Date</th>
                <th className="px-5 py-3 font-medium text-right">Thank-you</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-5 py-3">
                    <p className="font-medium">{c.display_name}</p>
                    {c.message && <p className="text-muted text-xs line-clamp-1 max-w-[200px]">“{c.message}”</p>}
                  </td>
                  <td className="px-5 py-3 text-muted">{c.gift_title}</td>
                  <td className="px-5 py-3 font-display font-semibold text-rose-deep">{money(c.amount, cur)}</td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className={`chip ${c.status === 'success' ? 'bg-success/10 text-success' : c.status === 'failed' ? 'bg-error/10 text-error' : ''}`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3 text-muted hidden md:table-cell">{prettyDate(c.created_at?.slice(0, 10))}</td>
                  <td className="px-5 py-3 text-right">
                    {c.status === 'success' && (
                      c.thanked ? (
                        <button onClick={() => toggleThank(c)} className="chip bg-success/10 text-success" title="Click to undo">Thanked ✓</button>
                      ) : (
                        <button onClick={() => toggleThank(c)} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-rose-deep hover:border-rose hover:bg-soft">Mark thanked</button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
