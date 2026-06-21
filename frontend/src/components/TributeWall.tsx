import { CSSProperties, FormEvent, useState } from 'react'
import api from '../lib/api'
import { prettyDate } from '../lib/format'
import { apiError } from '../lib/errors'
import { useToast } from '../lib/toast'
import type { Tribute } from '../lib/types'

interface Props {
  registryId: number
  tributes: Tribute[]
  accent: CSSProperties
  cardStyle: CSSProperties
  onPosted: () => void
}

export default function TributeWall({ registryId, tributes, accent, cardStyle, onPosted }: Props) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      await api.post('/tributes/', { registry: registryId, name, message })
      setName(''); setMessage(''); setOpen(false)
      toast.success('Your tribute has been shared 🕊️')
      onPosted()
    } catch (e2) {
      setErr(apiError(e2, 'Could not post your tribute.'))
    } finally { setBusy(false) }
  }

  return (
    <section id="tributes" className="py-12">
      <div className="text-center mb-8">
        <span className="eyebrow mb-3" style={accent}>Tributes</span>
        <h2 className="text-3xl font-semibold mb-4">Words of remembrance</h2>
        {!open && <button onClick={() => setOpen(true)} className="btn-ghost btn-sm">Leave a tribute</button>}
      </div>

      {open && (
        <form onSubmit={submit} className="card p-6 mb-8 max-w-xl mx-auto space-y-3" style={cardStyle}>
          {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">{err}</div>}
          <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          <textarea className="input min-h-[110px]" placeholder="Share a memory or a message of comfort for the family…"
                    value={message} onChange={(e) => setMessage(e.target.value)} required />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">Cancel</button>
            <button className="btn-primary btn-sm" disabled={busy}>{busy ? 'Posting…' : 'Share tribute'}</button>
          </div>
        </form>
      )}

      {tributes.length === 0 ? (
        <p className="text-center text-muted">Be the first to leave a tribute.</p>
      ) : (
        <div className="space-y-4 max-w-2xl mx-auto">
          {tributes.map((tr) => (
            <div key={tr.id} className="card p-5" style={cardStyle}>
              <p className="text-ink leading-relaxed whitespace-pre-line">“{tr.message}”</p>
              <p className="text-sm mt-3 font-semibold" style={accent}>— {tr.name}</p>
              <p className="text-xs text-muted mt-0.5">{prettyDate(tr.created_at?.slice(0, 10))}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
