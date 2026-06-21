import { EVENT_LIST } from '../lib/eventTypes'

export default function EventTypePicker({ onPick }: { onPick: (key: string) => void }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold mb-1">What are you celebrating?</h1>
      <p className="text-muted mb-7">Pick the kind of event — you can fine-tune everything afterwards.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {EVENT_LIST.map((ev) => (
          <button
            key={ev.key}
            type="button"
            onClick={() => onPick(ev.key)}
            className="card p-6 text-left transition border border-transparent hover:-translate-y-0.5 hover:shadow-lift hover:border-rose/30 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-12 h-12 rounded-2xl bg-soft grid place-items-center text-2xl shrink-0">{ev.emoji}</span>
              <h3 className="text-xl font-semibold group-hover:text-rose-deep">{ev.label}</h3>
              <span className="ml-auto text-rose-deep opacity-0 group-hover:opacity-100 transition">→</span>
            </div>
            <p className="text-sm text-muted">{ev.blurb}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
