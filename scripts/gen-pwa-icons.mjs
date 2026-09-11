// Génère les icônes PWA à partir du logo existant (public/favicon.svg) — un seul script,
// à relancer si le logo change, plutôt que des PNG maintenus à la main en parallèle du SVG.
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const publicDir = path.join(root, "public");
mkdirSync(publicDir, { recursive: true });

const baseSvg = readFileSync(path.join(publicDir, "favicon.svg"), "utf-8");

// Icône "maskable" : les OS (Android surtout) rognent l'icône dans un cercle/squircle —
// il faut donc que le motif reste dans une zone de sécurité centrale (~40% de marge de
// chaque côté), sur un fond plein qui, lui, peut être rogné sans problème.
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#A970FF" />
      <stop offset="100%" stop-color="#2EC4B6" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" fill="#0A0D13" />
  <g transform="translate(16 16) scale(0.62) translate(-16 -16)">
    <rect width="32" height="32" rx="8" fill="url(#g)" />
    <path d="M9 22l14-12M23 22L9 10" stroke="#0A0D13" stroke-width="2.5" stroke-linecap="round" />
  </g>
</svg>`;

const targets = [
  { file: "icon-192.png", svg: baseSvg, size: 192 },
  { file: "icon-512.png", svg: baseSvg, size: 512 },
  { file: "icon-maskable-512.png", svg: maskableSvg, size: 512 },
  { file: "apple-touch-icon.png", svg: baseSvg, size: 180 },
];

for (const t of targets) {
  const buf = await sharp(Buffer.from(t.svg), { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toBuffer();
  writeFileSync(path.join(publicDir, t.file), buf);
  console.log(`Écrit public/${t.file} (${t.size}x${t.size})`);
}
