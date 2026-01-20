/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a9396',
          light: '#a8dadc',
          dark: '#087f82',
        },
        inteleq: {
          teal: '#0a9396',
          coral: '#e85a4f',
          bg: '#f0f7f7',
        }
      },
      fontFamily: {
        'sf': ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
