/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
      "./src/**/*.{js,jsx,ts,tsx}", // adjust as needed for your project structure
    ],
    theme: {
      extend: {
      fontFamily: {
        sans: ['"Bitcount Grid Double"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
    },
    plugins: [],
  }
  