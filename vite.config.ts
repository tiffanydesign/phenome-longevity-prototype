import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// GitHub Pages serves the site from /<repo-name>/ — keep in sync with the repo name.
export default defineConfig({
  base: "/phenome-longevity-prototype/",
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
