
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./domain/**/*.{js,ts,jsx,tsx}",
    "./infrastructure/**/*.{js,ts,jsx,tsx}",
    "./application/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lianjia: {
          DEFAULT: '#00AE66',
          dark: '#009657',
          light: '#E6F7F0',
        }
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
