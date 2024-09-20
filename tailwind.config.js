/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  './src/**/*.{js,jsx,ts,tsx}': (content, _file) => content,
  theme: {
    extend: {},
  },
  plugins: [],
}

