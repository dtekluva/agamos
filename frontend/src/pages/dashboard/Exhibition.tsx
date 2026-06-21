import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { prettyDate } from '../../lib/format'
import { apiError, normalizeUrl } from '../../lib/errors'
import { useRegistry } from '../../lib/registry'
import { useToast } from '../../lib/toast'
import { getEvent } from '../../lib/eventTypes'

export default function Exhibition() {
  const { registry, reload, loading } = useRegistry()
  const toast = useToast()
  const [moment, setMoment] = useState({ title: '', date: '', description: '', image_url: '' })
  const [busy, setBusy] = useState(false)
  const [momentErr, setMomentErr] = useState('')

  if (loading) return <p className="text-muted">Loading…</p>
  if (!registry) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-2xl font-semibold mb-2">Create your event first</h2>
        <Link to="/dashboard/registry" className="btn-primary mt-2">Create event</Link>
      </div>
    )
  }

  const cfg = getEvent(registry.event_type)

  const addMoment = async (e: FormEvent) => {
    e.preventDefault(); setMomentErr(''); setBusy(true)
    try {
      await api.post('/moments/', {
        registry: registry.id, ...moment,
        date: moment.date || null,
        image_url: normalizeUrl(moment.image_url),
      })
      setMoment({ title: '', date: '', description: '', image_url: '' })
      await reload()
      toast.success('Moment added to your story')
    } catch (err) {
      setMomentErr(apiError(err, 'Could not add this moment.'))
    } finally { setBusy(false) }
  }
  const delMoment = async (id: number) => { await api.delete(`/moments/${id}/`); await reload(); toast.success('Moment removed') }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold">{cfg.storyToggleLabel}</h1>
        <p className="text-muted mt-1">
          Build the “{cfg.timelineToggleLabel.toLowerCase()}” timeline guests see on your public page.
          Edit your written story &amp; what shows under <Link to="/dashboard/registry" className="text-rose-deep font-semibold">Event page</Link>;
          manage photos under <Link to="/dashboard/gallery" className="text-rose-deep font-semibold">Gallery</Link>.
        </p>
      </div>

      <section className="card p-6">
        <h3 className="font-semibold mb-4">{cfg.timelineToggleLabel} — timeline</h3>
        {registry.moments.length > 0 && (
          <ul className="space-y-3 mb-5">
            {registry.moments.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                <div>
                  {m.date && <p className="text-rose-deep text-xs font-semibold">{prettyDate(m.date)}</p>}
                  <p className="font-medium">{m.title}</p>
                  {m.description && <p className="text-sm text-muted line-clamp-1">{m.description}</p>}
                </div>
                <button onClick={() => delMoment(m.id)} className="text-muted hover:text-error text-sm">Remove</button>
              </li>
            ))}
          </ul>
        )}
        {momentErr && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2 mb-3">{momentErr}</div>}
        <form onSubmit={addMoment} className="grid sm:grid-cols-2 gap-3">
          <input className="input" placeholder="Title (e.g. A special moment)" value={moment.title}
                 onChange={(e) => setMoment({ ...moment, title: e.target.value })} required />
          <input className="input" type="date" value={moment.date}
                 onChange={(e) => setMoment({ ...moment, date: e.target.value })} />
          <input className="input sm:col-span-2" placeholder="Image URL (optional)" value={moment.image_url}
                 onChange={(e) => setMoment({ ...moment, image_url: e.target.value })} />
          <textarea className="input sm:col-span-2 min-h-[60px]" placeholder="What happened?" value={moment.description}
                    onChange={(e) => setMoment({ ...moment, description: e.target.value })} />
          <div className="sm:col-span-2 flex justify-end">
            <button className="btn-primary btn-sm" disabled={busy}>Add moment</button>
          </div>
        </form>
      </section>
    </div>
  )
}
