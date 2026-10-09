/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyan: {
          400: "#6ee7b7",
          500: "#10b981",
          600: "#059669",
        },
        electric: {
          glow: "#34d399",
          blue: "#047857",
          cyan: "#10b981",
        },
        dark: {
          bg: "#050c0a",
          card: "#0b1513",
          border: "#20332e",
          hover: "#101c1a",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #34d399 0%, #10b981 58%, #d6a94b 100%)",
        "cyan-gradient": "linear-gradient(135deg, #34d399 0%, #10b981 58%, #d6a94b 100%)",
        "cyan-glow": "radial-gradient(circle, rgba(52,211,153,0.15) 0%, rgba(5,12,10,0) 70%)",
      },
    },
  },
  plugins: [],
};
