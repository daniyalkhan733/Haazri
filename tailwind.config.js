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
          50: '#f0f5ff',
          100: '#e0ecfe',
          200: '#bae0fd',
          300: '#7cbdfd',
          400: '#3894fd',
          500: '#1E60F2', // Samsung One UI Signature Blue
          600: '#154ecc',
          700: '#113da3',
          800: '#0e317d',
          900: '#0b265e',
          950: '#071638',
        },
        oneui: {
          bg: '#F3F5F9',            // Samsung Light Porcelain Gray
          card: '#FFFFFF',          // Clean White Group Card
          subcard: '#F8FAFD',       // Inset Secondary Card
          border: '#E8ECF4',        // Hairline Divider
          text: '#11151F',          // Deep Slate Black
          subtext: '#6B7688',       // Muted Subtitle
          blue: '#1E60F2',          // Samsung Blue
          green: '#12B886',         // Samsung Health Green
          purple: '#7952DE',        // Samsung Purple
          orange: '#FA722E',        // Samsung Warm Orange
          red: '#F83B4F',           // Samsung Rose Red
          yellow: '#FAB005',        // Samsung Yellow
        },
        dark: {
          bg: '#000000',            // True AMOLED Deep Black
          card: '#161922',          // Dark Inset Group Card
          subcard: '#1D222E',       // Secondary Dark Inset
          border: '#252B3B',        // Thin Dark Divider
          text: '#F3F5F9',          // Bright Text
          subtext: '#8E9AAB',       // Muted Dark Subtitle
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
        'squircle': '28px',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'oneui': '0 2px 12px -2px rgba(17, 21, 31, 0.04), 0 1px 4px -1px rgba(17, 21, 31, 0.02)',
        'oneui-hover': '0 8px 24px -4px rgba(30, 96, 242, 0.12), 0 2px 8px -1px rgba(17, 21, 31, 0.04)',
        'oneui-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
