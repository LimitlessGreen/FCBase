import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://limitlessgreen.github.io",
  base: "/FCBase",
  output: "static",
  integrations: [
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
