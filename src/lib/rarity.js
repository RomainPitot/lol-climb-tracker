/**
 * Système de "pity" pour la roulette Tierlist : chaque fois qu'un champion n'est PAS tiré,
 * son poids grimpe pour le prochain tirage (remis à la base dès qu'il est tiré) — voir
 * recordRouletteSpin dans useTrackerData.js pour la mise à jour du compteur.
 *
 * Croissance EXPONENTIELLE (composée), pas linéaire : chaque tirage raté multiplie le poids
 * par GROWTH_RATE plutôt que d'y ajouter un montant fixe. Le poids double environ tous les
 * ln(2)/ln(GROWTH_RATE) ≈ 35 tirages ratés — l'avantage s'accélère au lieu de s'accumuler à
 * plat, donc l'attente devient de plus en plus payante avec le temps, pas juste proportionnelle.
 *
 * Les paliers ci-dessous ne changent rien au calcul de probabilité : ils habillent juste
 * visuellement un champion qui traîne depuis longtemps sans être tiré, comme une "rareté"
 * qui grimpe — un peu comme un gacha où l'attente rend le tirage plus spectaculaire. Les
 * seuils sont recalibrés pour cette courbe : ils demandent nettement plus de tirages ratés
 * qu'avant pour représenter le même bonus relatif, donc les paliers sont plus rares à atteindre.
 */
const BASE_WEIGHT = 2;
const GROWTH_RATE = 1.02;

export const RARITY_TIERS = [
  { id: "normal", min: 0, label: null, color: "var(--border)" },
  { id: "uncommon", min: 20, label: "Peu commun", color: "#4ADE80" },
  { id: "rare", min: 40, label: "Rare", color: "#38BDF8" },
  { id: "epic", min: 65, label: "Épique", color: "#C084FC" },
  { id: "legendary", min: 95, label: "Légendaire", color: "#FFD166" },
  { id: "mythic", min: 130, label: "Mythique", color: "#FF4D8D" },
  // Le palier le plus haut scintille en continu (voir rarity-transcendent-idle dans
  // index.css) : le blanc de base laisse le hue-rotate parcourir tout le spectre.
  { id: "transcendent", min: 175, label: "Transcendant", color: "#FFFFFF" },
];

/** Palier de rareté atteint pour un nombre de tirages ratés donné. */
export function rarityFor(missCount) {
  let tier = RARITY_TIERS[0];
  for (const t of RARITY_TIERS) {
    if ((missCount || 0) >= t.min) tier = t;
  }
  return tier;
}

/** Poids relatif d'un champion pour le tirage pondéré : croissance exponentielle composée. */
export function weightFor(missCount) {
  return BASE_WEIGHT * Math.pow(GROWTH_RATE, missCount || 0);
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
