/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        handwriting: ['Kalam', 'cursive'],
      },
      colors: {
        sage: {
          DEFAULT: '#4a7c6f',
          light: '#6b9e8f',
          pale: '#e8f2ef',
          deep: '#2d5249',
        },
        amber: {
          DEFAULT: '#d4853a',
          pale: '#fdf3e7',
          deep: '#a05f20',
        },
        sky: {
          DEFAULT: '#3a7ab8',
          pale: '#e8f2fb',
        },
        coral: {
          DEFAULT: '#c4604a',
          pale: '#fbeee9',
        },
        ink: {
          DEFAULT: '#1a1f1c',
          soft: '#3d4840',
        },
        muted: '#7a8c85',
        surface: '#f5f8f6',
        border: '#d8e4e0',
        // Keep old colors for backward compat during migration
        brand: {
          50: '#f0f6ff', 100: '#dceafd', 200: '#b5d3fc', 300: '#7db4f8',
          400: '#4290f0', 500: '#1068c8', 600: '#0A4D8C', 700: '#073b6e',
          800: '#0a3259', 900: '#0d2847', 950: '#091b30',
        },
        teal: {
          50: '#f0fdfb', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
          400: '#2dd4bf', 500: '#14b8a6', 600: '#00A896', 700: '#0f766e',
          800: '#115e59', 900: '#134e4a', 950: '#042f2e',
        },
        neutral: {
          50: '#f8f9fb', 100: '#f0f2f5', 200: '#e2e5ea', 300: '#c8cdd6',
          400: '#a1a9b7', 500: '#7b8598', 600: '#5c6678', 700: '#454e5e',
          800: '#333c4a', 900: '#212B36', 950: '#151b24',
        },
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        lg: '20px',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0,0,0,0.06)',
        'card': '0 4px 12px -2px rgba(0,0,0,0.08)',
        'elevated': '0 4px 32px rgba(0,0,0,0.08)',
        'dramatic': '0 16px 48px -8px rgba(0,0,0,0.16)',
      },
      animation: {
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
