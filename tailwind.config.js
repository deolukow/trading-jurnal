/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",   // pastikan semua file JSX/TSX discan
  ],
  darkMode: 'class',   // ✅ ini penting supaya bisa toggle manual
  theme: {
    extend: {},
  },
  plugins: [],
}
