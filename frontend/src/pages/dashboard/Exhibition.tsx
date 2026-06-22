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
  const [imageFile, setImageFile] = useState<File | null>(null)
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
      if (imageFile) {
        // Multipart upload — send the chosen file as the `image` field.
        const fd = new FormData()
        fd.append('registry', String(registry.id))
        fd.append('title', moment.title)
        if (moment.date) fd.append('date', moment.date)
        if (moment.description) fd.append('description', moment.description)
        fd.append('image', imageFile)
        await api.post('/moments/', fd)
      } else {
        await api.post('/moments/', {
          registry: registry.id, ...moment,
          date: moment.date || null,
          image_url: normalizeUrl(moment.image_url),
        })
      }
      setMoment({ title: '', date: '', description: '', image_url: '' })
      setImageFile(null)
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
                <div className="flex items-center gap-3 min-w-0">
                  {m.display_image && (
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-soft bg-cover bg-center border border-line"
                         style={{ backgroundImage: `url(${m.display_image})` }} />
                  )}
                  <div className="min-w-0">
                    {m.date && <p className="text-rose-deep text-xs font-semibold">{prettyDate(m.date)}</p>}
                    <p className="font-medium truncate">{m.title}</p>
                    {m.description && <p className="text-sm text-muted line-clamp-1">{m.description}</p>}
                  </div>
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
          <div className="sm:col-span-2">
            <label className="label">Photo (optional)</label>
            {(imageFile || moment.image_url) && (
              <div className="h-28 rounded-xl bg-soft bg-cover bg-center mb-2 border border-line"
                   style={{ backgroundImage: `url(${imageFile ? URL.createObjectURL(imageFile) : moment.image_url})` }} />
            )}
            <label className="flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-3 text-sm cursor-pointer hover:border-rose">
              <span className="btn-ghost btn-sm">Upload image</span>
              <span className="text-muted truncate">{imageFile ? imageFile.name : 'JPG or PNG from your device'}</span>
              <input type="file" accept="image/*" className="hidden"
                     onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </label>
            <input className="input mt-2" placeholder="…or paste an image URL" value={moment.image_url}
                   onChange={(e) => setMoment({ ...moment, image_url: e.target.value })} disabled={!!imageFile} />
          </div>
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
