import { useEffect, useState, CSSProperties } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import { money, prettyDate, wrapWords } from '../lib/format'
import { getEvent } from '../lib/eventTypes'
import { getTheme } from '../lib/themes'
import type { Registry, Gift } from '../lib/types'
import ContributeModal from '../components/ContributeModal'
import TributeWall from '../components/TributeWall'
import ShareBar from '../components/ShareBar'
import GuestUploadModal from '../components/GuestUploadModal'
import type { GuestUpload } from '../lib/types'

// Collapsed grids show 2 rows (3-col desktop layout = 6 tiles) before "View more".
const COLLAPSED_TILES = 6

function ViewMoreButton({ open, hidden, onClick, accent }: {
  open: boolean; hidden: number; onClick: () => void; accent: CSSProperties
}) {
  return (
    <div className="text-center mt-6">
      <button onClick={onClick}
              className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full border border-line px-5 py-2 hover:bg-soft transition"
              style={accent}>
        {open ? 'View less' : `View ${hidden} more`}
        <span aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
    </div>
  )
}

export default function PublicRegistry() {
  const { slug } = useParams()
  const [reg, setReg] = useState<Registry | null>(null)
  const [err, setErr] = useState(false)
  const [giftToFund, setGiftToFund] = useState<Gift | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [lightbox, setLightbox] = useState<GuestUpload | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)

  const load = () => api.get(`/r/${slug}`).then((r) => setReg(r.data)).catch(() => setErr(true))
  useEffect(() => { load() }, [slug])

  if (err) {
    return (
      <div className="min-h-screen grid place-items-center text-center px-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Event not found</h1>
          <p className="text-muted mb-6">This event page doesn’t exist or was removed.</p>
          <Link to="/" className="btn-primary">Go to Agamos</Link>
        </div>
      </div>
    )
  }
  if (!reg) return <div className="min-h-screen grid place-items-center text-muted">Loading…</div>

  const cur = reg.currency
  const cfg = getEvent(reg.event_type)
  const t = getTheme(reg.theme)
  const isMemorial = reg.is_memorial

  const accent: CSSProperties = { color: t.accent }
  const cardStyle: CSSProperties = {
    background: t.cardBg, borderRadius: t.cardRadius,
    ...(t.cardBorder ? { border: `1px solid ${t.cardBorder}` } : {}),
  }
  // For image divs: radius/border only — never the `background` shorthand, which would
  // reset the `bg-cover bg-center` classes and break image fitting.
  const imgStyle: CSSProperties = {
    borderRadius: t.cardRadius,
    ...(t.cardBorder ? { border: `1px solid ${t.cardBorder}` } : {}),
  }
  const barStyle = (pct: number): CSSProperties => ({ width: `${pct}%`, background: `linear-gradient(90deg, ${t.barA}, ${t.barB})` })
  const ctaStyle = {
    background: `linear-gradient(135deg, ${t.ctaA}, ${t.ctaB})`,
    ['--cta-shadow' as any]: t.ctaShadow,
    ['--cta-glow' as any]: t.ctaGlow,
  } as CSSProperties
  const heroBg: CSSProperties = reg.cover
    ? { backgroundImage: `linear-gradient(rgba(18,16,20,.45),rgba(18,16,20,.6)), url(${reg.cover})` }
    : { backgroundImage: `linear-gradient(135deg, ${t.heroA}, ${t.heroB})` }

  const organiserLine = reg.organiser_name
    ? (isMemorial ? `Organised by ${reg.organiser_name}` : `Hosted by ${reg.organiser_name}`)
    : null

  return (
    <div className="min-h-screen" style={{ background: t.pageBg }}>
      {!reg.published && (
        <div className="bg-warning/15 text-ink text-sm text-center py-2.5 px-4">
          <b>Draft preview</b> — only you can see this. <Link to="/dashboard/registry" className="font-semibold underline">Publish it</Link> to share with guests.
        </div>
      )}
      {/* Hero */}
      <section className="relative">
        <div className="h-[60vh] min-h-[440px] bg-cover bg-center" style={heroBg}>
          <div className="h-full max-w-4xl mx-auto px-6 flex flex-col items-center justify-center text-center text-white">
            <p className="uppercase tracking-[0.25em] text-sm mb-4" style={{ color: t.heroEyebrow }}>{cfg.heroKicker(reg)}</p>
            <h1 className="font-display text-5xl sm:text-6xl font-semibold mb-4">{reg.display_name}</h1>
            {reg.hero_message && <p className="text-lg text-white/90 max-w-xl mb-3">{reg.hero_message}</p>}
            <div className="flex flex-col items-center gap-2.5 mt-4">
              {reg.event_date && (
                <span className="hero-badge">
                  <span className="hero-badge__icon" aria-hidden>📅</span>
                  {prettyDate(reg.event_date)}
                </span>
              )}
              {reg.city && (
                <span className="hero-badge">
                  <span className="hero-badge__icon" aria-hidden>📍</span>
                  {reg.city}
                </span>
              )}
              {organiserLine && (
                <span className="hero-badge hero-badge--royal" style={{ ['--royal' as any]: t.heroEyebrow }}>
                  <span className="hero-badge__icon" aria-hidden>👑</span>
                  {organiserLine}
                </span>
              )}
            </div>
            {reg.show_registry && reg.gifts.length > 0 && (
              <a href="#registry" className="btn-hero-cta mt-9" style={ctaStyle}>
                {isMemorial ? 'Support the family' : 'See our wish list'} <span aria-hidden>↓</span>
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6">
        {/* Story */}
        {reg.show_story && reg.our_story && (
          <section className="py-16 text-center max-w-2xl mx-auto">
            <span className="eyebrow mb-3" style={accent}>{cfg.storyToggleLabel}</span>
            <h2 className="text-3xl font-semibold mb-5">{cfg.storyHeading}</h2>
            <p className="text-lg text-muted leading-relaxed whitespace-pre-line">{reg.our_story}</p>
          </section>
        )}

        {/* Timeline */}
        {reg.show_timeline && reg.moments.length > 0 && (
          <section className="py-12">
            <div className="text-center mb-10">
              <span className="eyebrow mb-3" style={accent}>{cfg.timelineEyebrow}</span>
              <h2 className="text-3xl font-semibold">{cfg.timelineHeading}</h2>
            </div>
            <div className="space-y-8">
              {reg.moments.map((m, i) => (
                <div key={m.id} className="sm:grid sm:grid-cols-2 sm:gap-8 items-center">
                  <div className={`${i % 2 ? 'sm:order-2' : ''}`}>
                    {m.display_image && (
                      <div className="h-96 bg-soft bg-cover bg-center shadow-card" style={{ ...imgStyle, backgroundImage: `url(${m.display_image})` }} />
                    )}
                  </div>
                  <div className={`mt-3 sm:mt-0 ${i % 2 ? 'sm:order-1 sm:text-right' : ''}`}>
                    {m.date && <p className="text-sm font-semibold" style={accent}>{prettyDate(m.date)}</p>}
                    <h3 className="text-xl font-semibold mt-1">{m.title}</h3>
                    {m.description && <p className="text-muted mt-1">{m.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {reg.show_gallery && reg.gallery.length > 0 && (
          <section className="py-12">
            <div className="text-center mb-8">
              <span className="eyebrow mb-3" style={accent}>Gallery</span>
              <h2 className="text-3xl font-semibold">{cfg.galleryHeading}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(galleryOpen ? reg.gallery : reg.gallery.slice(0, COLLAPSED_TILES)).map((g) => (
                <div key={g.id} className="aspect-square bg-soft bg-cover bg-center"
                     style={{ ...imgStyle, ...(g.display_image ? { backgroundImage: `url(${g.display_image})` } : {}) }}
                     title={g.caption} />
              ))}
            </div>
            {reg.gallery.length > COLLAPSED_TILES && (
              <ViewMoreButton open={galleryOpen} hidden={reg.gallery.length - COLLAPSED_TILES}
                              onClick={() => setGalleryOpen((v) => !v)} accent={accent} />
            )}
          </section>
        )}

        {/* Event details */}
        {reg.show_event_details && (reg.venue || reg.city || reg.event_date) && (
          <section className="py-12">
            <div className="card p-8 text-center" style={cardStyle}>
              <span className="eyebrow mb-3" style={accent}>{isMemorial ? 'Details' : 'The big day'}</span>
              <h2 className="text-3xl font-semibold mb-4">{isMemorial ? 'Service details' : 'Event details'}</h2>
              <div className="flex flex-wrap justify-center gap-8 text-muted">
                {reg.event_date && <div className="max-w-[16rem]"><p className="text-sm mb-1">{isMemorial ? 'Service' : 'Save the date'}</p><p className="font-display text-xl text-ink break-words">{prettyDate(reg.event_date)}</p></div>}
                {reg.venue && <div className="max-w-[18rem]"><p className="text-sm mb-1">Venue</p><p className="font-display text-xl text-ink break-words whitespace-pre-line">{wrapWords(reg.venue)}</p></div>}
                {reg.city && <div className="max-w-[18rem]"><p className="text-sm mb-1">Location</p><p className="font-display text-xl text-ink break-words whitespace-pre-line">{wrapWords(reg.city)}</p></div>}
              </div>
            </div>
          </section>
        )}

        {/* Guest media wall — visitors share their own photos & videos */}
        {reg.show_guest_uploads && (
          <section className="py-12">
            <div className="text-center mb-8">
              <span className="eyebrow mb-3" style={accent}>{isMemorial ? 'In remembrance' : 'From everyone'}</span>
              <h2 className="text-3xl font-semibold mb-2">Shared by guests</h2>
              <p className="text-muted max-w-lg mx-auto">
                {reg.guest_uploads.length > 0
                  ? 'Photos and videos added by people who were there.'
                  : 'Be the first to add a photo or video to this page.'}
              </p>
              <button className="btn-hero-cta mt-6 !px-7 !py-3 !text-sm" style={ctaStyle}
                      onClick={() => setShowUpload(true)}>
                📸 Add your {reg.guest_uploads_allow_video ? 'photos / video' : 'photos'}
              </button>
            </div>

            {reg.guest_uploads.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(guestsOpen ? reg.guest_uploads : reg.guest_uploads.slice(0, COLLAPSED_TILES)).map((u) => (
                    <button key={u.id} className="relative aspect-square overflow-hidden group"
                            style={imgStyle} onClick={() => setLightbox(u)} title={u.caption}>
                      {u.media_type === 'video' ? (
                        <>
                          <video src={u.display_media} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                          <span className="absolute inset-0 grid place-items-center text-white text-4xl drop-shadow pointer-events-none">▶</span>
                        </>
                      ) : (
                        <div className="w-full h-full bg-soft bg-cover bg-center"
                             style={{ backgroundImage: `url(${u.display_media})` }} />
                      )}
                      {u.uploader_name && (
                        <span className="absolute bottom-0 inset-x-0 px-2 py-1 text-left text-[11px] text-white bg-gradient-to-t from-black/55 to-transparent truncate">
                          {u.uploader_name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {reg.guest_uploads.length > COLLAPSED_TILES && (
                  <ViewMoreButton open={guestsOpen} hidden={reg.guest_uploads.length - COLLAPSED_TILES}
                                  onClick={() => setGuestsOpen((v) => !v)} accent={accent} />
                )}
              </>
            )}
          </section>
        )}

        {/* Registry / memorial fund */}
        {reg.show_registry && (
          <section id="registry" className="py-12">
            <div className="text-center mb-10">
              <span className="eyebrow mb-3" style={accent}>{cfg.registryEyebrow}</span>
              <h2 className="text-3xl font-semibold mb-2">{cfg.registryHeading}</h2>
              <p className="text-muted max-w-lg mx-auto">{cfg.registrySub}</p>
            </div>
            {reg.gifts.length === 0 ? (
              <p className="text-center text-muted">{isMemorial ? 'No fund has been set up yet.' : 'No gifts have been added yet.'}</p>
            ) : (
              <div className={`grid gap-6 ${isMemorial && reg.gifts.length === 1 ? 'max-w-md mx-auto' : 'sm:grid-cols-2'}`}>
                {reg.gifts.map((g) => (
                  <div key={g.id} className="card overflow-hidden flex flex-col" style={cardStyle}>
                    <div className="h-44 bg-soft bg-cover bg-center"
                         style={g.display_image ? { backgroundImage: `url(${g.display_image})` } : { background: `linear-gradient(135deg, ${t.ctaA}, ${t.ctaB})` }} />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold">{g.title}</h3>
                        {g.fully_funded && <span className="chip bg-success/10 text-success">{isMemorial ? 'Goal met ✓' : 'Funded ✓'}</span>}
                      </div>
                      {g.description && <p className="text-sm text-muted mt-1 line-clamp-2">{g.description}</p>}
                      {(g.allow_partial || g.is_cash_fund) ? (
                        // Incremental funding — show the progress bar (if the host enabled it).
                        g.show_progress && (
                          <>
                            <div className="progress mt-3"><i style={barStyle(g.pct_funded)} /></div>
                            <div className="flex justify-between text-sm text-muted mt-1.5">
                              <span><b style={accent}>{money(g.amount_raised, cur)}</b> raised</span>
                              <span>of {money(g.target_amount, cur)}</span>
                            </div>
                          </>
                        )
                      ) : (
                        // Full-payment gift — all-or-nothing, so show the price, not a progress bar.
                        <p className="font-display text-xl mt-3" style={accent}>{money(g.target_amount, cur)}</p>
                      )}
                      <div className="mt-4 pt-2">
                        {g.fully_funded ? (
                          <button className="btn-ghost w-full" disabled>{isMemorial ? 'Thank you 🤍' : 'Fully funded 🎉'}</button>
                        ) : (
                          <button className="btn w-full text-white px-6 py-3 shadow-card hover:-translate-y-0.5 transition"
                                  style={{ background: `linear-gradient(135deg, ${t.ctaA}, ${t.ctaB})` }}
                                  onClick={() => setGiftToFund(g)}>{cfg.contributeCta}</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tribute wall (memorial only) */}
        {isMemorial && reg.show_tributes && (
          <TributeWall registryId={reg.id} tributes={reg.tributes || []} accent={accent}
                       cardStyle={cardStyle} onPosted={load} />
        )}
      </div>

      <footer className="text-center py-10 text-sm text-muted">
        <div className="max-w-xl mx-auto px-6 mb-6">
          <p className="mb-3 font-medium text-ink">Share this page</p>
          <div className="flex justify-center"><ShareBar slug={reg.slug} title={reg.display_name} /></div>
        </div>
        <p>{reg.display_name}</p>
        <p className="mt-1">Powered by <Link to="/" className="font-display" style={accent}>Agamos</Link></p>
      </footer>

      {giftToFund && (
        <ContributeModal
          gift={giftToFund}
          currency={cur}
          slug={slug!}
          heading={isMemorial ? 'Make a contribution' : 'Contribute'}
          actionWord={isMemorial ? 'Give' : 'Contribute'}
          onClose={() => setGiftToFund(null)}
          onSuccess={() => { setGiftToFund(null); load() }}
        />
      )}

      {showUpload && (
        <GuestUploadModal
          registryId={reg.id}
          allowVideo={reg.guest_uploads_allow_video}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); load() }}
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
             onClick={() => setLightbox(null)}>
          <button aria-label="Close" className="absolute top-4 right-5 text-white text-4xl">×</button>
          <div className="max-w-3xl w-full text-center" onClick={(e) => e.stopPropagation()}>
            {lightbox.media_type === 'video' ? (
              <video src={lightbox.display_media} className="max-h-[80vh] mx-auto rounded-xl" controls autoPlay />
            ) : (
              <img src={lightbox.display_media} alt={lightbox.caption} className="max-h-[80vh] mx-auto rounded-xl object-contain" />
            )}
            {(lightbox.caption || lightbox.uploader_name) && (
              <p className="text-white/90 mt-3 text-sm">
                {lightbox.caption}
                {lightbox.uploader_name && <span className="text-white/60"> — {lightbox.uploader_name}</span>}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
