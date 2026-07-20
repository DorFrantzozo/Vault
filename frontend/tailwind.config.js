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
      }
    },
  },
  plugins: [],
}
