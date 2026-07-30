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
        'ink-700': 'var(--ink-700)',
        'slate-gray': 'var(--slate-gray)',
        'text-faint': 'var(--text-subtle)',
        'dust-taupe': 'var(--dust-taupe)',
        'link-blue': 'var(--link-blue)',
        'soft-bone': 'var(--soft-bone)',
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
        },
        info: {
          DEFAULT: 'var(--info)',
          bg: 'var(--info-bg)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          bg: 'var(--danger-bg)',
        },
      },
      fontFamily: {
        sans: ['Rubik', 'Heebo', 'Inter', 'sans-serif'],
        heading: ['Rubik', 'Heebo', 'sans-serif'],
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
