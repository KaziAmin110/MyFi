/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily:{
        inter: ["Inter_500Medium", "Inter_600SemiBold"]
      },
      colors: {
        primary: '#345995',
        light: '#D9D9D973'
      }
    },
  },
  plugins: [],
}