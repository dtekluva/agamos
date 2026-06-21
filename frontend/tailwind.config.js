/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        berry: { DEFAULT: '#6D2E46', deep: '#521F33' },
        rose: { DEFAULT: '#C8688A', deep: '#A84D70' },
        gold: { DEFAULT: '#B98A2E', light: '#D9A86C', champagne: '#EBCFA8' },
        ink: '#2A222F',
        muted: '#6F6470',
        line: '#E7DBD3',
        soft: '#F3E7DF',
        cream: '#FBF6F1',
        success: '#2E7D5B',
        warning: '#B98A2E',
        error: '#B23A48',
        info: '#50808E',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 14px rgba(109,46,70,.07)',
        card: '0 8px 28px rgba(109,46,70,.10)',
        lift: '0 18px 50px rgba(109,46,70,.14)',
      },
    },
  },
  plugins: [],
}
