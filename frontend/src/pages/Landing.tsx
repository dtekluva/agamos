import { Link, useNavigate } from 'react-router-dom'
import { EVENT_LIST } from '../lib/eventTypes'
import { usePageTitle } from '../lib/usePageTitle'
import { useAuth } from '../lib/auth'

export default function Landing() {
  usePageTitle('Agamos — Gift lists & cash funds for every celebration')
  const { user } = useAuth()
  const nav = useNavigate()

  // No signup wall: send to the public picker. The guest account is created
  // lazily there (only once a type is picked), so idle clicks leave no rows.
  const startCreating = () => {
    nav(user ? '/dashboard/new' : '/create')
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-cream/80 backdrop-blur border-b border-soft">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-semibold">
            Agamos<span className="text-rose">.</span>
          </Link>
          <div className="flex items-center gap-7 text-sm text-muted">
            <a href="#events" className="hidden sm:block hover:text-rose">Events</a>
            <a href="#how" className="hidden sm:block hover:text-rose">How it works</a>
            <Link to="/login" className="hidden sm:block hover:text-rose">Log in</Link>
            <button type="button" onClick={startCreating} className="btn-primary btn-sm">Create an event</button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="chip mb-5">Gift lists for every celebration</span>
          <h1 className="text-5xl leading-tight font-semibold mb-5">
            Give what they <em className="text-rose not-italic font-display italic">truly</em> wish for.
          </h1>
          <p className="text-lg text-muted max-w-lg mb-8">
            Create a beautiful page for any celebration — weddings, anniversaries, baby
            showers, birthdays and memorials — and let friends &amp; well-wishers fund the
            gifts and goals that matter. No duplicates. No awkward cash.
          </p>
          <div className="flex flex-wrap gap-4">
            <button type="button" onClick={startCreating} className="btn-primary">Start your event</button>
            <a href="#events" className="btn-ghost">See event types</a>
          </div>
          <div className="flex gap-8 mt-8 text-sm text-muted">
            <div><b className="block font-display text-xl text-ink">5 event types</b>One platform</div>
            <div><b className="block font-display text-xl text-ink">Group gifts</b>Fund the big stuff</div>
            <div><b className="block font-display text-xl text-ink">Secure</b>Protected payouts</div>
          </div>
        </div>

        {/* Sample gift card */}
        <div className="md:rotate-[-2deg]">
          <div className="card p-6 max-w-sm mx-auto">
            <div className="h-40 rounded-xl mb-4 bg-gradient-to-br from-[#f3d9c8] to-[#e7b7c9] grid place-items-center text-5xl">🌴</div>
            <h3 className="text-xl font-semibold">Honeymoon in Zanzibar</h3>
            <p className="text-sm text-muted mb-3">A goal Ada &amp; Tunde are dreaming of</p>
            <div className="progress mb-2"><i style={{ width: '68%' }} /></div>
            <div className="flex justify-between text-sm text-muted mb-4">
              <span><b className="text-rose-deep">₦680,000</b> raised</span>
              <span>of ₦1,000,000</span>
            </div>
            <Link to="/signup" className="btn-primary w-full">Contribute a little</Link>
          </div>
        </div>
      </section>

      {/* For every celebration */}
      <section id="events" className="bg-soft">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="eyebrow mb-3">For every celebration</span>
            <h2 className="text-4xl font-semibold mb-3">Not just weddings</h2>
            <p className="text-muted">Whatever the moment, Agamos gives it a page worth sharing.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {EVENT_LIST.map((ev) => (
              <button key={ev.key} type="button" onClick={startCreating}
                className="bg-white rounded-2xl p-5 text-center shadow-card hover:-translate-y-1 hover:shadow-lift transition">
                <div className="w-14 h-14 rounded-2xl bg-soft grid place-items-center text-3xl mx-auto mb-3">{ev.emoji}</div>
                <h3 className="font-semibold">{ev.label}</h3>
                <p className="text-xs text-muted mt-1.5 leading-snug">{ev.blurb}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="eyebrow mb-3">Simple by design</span>
          <h2 className="text-4xl font-semibold mb-3">How Agamos works</h2>
          <p className="text-muted">Three easy steps for the host — one for every guest.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-7">
          {[
            ['1', 'Build your list', 'Add gifts from any store, or set cash goals like a honeymoon, a nursery or a memorial fund.'],
            ['2', 'Share your page', 'Send one beautiful link. Guests see your story and give in seconds.'],
            ['3', 'Receive & redeem', 'Guests buy or chip in. Withdraw cash to your bank — then say thank you.'],
          ].map(([n, t, d]) => (
            <div key={n} className="card p-8">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose to-rose-deep text-white grid place-items-center font-display font-bold mb-5">{n}</div>
              <h3 className="text-xl font-semibold mb-2">{t}</h3>
              <p className="text-muted text-sm">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-soft">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="eyebrow mb-3">Everything in one place</span>
            <h2 className="text-4xl font-semibold mb-3">Built for the way people give</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ['🎁', 'Universal list', 'Add any item from any store, or set cash funds. No retailer lock-in.'],
              ['💸', 'Fund any goal', 'Full purchase or partial contributions — honeymoons, nurseries, memorial funds.'],
              ['👥', 'Group gifting', 'Several guests pool together to fund one big item.'],
              ['💌', 'Beautiful event page', 'Share your story, a timeline, a gallery, event details — themed to the occasion.'],
              ['🔒', 'Secure payouts', 'Funds held safely; withdraw to your bank via Paystack.'],
              ['✅', 'Guest checkout', 'Friends give in under a minute — no account needed.'],
            ].map(([i, t, d]) => (
              <div key={t} className="card p-7">
                <div className="w-12 h-12 rounded-full bg-soft grid place-items-center text-2xl mb-4">{i}</div>
                <h3 className="text-lg font-semibold mb-1.5">{t}</h3>
                <p className="text-muted text-sm">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-berry to-berry-deep text-white text-center px-8 py-16">
          <h2 className="text-4xl font-semibold mb-3">Start your event today</h2>
          <p className="text-white/75 max-w-md mx-auto mb-8">It’s free to create your page and share it with everyone you love.</p>
          <button type="button" onClick={startCreating} className="btn-gold">Create your event — free</button>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-12 text-sm text-muted flex flex-wrap items-center justify-between gap-4">
        <div className="font-display text-xl">Agamos<span className="text-rose">.</span></div>
        <div className="flex items-center gap-5">
          <Link to="/contact" className="hover:text-rose">Contact us</Link>
          <span>© 2026 Agamos · Give what they truly wish for.</span>
        </div>
      </footer>
    </div>
  )
}
