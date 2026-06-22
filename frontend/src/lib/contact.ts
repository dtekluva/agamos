// Single source of truth for how people reach Agamos.
// Used by the Contact page and the floating contact widget.
export const CONTACT_EMAIL = 'agamosevents@gmail.com'
export const CONTACT_PHONE = '+2348031346306'        // human-readable + tel:
export const CONTACT_WHATSAPP = '2348031346306'       // wa.me format (no +/spaces)

// Friendly pre-filled WhatsApp greeting so the chat starts warm.
export const WHATSAPP_PREFILL = encodeURIComponent('Hi Agamos 👋 I have a question about')

export const whatsappLink = `https://wa.me/${CONTACT_WHATSAPP}?text=${WHATSAPP_PREFILL}`
