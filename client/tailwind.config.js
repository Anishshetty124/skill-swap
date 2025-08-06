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
          '500': '#3b82f6', 
          '600': '#2563eb', 
        }
      },
    },
  },
  plugins: [],
}
