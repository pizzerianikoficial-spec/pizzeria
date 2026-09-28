/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px', // Monitores Full HD grandes / 2K
        '4xl': '2560px', // Monitores 4K
      },
      colors: {
        pizza: {
          red: '#EA2A33',
          'red-dark': '#c41e26',
          'red-light': '#ff4a52',
          dark: '#1e1e1e', // Text dark color
          gray: '#ffffff', // Card/Main background
          'gray-2': '#f9fafb', // Component background (input, secondary buttons)
          'gray-3': '#e5e7eb', // Borders
          'gray-4': '#d1d5db', // Borders hover/active
          muted: '#6b7280', // Muted text
        },
        status: {
          pending: '#EA2A33',
          preparing: '#f59e0b',
          ready: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-red': 'pulseRed 2s infinite',
        'card-move': 'cardMove 0.4s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(234,42,51,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(234,42,51,0)' },
        },
        cardMove: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-pizza': 'linear-gradient(135deg, #EA2A33 0%, #c41e26 100%)',
        'gradient-dark': 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
      },
      boxShadow: {
        'pizza': '0 4px 20px rgba(234,42,51,0.15)',
        'pizza-lg': '0 8px 35px rgba(234,42,51,0.25)',
        'card': '0 2px 10px rgba(0,0,0,0.06)',
        'modal': '0 20px 50px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
