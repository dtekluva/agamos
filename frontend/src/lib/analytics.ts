// Google Ads conversion firing. The base gtag.js is loaded in index.html;
// here we fire specific conversions on real actions (not on page load).
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

// "Sign up" conversion — fired when a visitor creates a real account
// (normal signup, or a guest claiming their draft).
const SIGNUP_CONVERSION = 'AW-18261085761/qvvTCKTlqcMcEMGcyINE'

export function trackSignup() {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: SIGNUP_CONVERSION,
      value: 1.0,
      currency: 'NGN',
    })
  }
}
