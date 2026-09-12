/**
 * Distribution cumulée des joueurs classés par palier — source : op.gg, "Stats by tier",
 * région EUW, relevé le 12/09/2026 (constante à rafraîchir périodiquement, comme
 * BENCHMARKS dans constants/ranks.js). Chaque valeur = pourcentage de TOUS les joueurs
 * classés qui sont à ce palier ou mieux (ex: Diamant I → 1.62% : 1.62% des joueurs classés
 * sont Diamant I ou au-dessus). Sert à un percentile ESTIMÉ ("≈ top X%"), jamais présenté
 * comme un rang individuel exact — Riot ne publie aucun endpoit qui liste tous les comptes
 * Fer→Diamant, impossible d'avoir mieux qu'une estimation à partir de cette répartition
 * globale. Au-dessus de Master, un vrai chiffre existe (voir lib/apexRank.js, league-v4 y
 * expose la ladder complète et triée) — cette table ne sert alors plus qu'en secours.
 *
 * Région EUW uniquement (c'est ce que publie la source) — utilisée telle quelle même pour
 * un compte configuré sur une autre région (voir constants/riot.js RIOT_REGIONS) : toujours
 * étiquetée "distribution EUW" plutôt que de prétendre à une précision par région qu'on n'a
 * pas mesurée.
 */
export const RANK_DISTRIBUTION_SOURCE = "op.gg, région EUW, 12/09/2026";

const CUMULATIVE_PCT_AT_OR_ABOVE = {
  "Fer|IV": 100,
  "Fer|III": 100,
  "Fer|II": 99,
  "Fer|I": 98,
  "Bronze|IV": 96,
  "Bronze|III": 92,
  "Bronze|II": 88,
  "Bronze|I": 85,
  "Argent|IV": 81,
  "Argent|III": 75,
  "Argent|II": 70,
  "Argent|I": 64,
  "Or|IV": 60,
  "Or|III": 52,
  "Or|II": 45,
  "Or|I": 40,
  "Platine|IV": 36,
  "Platine|III": 28.7,
  "Platine|II": 24.2,
  "Platine|I": 20.4,
  "Émeraude|IV": 17.8,
  "Émeraude|III": 12.6,
  "Émeraude|II": 9.88,
  "Émeraude|I": 7.89,
  "Diamant|IV": 4.87,
  "Diamant|III": 3.38,
  "Diamant|II": 2.75,
  "Diamant|I": 1.62,
  "Maître|null": 0.85,
  "Grand Maître|null": 0.03,
  Challenger: 0.0086,
};

/** `null` si le palier est inconnu de la table (ne devrait pas arriver avec un tier/div
 * valides de l'app) — jamais un chiffre inventé pour combler un trou. */
export function estimatedPercentile(tier, div) {
  if (tier === "Challenger") return CUMULATIVE_PCT_AT_OR_ABOVE.Challenger;
  const key = `${tier}|${div ?? "null"}`;
  return CUMULATIVE_PCT_AT_OR_ABOVE[key] ?? null;
}

/** Précision adaptée à l'ordre de grandeur — "0.0086" n'a aucun sens à afficher tel quel
 * pour un joueur, "45.0" est un faux effort de précision qu'on n'a pas vraiment. */
export function formatPercentile(pct) {
  if (pct < 0.1) return pct.toFixed(3);
  if (pct < 1) return pct.toFixed(2);
  if (pct < 10) return pct.toFixed(1);
  return String(Math.round(pct));
}
