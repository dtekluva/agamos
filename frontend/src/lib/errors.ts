/** Turn an axios/DRF error into a single human-readable message. */
export function apiError(e: any, fallback = 'Something went wrong. Please try again.'): string {
  // No response = network / server down / CORS
  if (!e?.response) {
    return 'Could not reach the server. Check your connection and that the API is running.'
  }
  const d = e.response.data
  if (!d) return fallback
  if (typeof d === 'string') return d
  if (d.detail) return d.detail
  if (Array.isArray(d.non_field_errors) && d.non_field_errors.length) return d.non_field_errors[0]

  // First field-level error, e.g. {"image_url": ["Enter a valid URL."]}
  if (typeof d === 'object') {
    const entry = Object.entries(d)[0]
    if (entry) {
      const [field, val] = entry
      const msg = Array.isArray(val) ? val[0] : String(val)
      const label = field.replace(/_/g, ' ')
      return `${label.charAt(0).toUpperCase() + label.slice(1)}: ${msg}`
    }
  }
  return fallback
}

/** Prepend https:// when a user pastes a bare URL (e.g. "example.com/a.jpg"). */
export function normalizeUrl(u: string): string {
  const v = (u || '').trim()
  if (v && !/^https?:\/\//i.test(v) && !v.startsWith('data:')) return 'https://' + v
  return v
}
