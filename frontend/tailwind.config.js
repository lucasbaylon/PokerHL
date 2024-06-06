/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      md2: '1080px',
      lg: '1024px',
      xl: '1280px'
    },
    extend: {
      backgroundColor: {
        'main-bg': '#FAFBFB',
        'main-dark-bg': '#20232A',
        'secondary-dark-bg': '#33373E',
        'light-gray': '#EFEFEF',
        'half-transparent': 'rgba(0, 0, 0, 0.5)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        appear: {
          '0%': { transform: 'translateY(-50px)', opacity: '0' },
          '100%': { transform: 'translateY(5px)', opacity: '1' },
        },
      },
      animation: {
        appear: 'appear 0.5s ease forwards',
      },
      transformOrigin: {
        'center': 'center',
      },
      scale: {
        '0': '0',
        '100': '1',
      },
    },
  },
  plugins: [],
}

