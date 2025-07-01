/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Oswald"', "sans-serif"], // Add your custom heading font
      },
      backgroundImage: {
        "main-bg": "url('/src/assets/main_bg.png')",
      },
    },
  },
  plugins: [],
};
