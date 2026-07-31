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
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae2fd',
          300: '#7cd0fd',
          400: '#36bbfb',
          500: '#0ca3eb',
          600: '#0083ca',
          700: '#0168a3',
          800: '#065986',
          900: '#0b4a70',
          950: '#072f4a',
        },
        dark: {
          bg: '#080B11',       // Sleek premium slate black
          card: '#111622',     // Dark container background
          border: '#1D2636',   // Thin dark borders
          text: '#F3F4F6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
