import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CONTACT_EMAIL, CONTACT_PHONE, whatsappLink } from '../lib/contact'

// Don't show the floating widget where it's redundant or in the way:
// inside the host's dashboard, and on the Contact page itself.
const HIDE_ON = [/^\/dashboard/, /^\/contact/]

const ChatIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
  </svg>
)
const CloseIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)
const WhatsAppIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5 9.43 9.43 0 0 1 16.1-6.67 9.37 9.37 0 0 1 2.76 6.68c0 5.2-4.24 9.4-9.41 9.4zm8.02-17.4A11.36 11.36 0 0 0 12.04.74C5.8.74.72 5.82.72 12.06c0 1.99.52 3.94 1.51 5.66L.63 23.5l5.92-1.55a11.3 11.3 0 0 0 5.48 1.4h.01c6.24 0 11.32-5.08 11.32-11.32 0-3.03-1.18-5.87-3.3-8.01z" />
  </svg>
)
const PhoneIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)
const MailIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" />
  </svg>
)
const FormIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" />
  </svg>
)

function Row({ children, accent, label, sub, ...rest }: any) {
  return (
    <a {...rest} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-soft transition group">
      <span className={`grid place-items-center w-9 h-9 rounded-full shrink-0 ${accent}`}>{children}</span>
      <span className="min-w-0">
        <span className="block font-semibold text-sm text-ink">{label}</span>
        <span className="block text-xs text-muted truncate">{sub}</span>
      </span>
    </a>
  )
}

export default function FloatingContact() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [nudge, setNudge] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Gentle one-time "we're here" nudge a few seconds after landing — once per
  // browser session, never if they've already opened the widget.
  useEffect(() => {
    if (open || sessionStorage.getItem('agamos_contact_nudge')) return
    const show = setTimeout(() => setNudge(true), 3500)
    const hide = setTimeout(() => setNudge(false), 11000)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [open])

  // Close on Escape or click outside.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown) }
  }, [open])

  const dismissNudge = () => { setNudge(false); sessionStorage.setItem('agamos_contact_nudge', '1') }
  const toggle = () => { setOpen((o) => !o); dismissNudge() }

  if (HIDE_ON.some((re) => re.test(pathname))) return null

  return (
    <div ref={rootRef} className="fixed bottom-5 right-4 sm:right-5 z-40 flex flex-col items-end gap-3 print:hidden">
      {/* Expanded panel */}
      {open && (
        <div role="dialog" aria-label="Contact Agamos"
             className="contact-panel w-[min(20rem,calc(100vw-2rem))] rounded-2xl bg-white shadow-card border border-line overflow-hidden">
          <div className="bg-gradient-to-br from-rose to-rose-deep text-white px-5 py-4">
            <p className="font-semibold text-[15px]">We’d love to hear from you 💬</p>
            <p className="text-white/85 text-sm mt-0.5 leading-snug">
              A question about a gift, a payout, or just saying hi — reach us whichever way is easiest.
            </p>
          </div>
          <div className="p-2">
            <Row href={whatsappLink} target="_blank" rel="noopener noreferrer"
                 accent="bg-[#25D366] text-white" label="WhatsApp" sub="Fastest reply — chat with us now">
              {WhatsAppIcon}
            </Row>
            <Row href={`tel:${CONTACT_PHONE}`} accent="bg-soft text-rose-deep" label="Call us" sub={CONTACT_PHONE}>
              {PhoneIcon}
            </Row>
            <Row href={`mailto:${CONTACT_EMAIL}`} accent="bg-soft text-rose-deep" label="Email us" sub={CONTACT_EMAIL}>
              {MailIcon}
            </Row>
            <Link to="/contact" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-soft transition">
              <span className="grid place-items-center w-9 h-9 rounded-full shrink-0 bg-soft text-rose-deep">{FormIcon}</span>
              <span className="min-w-0">
                <span className="block font-semibold text-sm text-ink">Send a message</span>
                <span className="block text-xs text-muted truncate">Fill a quick form — we’ll get back to you</span>
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* One-time attention nudge */}
      {nudge && !open && (
        <div className="contact-nudge relative mr-1 max-w-[15rem] rounded-2xl rounded-br-md bg-white shadow-card border border-line px-4 py-3">
          <button type="button" onClick={dismissNudge} aria-label="Dismiss"
                  className="absolute -top-2 -right-2 grid place-items-center w-6 h-6 rounded-full bg-white border border-line text-muted hover:text-ink shadow-sm">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <p className="text-sm text-ink font-semibold">Questions? We’re here 👋</p>
          <p className="text-xs text-muted mt-0.5">Tap to chat, call or email the Agamos team.</p>
        </div>
      )}

      {/* Trigger */}
      <button type="button" onClick={toggle} aria-expanded={open}
              aria-label={open ? 'Close contact menu' : 'Contact us'}
              className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-rose to-rose-deep text-white pl-4 pr-5 py-3 shadow-card hover:-translate-y-0.5 transition ${open ? '' : 'contact-fab'}`}>
        {open ? CloseIcon : ChatIcon}
        <span className="font-semibold text-sm whitespace-nowrap">{open ? 'Close' : 'Contact us'}</span>
      </button>
    </div>
  )
}
