/**
 * Système de "pity" pour la roulette Tierlist : chaque fois qu'un champion n'est PAS tiré,
 * il gagne +1% de chance relative pour le prochain tirage (cumulable, remis à 0 dès qu'il
 * est tiré) — voir recordRouletteSpin dans useTrackerData.js pour la mise à jour du compteur.
 *
 * Les paliers ci-dessous ne changent rien au calcul de probabilité : ils habillent juste
 * visuellement un champion qui traîne depuis longtemps sans être tiré, comme une "rareté"
 * qui grimpe — un peu comme un gacha où l'attente rend le tirage plus spectaculaire.
 */
export const RARITY_TIERS = [
  { id: "normal", min: 0, label: null, color: "var(--border)" },
  { id: "uncommon", min: 5, label: "Peu commun", color: "#4ADE80" },
  { id: "rare", min: 12, label: "Rare", color: "#38BDF8" },
  { id: "epic", min: 25, label: "Épique", color: "#C084FC" },
  { id: "legendary", min: 40, label: "Légendaire", color: "#FFD166" },
  { id: "mythic", min: 60, label: "Mythique", color: "#FF4D8D" },
  // Le palier le plus haut scintille en continu (voir rarity-transcendent-idle dans
  // index.css) : le blanc de base laisse le hue-rotate parcourir tout le spectre.
  { id: "transcendent", min: 90, label: "Transcendant", color: "#FFFFFF" },
];

/** Palier de rareté atteint pour un nombre de tirages ratés donné. */
export function rarityFor(missCount) {
  let tier = RARITY_TIERS[0];
  for (const t of RARITY_TIERS) {
    if ((missCount || 0) >= t.min) tier = t;
  }
  return tier;
}

/** Poids relatif d'un champion pour le tirage pondéré : 1 (base) + 1% par miss cumulé. */
export function weightFor(missCount) {
  return 1 + (missCount || 0) * 0.01;
}

/** Tirage pondéré parmi `ids`, `weights` étant une map id -> nombre de tirages ratés. */
export function weightedPick(ids, weights) {
  const total = ids.reduce((sum, id) => sum + weightFor(weights[id]), 0);
  let r = Math.random() * total;
  for (const id of ids) {
    r -= weightFor(weights[id]);
    if (r <= 0) return id;
  }
  return ids[ids.length - 1]; // filet de sécurité contre les arrondis flottants
}
