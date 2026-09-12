/**
 * Métriques de progression partagées — utilisées par lib/corrections.js, seul système de
 * suivi désormais (voir ce fichier : un correctif SANS cible chiffrée est exactement
 * l'ancien "Point de focus", un correctif AVEC cible est ce qu'on appelait "Correctif" —
 * une seule donnée, `data.corrections`, plutôt que deux systèmes qui ne se parlaient pas
 * (settings.focusMetric d'un côté, data.corrections de l'autre).
 */
export const FOCUS_METRICS = [
  { id: "csmin", label: "CS/min", invert: false, decimals: 1 },
  { id: "visionmin", label: "Score de vision/min", invert: false, decimals: 2 },
  { id: "kda", label: "KDA", invert: false, decimals: 2 },
  { id: "deaths", label: "Deaths/game", invert: true, decimals: 1 },
  { id: "wr", label: "Winrate (%)", invert: false, decimals: 1 },
];

// computeAgg utilise `visionMin` (camelCase) — seule métrique dont l'id diffère du nom du
// champ d'agrégat.
const AGG_KEY = { csmin: "csmin", visionmin: "visionMin", kda: "kda", deaths: "deaths", wr: "wr" };

/** Valeur d'UNE game pour cette métrique — utilisé pour le graphe de tendance (moyenne
 * mobile), contrairement à focusMetricValue qui agrège plusieurs games. */
export function perGameValue(g, metricId) {
  switch (metricId) {
    case "csmin":
      return g.duration ? Number(g.cs) / Number(g.duration) : 0;
    case "visionmin":
      return g.duration ? Number(g.visionScore) / Number(g.duration) : 0;
    case "kda": {
      const deaths = Number(g.deaths) || 0;
      return (Number(g.kills) + Number(g.assists)) / Math.max(1, deaths);
    }
    case "deaths":
      return Number(g.deaths) || 0;
    case "wr":
      return g.win ? 100 : 0;
    default:
      return 0;
  }
}

export function focusMetricValue(agg, metricId) {
  return agg[AGG_KEY[metricId]] ?? 0;
}

/** Games jouées depuis le début d'un correctif (dans une liste déjà représentative,
 * triée) — repart de la liste entière si la game de départ a depuis été supprimée ou
 * exclue. */
export function gamesSinceFocusStart(repSorted, startGameId) {
  if (!startGameId) return repSorted;
  const idx = repSorted.findIndex((g) => g.id === startGameId);
  return idx === -1 ? repSorted : repSorted.slice(idx + 1);
}
