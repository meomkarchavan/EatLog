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
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        surface: {
          0: '#000000',
          1: '#0a0a0a',
          2: '#141414',
          3: '#1e1e1e',
        },
      },
    },
  },
  plugins: [],
};
