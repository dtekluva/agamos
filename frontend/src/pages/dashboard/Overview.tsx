import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { money, prettyDate } from '../../lib/format'
import { useRegistry } from '../../lib/registry'
import ShareBar from '../../components/ShareBar'
import type { Contribution } from '../../lib/types'

export default function Overview() {
  const { registry, loading } = useRegistry()
  const [recent, setRecent] = useState<Contribution[]>([])

  useEffect(() => {
    if (!registry) return
    api.get(`/contributions?registry=${registry.id}`)
      .then((r) => setRecent((r.data.results ?? r.data).filter((c: Contribution) => c.status === 'success')))
      .catch(() => {})
  }, [registry?.id])

  if (loading) return <p className="text-muted">Loading…</p>

  if (!registry) {
    return (
      <div className="card p-10 text-center">
        <div className="text-5xl mb-4">💍</div>
        <h2 className="text-2xl font-semibold mb-2">Let’s create your first event</h2>
        <p className="text-muted mb-6 max-w-sm mx-auto">
          It takes under a minute — pick your celebration, add the gifts or cash goals you have in
          mind, then share your page with friends and family.
        </p>
        <Link to="/dashboard/new" className="btn-primary">Create your event</Link>
        <p className="text-xs text-muted mt-3">Free to set up · no payment needed to start</p>
      </div>
    )
  }

  const cur = registry.currency
  const cards = [
    ['Raised', money(registry.total_raised, cur)],
    ['Available', money(registry.available_balance, cur)],
    ['Gifts', String(registry.gifts.length)],
    ['Contributions', String(recent.length)],
  ]

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">{registry.display_name}</h1>
          <p className="text-muted mt-1">
            <span className={`chip mr-2 ${registry.published ? '' : 'opacity-70'}`}>
              {registry.published ? 'Published' : 'Draft'}
            </span>
            {registry.event_date && <>· {prettyDate(registry.event_date)} </>}
            · /r/{registry.slug}
          </p>
        </div>
        <Link to="/dashboard/gifts" className="btn-primary btn-sm">+ Add a gift</Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(([l, v]) => (
          <div key={l} className="card p-5">
            <p className="text-sm text-muted">{l}</p>
            <p className="text-2xl font-display font-semibold mt-1">{v}</p>
          </div>
        ))}
      </div>

      {/* Share */}
      <div className="card p-6 mb-8 bg-gradient-to-br from-soft to-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold">Share your page</h3>
            <p className="text-sm text-muted mt-0.5">Send the link to friends &amp; family so they can give.</p>
          </div>
          <ShareBar slug={registry.slug} title={registry.display_name} />
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm rounded-xl border border-line bg-white px-3 py-2">
          <span className="text-muted truncate flex-1">{window.location.origin}/r/{registry.slug}</span>
          <a href={`/r/${registry.slug}`} target="_blank" rel="noreferrer" className="text-rose-deep font-semibold whitespace-nowrap">Open ↗</a>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Recent contributions</h3>
          {recent.length === 0 ? (
            <p className="text-muted text-sm">No contributions yet — share your page to start receiving gifts.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{c.display_name}</p>
                    <p className="text-muted">{c.gift_title}</p>
                  </div>
                  <span className="font-display font-semibold text-rose-deep">{money(c.amount, cur)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Quick actions</h3>
          <div className="space-y-3 text-sm">
            <Link to="/dashboard/registry" className="block rounded-xl border border-line px-4 py-3 hover:border-rose">💍 Edit your event page & details</Link>
            <Link to="/dashboard/gifts" className="block rounded-xl border border-line px-4 py-3 hover:border-rose">🎁 Manage gifts & goals</Link>
            <Link to="/dashboard/exhibition" className="block rounded-xl border border-line px-4 py-3 hover:border-rose">💌 Tell your story</Link>
            <Link to="/dashboard/withdrawals" className="block rounded-xl border border-line px-4 py-3 hover:border-rose">🏦 Withdraw your funds</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
