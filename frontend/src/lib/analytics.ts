// Google Ads conversion firing. The base gtag.js is loaded in index.html;
// here we fire specific conversions on real actions (not on page load).
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

// "Sign up" conversion — fired when a host actually creates an event.
const SIGNUP_CONVERSION = 'AW-18261085761/qvvTCKTlqcMcEMGcyINE'

export function trackEventCreated() {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: SIGNUP_CONVERSION,
      value: 1.0,
      currency: 'NGN',
    })
  }
}
