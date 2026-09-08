/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Geist Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        surface: {
          0: '#090a0c',
          1: '#0f1013',
          2: '#15171b',
          3: '#1c1e24',
          4: '#252830',
          5: '#343843',
        },
        macro: {
          protein: '#22c55e',
          carbs: '#38bdf8',
          fat: '#fb923c',
          fiber: '#a78bfa',
          calories: '#facc15',
          water: '#38bdf8',
          weight: '#f472b6',
        },
      },
    },
  },
  plugins: [],
};
