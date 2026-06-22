import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegistry } from '../lib/registry'
import { getEvent } from '../lib/eventTypes'

export default function EventSwitcher() {
  const { registries, registry, setActive } = useRegistry()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()

  if (!registry) return null
  const cfg = getEvent(registry.event_type)

  const choose = (id: number) => { setActive(id); setOpen(false); nav('/dashboard') }
  const createNew = () => { setOpen(false); nav('/dashboard/new') }

  return (
    <div className="relative min-w-0 flex-1">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Switch event"
        className="flex items-center gap-2 rounded-xl border border-line bg-white pl-3 pr-2 py-2 text-sm hover:border-rose hover:bg-soft/50 transition w-full max-w-[240px] min-w-0"
      >
        <span className="shrink-0">{cfg.emoji}</span>
        <span className="font-medium truncate min-w-0">{registry.display_name}</span>
        {registries.length > 1 && (
          <span className="text-[11px] font-bold text-rose-deep bg-soft rounded-full min-w-[18px] h-[18px] grid place-items-center px-1 shrink-0">{registries.length}</span>
        )}
        <svg className={`w-4 h-4 text-rose-deep shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
             viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-lift border border-line p-2 z-20">
            <p className="text-xs text-muted px-3 pt-1 pb-2">Your events</p>
            <div className="max-h-64 overflow-y-auto">
              {registries.map((r) => {
                const c = getEvent(r.event_type)
                const active = r.id === registry.id
                return (
                  <button key={r.id} onClick={() => choose(r.id)}
                    className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-left ${active ? 'bg-soft' : 'hover:bg-soft'}`}>
                    <span>{c.emoji}</span>
                    <span className="flex-1 truncate">{r.display_name}</span>
                    {active && <span className="text-rose-deep">✓</span>}
                  </button>
                )
              })}
            </div>
            <div className="border-t border-line mt-2 pt-2">
              <button onClick={createNew}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-deep font-semibold hover:bg-soft">
                <span className="text-base leading-none">＋</span> Create new event
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
