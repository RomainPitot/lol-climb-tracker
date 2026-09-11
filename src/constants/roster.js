export const DDRAGON_VERSION = "16.16.1";

/**
 * Pool de champions suivi par l'app.
 * `ddragon` = identifiant Data Dragon pour l'icône (null = pas d'icône officielle,
 * on retombe sur les initiales colorées).
 */
export const ROSTER = [
  { name: "Zaahen", role: "Top", ddragon: null },
  { name: "Vayne", role: "ADC", ddragon: "Vayne" },
  { name: "Thresh", role: "Support", ddragon: "Thresh" },
  { name: "Yasuo", role: "Mid", ddragon: "Yasuo" },
  { name: "Akali", role: "Mid", ddragon: "Akali" },
  { name: "Vel'Koz", role: "Mid", ddragon: "Velkoz" },
  { name: "Pyke", role: "Support", ddragon: "Pyke" },
  { name: "Caitlyn", role: "ADC", ddragon: "Caitlyn" },
  { name: "Zed", role: "Mid", ddragon: "Zed" },
  { name: "Mordekaiser", role: "Top", ddragon: "Mordekaiser" },
  { name: "Locke", role: "Mid", ddragon: null },
  { name: "Darius", role: "Top", ddragon: "Darius" },
  { name: "Tahm Kench", role: "Support", ddragon: "TahmKench" },
  { name: "Yone", role: "Mid", ddragon: "Yone" },
];

export const CHAMP_ROLE = Object.fromEntries(ROSTER.map((c) => [c.name, c.role]));
export const CHAMP_DDRAGON = Object.fromEntries(ROSTER.map((c) => [c.name, c.ddragon]));

/** Data Dragon → nom affiché, pour retraduire les champions renvoyés par l'API Riot. */
export const REVERSE_CHAMP = Object.fromEntries(
  ROSTER.filter((c) => c.ddragon).map((c) => [c.ddragon, c.name])
);

const CHAMP_PALETTE = [
  "#A970FF", "#2EC4B6", "#FF8FA3", "#FFD166", "#5AC8FA", "#0FD68A", "#F4845F",
  "#C77DFF", "#4CC9F0", "#F72585", "#7BDFF2", "#FFB347", "#06D6A0", "#EF476F",
];

/** Couleur d'accent d'un champion — position dans le roster suivi si connu, sinon un
 * hash simple du nom pour rester stable et distinct entre deux champions hors roster. */
export const champColor = (name) => {
  const idx = ROSTER.findIndex((c) => c.name === name);
  if (idx >= 0) return CHAMP_PALETTE[idx % CHAMP_PALETTE.length];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = (hash * 31 + name.charCodeAt(i)) % CHAMP_PALETTE.length;
  return CHAMP_PALETTE[Math.abs(hash) % CHAMP_PALETTE.length];
};
