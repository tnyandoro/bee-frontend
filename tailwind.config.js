/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  './src/**/*.{js,jsx,ts,tsx}': (content, _file) => content,
  theme: {
    extend: {
      backgroundImage: {
        'main-bg': "url('/src/assets/main_bg.png')",
      },
    },
  },
  plugins: [],
}

