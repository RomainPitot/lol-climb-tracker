const CHAMP_PALETTE = [
  "#A970FF", "#2EC4B6", "#FF8FA3", "#FFD166", "#5AC8FA", "#0FD68A", "#F4845F",
  "#C77DFF", "#4CC9F0", "#F72585", "#7BDFF2", "#FFB347", "#06D6A0", "#EF476F",
];

/** Couleur d'accent d'un champion — hash simple du nom, stable et distinct pour
 * n'importe quel champion (plus de liste "roster" figée à maintenir à la main : voir
 * lib/championIndex.js pour l'identité Data Dragon, lib/stats.js roleForChampion pour
 * le rôle, tous deux déduits dynamiquement plutôt que codés en dur). */
export const champColor = (name) => {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = (hash * 31 + name.charCodeAt(i)) % CHAMP_PALETTE.length;
  return CHAMP_PALETTE[Math.abs(hash) % CHAMP_PALETTE.length];
};
