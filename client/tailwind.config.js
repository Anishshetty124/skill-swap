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
      keyframes: {
        wave: {
          '0%, 40%, 100%': { transform: 'translateY(0)' },
          '20%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        wave: 'wave 1.2s linear infinite',
      },
    },
  },
  plugins: [],
}
