import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le site est servi depuis https://<user>.github.io/lol-climb-tracker/ :
// les assets doivent donc être référencés avec ce préfixe en production.
// En dev (`npm run dev`) on reste à la racine.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/lol-climb-tracker/" : "/",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
}));
