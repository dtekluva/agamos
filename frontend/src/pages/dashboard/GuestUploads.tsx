import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { apiError } from '../../lib/errors'
import { useRegistry } from '../../lib/registry'
import { useToast } from '../../lib/toast'

export default function GuestUploads() {
  const { registry, reload, update, loading } = useRegistry()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  if (loading) return <p className="text-muted">Loading…</p>
  if (!registry) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-2xl font-semibold mb-2">Create your event first</h2>
        <Link to="/dashboard/registry" className="btn-primary mt-2">Create event</Link>
      </div>
    )
  }

  const uploads = registry.guest_uploads || []

  const setFlag = async (key: 'show_guest_uploads' | 'guest_uploads_allow_video', value: boolean) => {
    setBusy(true)
    try {
      await update({ [key]: value })
      toast.success('Saved')
    } catch (e) {
      toast.error(apiError(e, 'Could not save that setting.'))
    } finally { setBusy(false) }
  }

  const del = async (id: number) => {
    try {
      await api.delete(`/guest-uploads/${id}/`)
      await reload()
      toast.success('Upload removed')
    } catch (e) {
      toast.error(apiError(e, 'Could not remove this upload.'))
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold">Guest uploads</h1>
        <p className="text-muted mt-1">
          Photos and videos your guests post on your public page appear here instantly.
          Remove anything you don’t want shown.
        </p>
      </div>

      <section className="card p-6 space-y-3">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            <b className="text-ink">Guest photo & video wall</b>
            <span className="block text-muted">Let visitors add their own media to your page.</span>
          </span>
          <input type="checkbox" checked={registry.show_guest_uploads} disabled={busy}
                 onChange={(e) => setFlag('show_guest_uploads', e.target.checked)} />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm border-t border-soft pt-3">
          <span>
            <b className="text-ink">Allow videos</b>
            <span className="block text-muted">Turn off to accept photos only.</span>
          </span>
          <input type="checkbox" checked={registry.guest_uploads_allow_video}
                 disabled={busy || !registry.show_guest_uploads}
                 onChange={(e) => setFlag('guest_uploads_allow_video', e.target.checked)} />
        </label>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{uploads.length} {uploads.length === 1 ? 'upload' : 'uploads'}</h2>
          {registry.published && (
            <a href={`/r/${registry.slug}`} target="_blank" rel="noreferrer"
               className="text-rose-deep text-sm font-semibold">View page ↗</a>
          )}
        </div>

        {uploads.length === 0 ? (
          <p className="text-muted text-sm">No guest uploads yet. Once your page is published and shared, anything guests post will show here.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {uploads.map((u) => (
              <div key={u.id} className="relative aspect-square rounded-xl overflow-hidden bg-soft group">
                {u.media_type === 'video' ? (
                  <>
                    <video src={u.display_media} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    <span className="absolute top-1 left-1 text-xs bg-black/55 text-white rounded px-1.5 py-0.5">▶ video</span>
                  </>
                ) : (
                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${u.display_media})` }} />
                )}
                <button onClick={() => del(u.id)} title="Remove"
                        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 text-error opacity-0 group-hover:opacity-100 transition">×</button>
                {(u.caption || u.uploader_name) && (
                  <span className="absolute bottom-0 inset-x-0 px-2 py-1 text-left text-[11px] text-white bg-gradient-to-t from-black/60 to-transparent truncate">
                    {u.uploader_name || u.caption}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
