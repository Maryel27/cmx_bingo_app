/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        fadeInOut: "fadeInOut 3s ease-in-out forwards",
        fadeInOutLong: "fadeInOut 5s ease-in-out forwards", // 👈 add this
        fadeInOutXL: "fadeInOut 7s ease-in-out forwards", // 👈 NEW
      },
      keyframes: {
        fadeInOut: {
          "0%": { opacity: 0 },
          "30%": { opacity: 1 },
          "70%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};
