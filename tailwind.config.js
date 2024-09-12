/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: '#FF9933', // Define your custom saffron color here
      },
      gradientColorStops: {
        saffron: '#FF9933', // Define your custom saffron color for gradients
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
