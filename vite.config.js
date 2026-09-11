import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Le site est servi depuis https://<user>.github.io/lol-climb-tracker/ :
// les assets doivent donc être référencés avec ce préfixe en production.
// En dev (`npm run dev`) on reste à la racine.
const BASE = "/lol-climb-tracker/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? BASE : "/",
  plugins: [
    react(),
    // Rend le site installable ("Ajouter à l'écran d'accueil") — but principal : un
    // téléphone qui a déjà scanné le QR de pairing une fois n'a plus besoin de rescanner
    // à chaque partie (host+token restent en localStorage sur ce téléphone), donc une
    // icône d'app suffit ensuite pour rouvrir directement "Phone control" en un tap.
    // Le service worker (autoUpdate) sert juste le shell en cache pour un démarrage
    // instantané ; les données restent 100% dans localStorage, jamais dans le cache.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        lang: "fr",
        name: "CLIMB.EUW — LoL Climb Tracker",
        short_name: "CLIMB.EUW",
        description: "Tracker de progression SoloQ League of Legends.",
        // "?page=champselect" : l'app démarre directement sur Phone control quand elle est
        // lancée depuis l'icône (voir App.jsx, lecture de ce paramètre au chargement) — pas
        // besoin de retrouver l'onglet à la main après un tap sur l'icône.
        start_url: `${BASE}?page=champselect`,
        scope: BASE,
        display: "standalone",
        background_color: "#0A0D13",
        theme_color: "#0A0D13",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        // Raccourci accessible par appui long sur l'icône (Android) — pratique pour revenir
        // directement au tableau de bord si l'app a démarré sur Phone control.
        shortcuts: [
          {
            name: "Dashboard",
            url: `${BASE}?page=dashboard`,
            icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
      },
      workbox: {
        // Le shell (JS/CSS/icônes) en cache pour un démarrage instantané et hors-ligne ;
        // jamais les données du joueur, qui ne vivent que dans localStorage.
        globPatterns: ["**/*.{js,css,html,svg,png}"],
      },
    }),
  ],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
}));
