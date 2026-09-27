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
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        electric: {
          glow: "#00f0ff",
          blue: "#0072ff",
          cyan: "#00c6ff",
        },
        dark: {
          bg: "#050811",
          card: "#0a0f1d",
          border: "#161f36",
          hover: "#11182c",
        },
      },
      backgroundImage: {
        "cyan-gradient": "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
        "cyan-glow": "radial-gradient(circle, rgba(0,240,255,0.15) 0%, rgba(5,8,17,0) 70%)",
      },
    },
  },
  plugins: [],
};
