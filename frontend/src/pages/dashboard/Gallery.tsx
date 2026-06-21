import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { apiError, normalizeUrl } from '../../lib/errors'
import { useRegistry } from '../../lib/registry'
import { useToast } from '../../lib/toast'

export default function Gallery() {
  const { registry, reload, loading } = useRegistry()
  const toast = useToast()
  const [gallery, setGallery] = useState({ image_url: '', caption: '' })
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

  const add = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (file) {
        const fd = new FormData()
        fd.append('registry', String(registry.id))
        fd.append('image', file)
        if (gallery.caption) fd.append('caption', gallery.caption)
        await api.post('/gallery/', fd)
      } else {
        await api.post('/gallery/', {
          registry: registry.id,
          caption: gallery.caption,
          image_url: normalizeUrl(gallery.image_url),
        })
      }
      setGallery({ image_url: '', caption: '' })
      setFile(null)
      await reload()
      toast.success('Photo added to your gallery')
    } catch (e2) {
      setErr(apiError(e2, 'Could not add this photo.'))
    } finally { setBusy(false) }
  }
  const del = async (id: number) => { await api.delete(`/gallery/${id}/`); await reload(); toast.success('Photo removed') }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold">Photo gallery</h1>
        <p className="text-muted mt-1">
          Add photos for the gallery on your public page. Toggle whether it shows under{' '}
          <Link to="/dashboard/registry" className="text-rose-deep font-semibold">Event page</Link>.
        </p>
      </div>

      <section className="card p-6">
        {registry.gallery.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-5">
            {registry.gallery.map((g) => (
              <div key={g.id} className="relative aspect-square rounded-xl bg-soft bg-cover bg-center group"
                   style={g.display_image ? { backgroundImage: `url(${g.display_image})` } : {}}>
                <button onClick={() => del(g.id)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-error text-sm opacity-0 group-hover:opacity-100">×</button>
              </div>
            ))}
          </div>
        )}
        {registry.gallery.length === 0 && <p className="text-muted text-sm mb-4">No photos yet — add your first below.</p>}
        {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2 mb-3">{err}</div>}
        <form onSubmit={add} className="grid sm:grid-cols-2 gap-3">
          <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-3 text-sm cursor-pointer hover:border-rose">
            <span className="btn-ghost btn-sm">Upload a photo</span>
            <span className="text-muted truncate">{file ? file.name : 'JPG or PNG from your device'}</span>
            <input type="file" accept="image/*" className="hidden"
                   onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <input className="input sm:col-span-2" placeholder="…or paste an image URL" value={gallery.image_url}
                 onChange={(e) => setGallery({ ...gallery, image_url: e.target.value })} required={!file} disabled={!!file} />
          <input className="input sm:col-span-2" placeholder="Caption (optional)" value={gallery.caption}
                 onChange={(e) => setGallery({ ...gallery, caption: e.target.value })} />
          <div className="sm:col-span-2 flex justify-end">
            <button className="btn-primary btn-sm" disabled={busy}>{busy ? 'Adding…' : 'Add photo'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
