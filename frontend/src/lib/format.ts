const SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€', KES: 'KSh ', GHS: '₵' }

export function money(amount: number | string, currency = 'NGN') {
  const v = typeof amount === 'string' ? parseFloat(amount) : amount
  const sym = SYMBOLS[currency] ?? ''
  return sym + (v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// Keep the full text but insert a line break after every `every` words,
// so long values wrap onto new lines instead of being truncated.
export function wrapWords(text: string | null | undefined, every = 8) {
  if (!text) return ''
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  for (let i = 0; i < words.length; i += every) {
    lines.push(words.slice(i, i + every).join(' '))
  }
  return lines.join('\n')
}

export function prettyDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
