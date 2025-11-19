/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'life-psychology': {
          'primary': '#2563eb',
          'secondary': '#64748b',
          'accent': '#059669',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}