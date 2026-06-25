import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'
import { apiError } from '../lib/errors'
import { usePageTitle } from '../lib/usePageTitle'

type Guest = {
  id: number; name: string; party_size: number; rsvp_status: string
  code: string; checked_in_at: string | null
}
type Result =
  | { kind: 'resolved'; guest: Guest }
  | { kind: 'success' | 'already'; guest: Guest }
  | { kind: 'error'; msg: string }

export default function CheckIn() {
  usePageTitle('Door check-in — Agamos')
  const { doorToken } = useParams()
  const [info, setInfo] = useState<{ event: string; stats: { total: number; attending: number; checked_in: number } } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [result, setResult] = useState<Result | null>(null)
  const [code, setCode] = useState('')
  const [q, setQ] = useState('')
  const [matches, setMatches] = useState<Guest[]>([])
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const canScan = typeof window !== 'undefined' && 'BarcodeDetector' in window

  useEffect(() => {
    api.get(`/checkin/${doorToken}`).then((r) => { setInfo(r.data); setStatus('ok') }).catch(() => setStatus('error'))
    return () => stopScan()
  }, [doorToken])

  const resolveValue = async (value: string) => {
    setBusy(true); setResult(null); setMatches([]); setQ(''); setCode('')
    try {
      const r = await api.post(`/checkin/${doorToken}/resolve`, { value })
      setResult({ kind: 'resolved', guest: r.data })
    } catch (e: any) {
      setResult({ kind: 'error', msg: e?.response?.status === 404 ? 'Not on the guest list ✗' : apiError(e, 'Lookup failed') })
    } finally { setBusy(false) }
  }

  const doCheckin = async (g: Guest) => {
    setBusy(true)
    try {
      const r = await api.post(`/checkin/${doorToken}/checkin`, { guest_id: g.id })
      setInfo((i) => i ? { ...i, stats: r.data.stats } : i)
      setResult({ kind: r.data.already ? 'already' : 'success', guest: r.data })
    } catch (e: any) {
      setResult({ kind: 'error', msg: apiError(e, 'Check-in failed') })
    } finally { setBusy(false) }
  }

  const search = async (val: string) => {
    setQ(val); setResult(null)
    if (val.trim().length < 2) { setMatches([]); return }
    try { const r = await api.post(`/checkin/${doorToken}/search`, { q: val }); setMatches(r.data) } catch { /* ignore */ }
  }

  const stopScan = () => {
    setScanning(false)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const startScan = async () => {
    setResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setScanning(true)
      setTimeout(async () => {
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}) }
        const Detector = (window as any).BarcodeDetector
        const det = new Detector({ formats: ['qr_code'] })
        const tick = async () => {
          if (!streamRef.current || !videoRef.current) return
          try {
            const codes = await det.detect(videoRef.current)
            if (codes && codes.length) { const v = codes[0].rawValue; stopScan(); resolveValue(v); return }
          } catch { /* keep trying */ }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }, 120)
    } catch {
      setResult({ kind: 'error', msg: 'Camera unavailable — enter the code or search by name.' })
    }
  }

  if (status === 'loading') return <div className="min-h-screen grid place-items-center text-muted">Loading…</div>
  if (status === 'error' || !info) {
    return (
      <div className="min-h-screen grid place-items-center text-center px-6">
        <div>
          <h1 className="text-2xl font-display font-semibold mb-2">Invalid check-in link</h1>
          <p className="text-muted">Ask the host for an up-to-date door link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="text-center mb-5">
          <p className="uppercase tracking-[0.2em] text-xs text-white/60">Door check-in</p>
          <h1 className="font-display text-2xl font-semibold">{info.event}</h1>
          <p className="text-white/70 text-sm mt-1">
            <b className="text-white">{info.stats.checked_in}</b> checked in · {info.stats.attending} attending
          </p>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-2xl p-5 mb-5 text-center ${
            result.kind === 'success' ? 'bg-success' :
            result.kind === 'already' ? 'bg-warning' :
            result.kind === 'error' ? 'bg-error' : 'bg-white text-ink'}`}>
            {result.kind === 'error' ? (
              <p className="font-semibold text-white">{result.msg}</p>
            ) : (
              <>
                <p className={`text-3xl font-bold ${result.kind === 'resolved' ? 'text-ink' : 'text-white'}`}>
                  {result.kind === 'success' ? '✓ Welcome!' : result.kind === 'already' ? 'Already checked in' : result.guest.name}
                </p>
                <p className={`mt-1 ${result.kind === 'resolved' ? 'text-muted' : 'text-white/90'}`}>
                  {result.guest.name} · party of {result.guest.party_size}
                  {result.guest.rsvp_status !== 'yes' && ' · (no RSVP)'}
                </p>
                {result.kind === 'already' && result.guest.checked_in_at && (
                  <p className="text-white/80 text-sm mt-1">at {new Date(result.guest.checked_in_at).toLocaleTimeString()}</p>
                )}
                {result.kind === 'resolved' ? (
                  <button onClick={() => doCheckin(result.guest)} disabled={busy}
                    className="mt-4 w-full rounded-full bg-berry text-white font-semibold py-3">
                    {busy ? '…' : `Check in ${result.guest.name.split(' ')[0]}`}
                  </button>
                ) : (
                  <button onClick={() => setResult(null)} className="mt-4 w-full rounded-full bg-white/20 text-white font-semibold py-2.5">
                    Next guest
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {!result && (
          <>
            {/* Camera scan */}
            {scanning ? (
              <div className="mb-5">
                <video ref={videoRef} muted playsInline className="w-full rounded-2xl bg-black aspect-square object-cover" />
                <button onClick={stopScan} className="mt-3 w-full rounded-full bg-white/15 text-white font-semibold py-2.5">Stop camera</button>
              </div>
            ) : canScan ? (
              <button onClick={startScan} className="w-full rounded-2xl bg-rose text-white font-semibold py-5 text-lg mb-4">
                📷 Scan guest QR
              </button>
            ) : null}

            {/* Manual code */}
            <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) resolveValue(code.trim()) }} className="mb-4">
              <label className="text-xs text-white/60">Enter entry code</label>
              <div className="flex gap-2 mt-1">
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. WEY9N5"
                  className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 uppercase tracking-widest outline-none focus:border-rose" />
                <button className="rounded-xl bg-rose px-5 font-semibold" disabled={busy || !code.trim()}>Go</button>
              </div>
            </form>

            {/* Name search */}
            <div>
              <label className="text-xs text-white/60">Or search by name</label>
              <input value={q} onChange={(e) => search(e.target.value)} placeholder="Start typing a name…"
                className="w-full mt-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-rose" />
              {matches.length > 0 && (
                <div className="mt-2 rounded-xl bg-white/5 divide-y divide-white/10 overflow-hidden">
                  {matches.map((g) => (
                    <button key={g.id} onClick={() => setResult({ kind: 'resolved', guest: g })}
                      className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center justify-between">
                      <span>{g.name} <span className="text-white/50 text-sm">· {g.party_size}</span></span>
                      {g.checked_in_at && <span className="text-success text-sm">✓ in</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
