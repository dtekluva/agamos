/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Wishwell design system: cream paper, sage as the calm voice, gold for moments.
        sage: { DEFAULT: '#8aa590', deep: '#4f6b58' },
        gold: { DEFAULT: '#d4ad5a', light: '#e3c986', champagne: '#f0e2c4' },
        cream: { DEFAULT: '#f5f0e6', deep: '#ebe2cf' },
        ink: '#1f1c17',
        muted: '#6f6a5c',
        line: '#e2ddcf',
        soft: '#ebe2cf',
        success: '#4f7d5f',
        warning: '#c79a3a',
        error: '#b4513f',
        info: '#5b8390',
        // Legacy aliases — existing classes (rose/berry) now render the sage palette,
        // so the whole app reskins without rewriting every className.
        rose: { DEFAULT: '#8aa590', deep: '#4f6b58' },
        berry: { DEFAULT: '#4f6b58', deep: '#3e5446' },
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Work Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 14px rgba(79,107,88,.08)',
        card: '0 8px 28px rgba(79,107,88,.10)',
        lift: '0 18px 50px rgba(79,107,88,.14)',
      },
    },
  },
  plugins: [],
}
