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

export const champColor = (name) =>
  CHAMP_PALETTE[ROSTER.findIndex((c) => c.name === name) % CHAMP_PALETTE.length] || "var(--gold)";
