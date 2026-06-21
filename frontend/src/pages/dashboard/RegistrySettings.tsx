import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegistry } from '../../lib/registry'
import api from '../../lib/api'
import { apiError, normalizeUrl } from '../../lib/errors'
import { useToast } from '../../lib/toast'
import { getEvent } from '../../lib/eventTypes'
import { THEME_LIST } from '../../lib/themes'
import BankFields from '../../components/BankFields'
import EventTypePicker from '../../components/EventTypePicker'

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'KES', 'GHS']

const EMPTY = {
  event_type: '', partner_one_name: '', partner_two_name: '', organiser_name: '',
  event_date: '', years_celebrated: '', turning_age: '', venue: '', city: '',
  hero_message: '', our_story: '', cover_image_url: '', currency: 'NGN', theme: 'blush',
  show_story: true, show_timeline: true, show_gallery: true, show_event_details: true,
  show_registry: true, show_tributes: true, show_guest_uploads: true,
  guest_uploads_allow_video: true, published: false,
  bank_name: '', bank_code: '', account_number: '', account_name: '',
}

export default function RegistrySettings({ forceNew = false }: { forceNew?: boolean }) {
  const { registry, create, update, remove, reload, loading } = useRegistry()
  const toast = useToast()
  const nav = useNavigate()
  const [form, setForm] = useState<any>(EMPTY)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isNew = forceNew || !registry

  const handleDelete = async () => {
    if (!registry) return
    setDeleting(true)
    try {
      await remove(registry.id)
      toast.success('Event deleted')
      nav('/dashboard')
    } catch (e: any) {
      setErr(apiError(e, 'Could not delete this event.'))
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (forceNew) setForm(EMPTY)
    else if (registry) setForm({ ...EMPTY, ...registry, event_date: registry.event_date || '' })
  }, [registry?.id, forceNew])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const pickType = (key: string) => {
    const cfg = getEvent(key)
    setForm((f: any) => ({ ...f, event_type: key, theme: cfg.defaultTheme }))
  }

  if (loading) return <p className="text-muted">Loading…</p>

  // New registry with no type yet → show the picker first.
  if (isNew && !form.event_type) return <EventTypePicker onPick={pickType} />

  const cfg = getEvent(form.event_type)
  const isMemorial = cfg.surface === 'memorial'
  const nameTwoRequired = !!cfg.nameTwoLabel && !/optional/i.test(cfg.nameTwoLabel)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(''); setSaving(true)
    const { cover_image, ...rest } = form
    const payload = {
      ...rest,
      event_date: form.event_date || null,
      years_celebrated: form.years_celebrated || null,
      turning_age: form.turning_age || null,
      currency: form.currency || 'NGN',
      cover_image_url: normalizeUrl(form.cover_image_url),
    }
    try {
      const saved = isNew ? await create(payload) : await update(payload)
      // Upload the cover file (if chosen) to the now-saved event, then refresh.
      if (coverFile && saved?.id) {
        const fd = new FormData()
        fd.append('cover_image', coverFile)
        await api.patch(`/registries/${saved.id}/`, fd)
        await reload()
        setCoverFile(null)
      }
      toast.success(isNew ? `Your ${cfg.label.toLowerCase()} page is live! 🎉` : 'Event page saved')
      if (forceNew) nav('/dashboard/registry')
    } catch (e2: any) {
      setErr(apiError(e2, 'Could not save. Check your details and try again.'))
    } finally {
      setSaving(false)
    }
  }

  const toggles: [string, string][] = [
    ['show_story', cfg.storyToggleLabel],
    ['show_timeline', cfg.timelineToggleLabel],
    ['show_gallery', 'Photo gallery'],
    ['show_event_details', 'Event details'],
    ['show_registry', cfg.registryToggleLabel],
    ['show_guest_uploads', 'Guest photo & video wall'],
    ...(isMemorial ? ([['show_tributes', 'Tribute wall']] as [string, string][]) : []),
  ]

  return (
    <form onSubmit={submit} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{isNew ? `Create your ${cfg.label.toLowerCase()}` : 'Event page'}</h1>
          {!isNew && <p className="text-muted mt-1 flex items-center gap-2"><span className="chip">{cfg.emoji} {cfg.label}</span> /r/{registry!.slug}</p>}
        </div>
        {!isNew && (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
            Published
          </label>
        )}
      </div>

      {err && <div className="rounded-lg bg-error/10 text-error text-sm px-3 py-2">{err}</div>}

      {/* Details */}
      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{cfg.label} details</h3>
          {isNew && (
            <button type="button" onClick={() => set('event_type', '')} className="text-rose-deep text-sm font-semibold">Change type</button>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className={cfg.nameTwoLabel ? '' : 'sm:col-span-2'}>
            <label className="label">{cfg.nameOneLabel}</label>
            <input className="input" value={form.partner_one_name} onChange={(e) => set('partner_one_name', e.target.value)} required />
          </div>
          {cfg.nameTwoLabel && (
            <div>
              <label className="label">{cfg.nameTwoLabel}</label>
              <input className="input" value={form.partner_two_name} onChange={(e) => set('partner_two_name', e.target.value)} required={nameTwoRequired} />
            </div>
          )}
          {cfg.organiserLabel && (
            <div className="sm:col-span-2">
              <label className="label">{cfg.organiserLabel}</label>
              <input className="input" value={form.organiser_name} onChange={(e) => set('organiser_name', e.target.value)} />
            </div>
          )}
          <div><label className="label">{cfg.dateLabel}</label><input type="date" className="input" value={form.event_date || ''} onChange={(e) => set('event_date', e.target.value)} /></div>
          {cfg.extraField === 'years_celebrated' && (
            <div><label className="label">Years together</label><input type="number" min="1" className="input" value={form.years_celebrated} onChange={(e) => set('years_celebrated', e.target.value)} /></div>
          )}
          {cfg.extraField === 'turning_age' && (
            <div><label className="label">Turning age</label><input type="number" min="1" className="input" value={form.turning_age} onChange={(e) => set('turning_age', e.target.value)} /></div>
          )}
          <div><label className="label">City</label><input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Venue</label><input className="input" value={form.venue} onChange={(e) => set('venue', e.target.value)} /></div>
        </div>
      </section>

      {/* Public page */}
      <section className="card p-6 space-y-4">
        <h3 className="font-semibold">Your public page</h3>
        <div>
          <label className="label">Cover image</label>
          {(coverFile || form.cover_image_url || registry?.cover) && (
            <div className="h-32 rounded-xl bg-soft bg-cover bg-center mb-2 border border-line"
                 style={{ backgroundImage: `url(${coverFile ? URL.createObjectURL(coverFile) : (form.cover_image_url || registry?.cover)})` }} />
          )}
          <label className="flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-3 text-sm cursor-pointer hover:border-rose">
            <span className="btn-ghost btn-sm">Upload image</span>
            <span className="text-muted truncate">{coverFile ? coverFile.name : 'JPG or PNG from your device'}</span>
            <input type="file" accept="image/*" className="hidden"
                   onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
          </label>
          <input className="input mt-2" placeholder="…or paste an image URL" value={form.cover_image_url}
                 onChange={(e) => set('cover_image_url', e.target.value)} disabled={!!coverFile} />
        </div>
        <div><label className="label">Headline message</label><input className="input" placeholder={cfg.heroKicker(form)} value={form.hero_message} onChange={(e) => set('hero_message', e.target.value)} /></div>
        <div><label className="label">{cfg.storyToggleLabel}</label><textarea className="input min-h-[120px]" value={form.our_story} onChange={(e) => set('our_story', e.target.value)} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Currency</label><select className="input" value={form.currency} onChange={(e) => set('currency', e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label">Theme</label><select className="input" value={form.theme} onChange={(e) => set('theme', e.target.value)}>{THEME_LIST.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
        </div>
        <div>
          <label className="label">Show on your public page</label>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            {toggles.map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} /> {l}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Payout */}
      <section className="card p-6 space-y-4">
        <h3 className="font-semibold">Payout bank details</h3>
        <p className="text-sm text-muted">Where we send the funds you withdraw. We verify the account with your bank.</p>
        <BankFields
          value={{ bank_name: form.bank_name, bank_code: form.bank_code, account_number: form.account_number, account_name: form.account_name }}
          onChange={(v) => setForm((f: any) => ({ ...f, ...v }))}
        />
      </section>

      <div className="flex justify-end">
        <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : isNew ? `Create my ${cfg.label.toLowerCase()}` : 'Save changes'}</button>
      </div>

      {!isNew && (
        <section className="card p-6 border border-error/20">
          <h3 className="font-semibold text-error">Danger zone</h3>
          <p className="text-sm text-muted mt-1 mb-4">Deleting this event permanently removes its page, gifts, contributions and tributes. This can’t be undone.</p>
          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)}
              className="rounded-full border border-error text-error px-4 py-2 text-sm font-semibold hover:bg-error hover:text-white transition">
              Delete this event
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium">Are you sure?</span>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="rounded-full bg-error text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost btn-sm">Cancel</button>
            </div>
          )}
        </section>
      )}
    </form>
  )
}
