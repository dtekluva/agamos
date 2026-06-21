import { FormEvent, useState } from 'react'
import api from '../lib/api'
import { apiError } from '../lib/errors'

interface Props {
  registryId: number
  allowVideo: boolean
  onClose: () => void
  onSuccess: () => void
}

const MAX_IMAGE_MB = 10
const MAX_VIDEO_MB = 100

export default function GuestUploadModal({ registryId, allowVideo, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [isVideo, setIsVideo] = useState(false)
  const [name, setName] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const accept = allowVideo ? 'image/*,video/*' : 'image/*'

  const pick = (f: File | null) => {
    setErr('')
    if (!f) { setFile(null); setPreview(''); return }
    const video = f.type.startsWith('video/')
    if (video && !allowVideo) { setErr('Only photos can be shared on this event.'); return }
    const cap = video ? MAX_VIDEO_MB : MAX_IMAGE_MB
    if (f.size > cap * 1024 * 1024) {
      setErr(`${video ? 'Videos' : 'Photos'} must be ${cap} MB or smaller.`)
      return
    }
    setFile(f)
    setIsVideo(video)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) { setErr('Choose a photo or video first.'); return }
    setErr(''); setBusy(true)
    try {
      const fd = new FormData()
      fd.append('registry', String(registryId))
      fd.append('media', file)
      if (name) fd.append('uploader_name', name)
      if (caption) fd.append('caption', caption)
      await api.post('/guest-uploads/', fd)
      setDone(true)
    } catch (e2: any) {
      setErr(apiError(e2, 'Could not upload. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/55 backdrop-blur-sm"
         onClick={onClose}>
      <div className="card w-full max-w-md p-7 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close"
                className="absolute top-3 right-4 text-2xl text-muted hover:text-rose-deep">×</button>

        {done ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center text-white text-3xl bg-gradient-to-br from-gold-light to-rose">✓</div>
            <h2 className="text-2xl font-semibold mb-2">Thank you for sharing!</h2>
            <p className="text-muted mb-6">Your {isVideo ? 'video' : 'photo'} is now on the page for everyone to enjoy.</p>
            <button className="btn-primary w-full" onClick={onSuccess}>Done</button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-1">Share a memory</h2>
            <p className="text-muted text-sm mb-5">
              Add a {allowVideo ? 'photo or short video' : 'photo'} to this event’s wall for everyone to see.
            </p>
            <form onSubmit={submit} className="space-y-4">
              {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">{err}</div>}

              <label className="block rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm cursor-pointer hover:border-rose">
                {preview ? (
                  isVideo
                    ? <video src={preview} className="mx-auto max-h-44 rounded-lg" controls />
                    : <img src={preview} alt="" className="mx-auto max-h-44 rounded-lg object-contain" />
                ) : (
                  <span className="text-muted">
                    <span className="block text-2xl mb-1">📸</span>
                    Tap to choose a {allowVideo ? 'photo or video' : 'photo'} from your device
                  </span>
                )}
                <input type="file" accept={accept} className="hidden"
                       onChange={(e) => pick(e.target.files?.[0] || null)} />
              </label>
              {file && <p className="text-xs text-muted -mt-2 truncate">{file.name}</p>}

              <div>
                <label className="label">Your name (optional)</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aunty Ngozi" />
              </div>
              <div>
                <label className="label">Caption (optional)</label>
                <input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} placeholder="Say something nice…" />
              </div>

              <button className="btn-primary w-full" disabled={busy || !file}>
                {busy ? 'Uploading…' : 'Share it'}
              </button>
              <p className="text-xs text-muted text-center">
                Photos up to {MAX_IMAGE_MB}MB{allowVideo ? `, videos up to ${MAX_VIDEO_MB}MB` : ''}.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
