/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app.js",  
    "./src/styles.css"
  ],

  theme: {
    extend: {},
  },

  plugins: [
    //require('@tailwindcss/forms'),
    //require('@tailwindcss/typography'),
  ],
};
