/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#FAFAF7',
        charcoal: '#1C1C1A',
        accent: '#C97D2E',
        muted: '#8A8A84',
        border: '#E4E4DF',
      },
    },
  },
  plugins: [],
}
