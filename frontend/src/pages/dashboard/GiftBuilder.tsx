import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { money } from '../../lib/format'
import { apiError, normalizeUrl } from '../../lib/errors'
import { useRegistry } from '../../lib/registry'
import { useToast } from '../../lib/toast'
import { getEvent } from '../../lib/eventTypes'
import type { Gift } from '../../lib/types'

const blank = { title: '', description: '', image_url: '', category: 'other', target_amount: '', allow_partial: true, is_cash_fund: false, show_progress: true }
const catLabel = (c: string) => c.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())

export default function GiftBuilder() {
  const { registry, reload, loading } = useRegistry()
  const toast = useToast()
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<any>(blank)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (loading) return <p className="text-muted">Loading…</p>
  if (!registry) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-2xl font-semibold mb-2">Create your event first</h2>
        <Link to="/dashboard/registry" className="btn-primary mt-2">Create event</Link>
      </div>
    )
  }

  const gifts = registry.gifts.filter((g) => !g.archived)
  const cfg = getEvent(registry.event_type)
  const CATEGORIES = cfg.suggestedCategories
  const isMemorial = cfg.surface === 'memorial'
  const itemWord = isMemorial ? 'fund' : 'gift'

  const openNew = () => { setForm({ ...blank, category: CATEGORIES[0] || 'other', is_cash_fund: isMemorial }); setFile(null); setEditing('new') }
  const openEdit = (g: Gift) => {
    setForm({ title: g.title, description: g.description, image_url: g.image_url, category: g.category, target_amount: g.target_amount, allow_partial: g.allow_partial, is_cash_fund: g.is_cash_fund, show_progress: g.show_progress })
    setFile(null); setEditing(g.id)
  }
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    const isNew = editing === 'new'
    try {
      let body: any
      if (file) {
        body = new FormData()
        body.append('registry', String(registry.id))
        body.append('title', form.title)
        body.append('description', form.description || '')
        body.append('category', form.category)
        body.append('target_amount', form.target_amount || '0')
        body.append('allow_partial', String(form.allow_partial))
        body.append('is_cash_fund', String(form.is_cash_fund))
        body.append('show_progress', String(form.show_progress))
        body.append('image', file)
      } else {
        body = {
          ...form, registry: registry.id,
          target_amount: form.target_amount || '0',
          image_url: normalizeUrl(form.image_url),
        }
      }
      if (isNew) await api.post('/gifts/', body)
      else await api.patch(`/gifts/${editing}/`, body)
      await reload(); setEditing(null)
      toast.success(isNew ? 'Gift added to your list' : 'Gift updated')
    } catch (e2) {
      setErr(apiError(e2, 'Could not save this gift.'))
    } finally { setBusy(false) }
  }

  const archive = async (g: Gift) => {
    await api.patch(`/gifts/${g.id}/`, { archived: true })
    await reload()
    toast.success('Gift archived')
  }

  const reorder = async (index: number, dir: -1 | 1) => {
    const arr = [...gifts]
    const j = index + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[index], arr[j]] = [arr[j], arr[index]]
    await Promise.all(arr.map((g, i) => api.patch(`/gifts/${g.id}/`, { sort_order: i })))
    await reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">{isMemorial ? 'Memorial funds' : 'Gifts & goals'}</h1>
        <button onClick={openNew} className="btn-primary btn-sm">+ Add a {itemWord}</button>
      </div>

      {editing !== null && (
        <form onSubmit={save} className="card p-6 mb-6 space-y-4">
          <h3 className="font-semibold">{editing === 'new' ? `New ${itemWord}` : `Edit ${itemWord}`}</h3>
          {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">{err}</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} required /></div>
            <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
            <div className="sm:col-span-2">
              <label className="label">Image</label>
              <label className="flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-2.5 text-sm cursor-pointer hover:border-rose mb-2">
                <span className="btn-ghost btn-sm">Upload</span>
                <span className="text-muted truncate">{file ? file.name : 'JPG or PNG from your device'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              <input className="input" placeholder="…or paste an image URL" value={form.image_url}
                     onChange={(e) => set('image_url', e.target.value)} disabled={!!file} />
            </div>
            <div><label className="label">Category</label><select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}</select></div>
            <div><label className="label">Target amount ({registry.currency})</label><input type="number" min="0" className="input" value={form.target_amount} onChange={(e) => set('target_amount', e.target.value)} required /></div>
            <div className="flex flex-col justify-end gap-3 text-sm sm:col-span-2">
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.allow_partial} disabled={form.is_cash_fund}
                         onChange={(e) => set('allow_partial', e.target.checked)} />
                  Allow partial contributions
                </label>
                <p className="text-xs text-muted ml-6 mt-0.5">
                  {form.is_cash_fund
                    ? 'A cash fund always accepts any amount — this setting doesn’t apply.'
                    : form.allow_partial
                      ? 'Guests can chip in any amount toward this gift.'
                      : 'Guests must fund the full amount in one payment.'}
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_cash_fund} onChange={(e) => set('is_cash_fund', e.target.checked)} />
                  This is a cash fund
                </label>
                <p className="text-xs text-muted ml-6 mt-0.5">A flexible money goal — guests give whatever they like.</p>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.show_progress}
                         disabled={!form.allow_partial && !form.is_cash_fund}
                         onChange={(e) => set('show_progress', e.target.checked)} />
                  Show funding progress
                </label>
                <p className="text-xs text-muted ml-6 mt-0.5">
                  {(!form.allow_partial && !form.is_cash_fund)
                    ? 'Full-payment gifts show a price, not a progress bar.'
                    : form.show_progress
                      ? 'Guests see the progress bar and how much has been raised.'
                      : 'The progress bar and amounts are hidden from guests.'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-sm">Cancel</button>
            <button className="btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : `Save ${itemWord}`}</button>
          </div>
        </form>
      )}

      {gifts.length === 0 ? (
        <div className="card p-10 text-center text-muted">No {itemWord}s yet. Add your first {itemWord} above.</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {gifts.map((g, i) => (
            <div key={g.id} className="card overflow-hidden flex flex-col">
              <div className="h-36 bg-soft bg-cover bg-center"
                   style={g.display_image ? { backgroundImage: `url(${g.display_image})` } : { background: 'linear-gradient(135deg, #f3d9c8, #e7b7c9)' }} />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate">{g.title}</h3>
                  <div className="flex gap-1.5 shrink-0">
                    {!g.show_progress && <span className="chip bg-soft text-muted" title="Funding progress is hidden from guests">Progress hidden</span>}
                    {!g.allow_partial && !g.is_cash_fund && <span className="chip bg-soft text-muted" title="Guests must fund the full amount">Full amount</span>}
                    <span className="chip">{g.category}</span>
                  </div>
                </div>
                <div className="progress mt-2"><i style={{ width: `${g.pct_funded}%` }} /></div>
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span><b className="text-rose-deep">{money(g.amount_raised, registry.currency)}</b> raised</span>
                  <span>of {money(g.target_amount, registry.currency)}</span>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <div className="flex items-center gap-1">
                    <button onClick={() => reorder(i, -1)} disabled={i === 0} title="Move up"
                            className="w-7 h-7 rounded-lg border border-line text-muted hover:border-rose hover:text-rose-deep disabled:opacity-30 disabled:cursor-not-allowed">↑</button>
                    <button onClick={() => reorder(i, 1)} disabled={i === gifts.length - 1} title="Move down"
                            className="w-7 h-7 rounded-lg border border-line text-muted hover:border-rose hover:text-rose-deep disabled:opacity-30 disabled:cursor-not-allowed">↓</button>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(g)} className="text-rose-deep font-semibold">Edit</button>
                    <button onClick={() => archive(g)} className="text-muted hover:text-error">Archive</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
