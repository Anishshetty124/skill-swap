
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'accent': {
          '500': '#14b8a6', // teal-500
          '600': '#0d9488', // teal-600
        }
      },
    },
  },
  plugins: [],
}