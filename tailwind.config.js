import basePreset from "@navyug/config/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [basePreset],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
