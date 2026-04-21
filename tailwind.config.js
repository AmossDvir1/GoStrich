/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B35",
        secondary: "#004E89",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        "zone-z1": "#86EFAC",
        "zone-z2": "#4ADE80",
        "zone-z3": "#FACC15",
        "zone-z4": "#FB923C",
        "zone-z5": "#DC2626",
      },
    },
  },
  plugins: [],
};
