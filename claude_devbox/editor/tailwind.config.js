/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'devbox-bg': '#1e1e1e',
        'devbox-secondary': '#252526',
        'devbox-tertiary': '#2d2d30',
        'devbox-border': '#3e3e42',
        'devbox-text': '#d4d4d4',
        'devbox-text-muted': '#858585',
        'devbox-accent-blue': '#007acc',
        'devbox-accent-green': '#4ec9b0',
        'devbox-accent-red': '#f48771',
        'devbox-accent-yellow': '#dcdcaa',
      },
      fontFamily: {
        'mono': ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
