/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        slate: {
          950: '#060c1c',
          900: '#0d1527',
          850: '#111c34',
          800: '#1a2744',
          700: '#2b3c61',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          950: '#03251a',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          950: '#04222c',
        }
      }
    },
  },
  plugins: [],
}
