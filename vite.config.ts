import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    sourcemap: true,
    // maplibre-gl is an inherently large GL rendering engine; it's isolated into its own
    // cacheable vendor chunk below rather than actually being reduced in size. The
    // onboarding globe's three.js/react-globe.gl stack (lazy-loaded, only fetched once a
    // user starts the create-account flow) is similarly large but isolated automatically
    // as its own chunk since OnboardingGlobe.tsx is the only dynamic-import consumer.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-maplibre": ["maplibre-gl"],
        },
      },
    },
  },
});
