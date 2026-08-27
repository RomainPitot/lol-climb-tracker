/**
 * Système de "pity" pour la roulette Tierlist : chaque fois qu'un champion n'est PAS tiré,
 * son poids grimpe pour le prochain tirage (remis à la base dès qu'il est tiré) — voir
 * recordRouletteSpin dans useTrackerData.js pour la mise à jour du compteur.
 *
 * Croissance EXPONENTIELLE (composée), pas linéaire : chaque tirage raté multiplie le poids
 * par GROWTH_RATE plutôt que d'y ajouter un montant fixe. Le poids double environ tous les
 * DOUBLING_INTERVAL tirages ratés — l'avantage s'accélère au lieu de s'accumuler à plat.
 *
 * Point important : `weightFor` ne dépend QUE du nombre de tirages ratés, jamais de la taille
 * de la pool — c'est volontaire, c'est ce qui fait fonctionner le tirage pondéré correctement.
 * Mais ça veut dire que "quel palier de rareté afficher" doit, lui, dépendre de la taille de
 * la pool : le même compteur de misses donne une probabilité réelle radicalement différente
 * selon qu'il y a 2 champions ou 100 (avec 100 concurrents à poids de base, un même bonus se
 * noie dans la masse). `rarityFor` décale donc ses seuils vers le haut à mesure que la pool
 * grossit, pour qu'un palier donné représente à peu près la même probabilité réelle quel que
 * soit le nombre de champions — voir le calcul dans thresholdFor ci-dessous.
 */
const BASE_WEIGHT = 2;
const GROWTH_RATE = 1.02;
/** Nombre de tirages ratés pour doubler le poids : ln(2) / ln(GROWTH_RATE). */
const DOUBLING_INTERVAL = Math.log(2) / Math.log(GROWTH_RATE);
/** Taille de pool sur laquelle les seuils ci-dessous ont été calibrés à l'œil. */
const REFERENCE_POOL_SIZE = 2;

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

/**
 * Seuil effectif d'un palier pour une pool de `poolSize` champions : décalé vers le haut
 * d'un nombre de "doublements" égal à log2(poolSize / REFERENCE_POOL_SIZE). Résultat : au
 * seuil effectif, le poids du champion est toujours ~REFERENCE_POOL_SIZE/2 fois celui d'un
 * concurrent frais, quelle que soit la taille de la pool — donc une probabilité réelle
 * comparable à chaque palier, plutôt qu'un seuil fixe qui ne veut plus rien dire à grande échelle.
 */
export function thresholdFor(tier, poolSize) {
  const n = Math.max(poolSize || REFERENCE_POOL_SIZE, 1);
  return tier.min + DOUBLING_INTERVAL * Math.log2(n / REFERENCE_POOL_SIZE);
}

/** Palier de rareté atteint pour un nombre de tirages ratés donné, dans une pool de `poolSize`
 * champions. `poolSize` est optionnel (retombe sur REFERENCE_POOL_SIZE) pour les appels qui
 * n'ont pas ce contexte — mais le fournir est important dès que la pool dépasse 2-3 champions. */
export function rarityFor(missCount, poolSize) {
  let tier = RARITY_TIERS[0];
  for (const t of RARITY_TIERS) {
    if ((missCount || 0) >= thresholdFor(t, poolSize)) tier = t;
  }
  return tier;
}

/**
 * Poids relatif d'un champion pour le tirage pondéré : croissance exponentielle composée.
 * Ne dépend QUE du nombre de tirages ratés — jamais de la taille de la pool, voir plus haut.
 */
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
