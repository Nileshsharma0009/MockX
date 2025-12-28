/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        blob: "blob 7s infinite",
        blink: "blink 1s step-end infinite",
        "modal-pop-in": "modal-pop-in 0.3s ease-out forwards"
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        blink: {
          "0%": { opacity: "1" },
          "50%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "modal-pop-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95) translate(0, 20px)"
          },
          "100%": {
            opacity: "1",
            transform: "scale(1) translate(0, 0)"
          }
        }
      },
    },
  },
  plugins: [],
}