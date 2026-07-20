/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'canvas-cream': 'var(--canvas-cream)',
        'lifted-cream': 'var(--lifted-cream)',
        'ink-black': 'var(--ink-black)',
        'signal-orange': 'var(--signal-orange)',
        'light-signal-orange': 'var(--light-signal-orange)',
        'clay-brown': 'var(--clay-brown)',
        'slate-gray': 'var(--slate-gray)',
        'dust-taupe': 'var(--dust-taupe)',
        'link-blue': 'var(--link-blue)',
        'soft-bone': 'var(--soft-bone)',
        charcoal: {
          950: '#0e0f12',
          900: '#141518',
          800: '#1a1b1f',
          700: '#23242a',
          600: '#2e3037',
        },
        accent: {
          lime: '#e2f853',
          limeHover: '#d4ea43',
          cyan: '#7ee7f8',
          purple: '#b3b5ff',
          mint: '#a8f0bb',
          rose: '#ff8ba7',
        }
      },
      fontFamily: {
        sans: ['"Sofia Sans"', 'Heebo', 'Inter', 'sans-serif'],
        heading: ['"Sofia Sans"', 'Rubik', 'Heebo', 'sans-serif'],
      },
      borderRadius: {
        'button-pill': '20px',
        'consent-pill': '24px',
        'stadium': '40px',
        'full-pill': '999px',
        'circle': '50%',
      },
      boxShadow: {
        'mc-level-1': '0px 4px 24px 0px rgba(0, 0, 0, 0.04)',
        'mc-level-2': '0px 24px 48px 0px rgba(0, 0, 0, 0.08)',
        'mc-level-3': '0px 70px 110px 0px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
