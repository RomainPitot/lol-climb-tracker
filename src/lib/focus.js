import { computeAgg, movingAverage } from "./stats.js";
import { representativeGames } from "./gameModel.js";

/**
 * Point de focus persistant (voir components/dashboard/FocusTracker.jsx) : la vraie
 * méthode de progression n'est pas de courir après tous les points faibles d'un bilan à
 * la fois, mais d'en choisir UN, de le travailler sur 10-15 games jusqu'à ce que ce soit
 * automatique, puis de passer au suivant. Persisté dans data.settings (focusMetric,
 * focusStartedAt, focusStartGameId, focusStartValue, focusNote) — un seul focus actif à
 * la fois, comme la méthode le demande.
 */
export const FOCUS_METRICS = [
  { id: "csmin", label: "CS/min", invert: false, decimals: 1 },
  { id: "visionmin", label: "Score de vision/min", invert: false, decimals: 2 },
  { id: "kda", label: "KDA", invert: false, decimals: 2 },
  { id: "deaths", label: "Deaths/game", invert: true, decimals: 1 },
  { id: "wr", label: "Winrate (%)", invert: false, decimals: 1 },
];

// computeAgg utilise `visionMin` (camelCase) — seule métrique dont l'id de focus diffère
// du nom du champ d'agrégat.
const AGG_KEY = { csmin: "csmin", visionmin: "visionMin", kda: "kda", deaths: "deaths", wr: "wr" };

function perGameValue(g, metricId) {
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

/** Games jouées depuis le début du focus (dans une liste déjà représentative, triée) —
 * repart de la liste entière si la game de départ a depuis été supprimée ou exclue. */
export function gamesSinceFocusStart(repSorted, startGameId) {
  if (!startGameId) return repSorted;
  const idx = repSorted.findIndex((g) => g.id === startGameId);
  return idx === -1 ? repSorted : repSorted.slice(idx + 1);
}

const TREND_WINDOW = 5;

/** État courant du focus actif d'après les settings, ou null si aucun focus défini. */
export function computeFocus(sorted, settings) {
  const def = FOCUS_METRICS.find((m) => m.id === settings.focusMetric);
  if (!def) return null;

  const repSorted = representativeGames(sorted, !!settings.includeExcludedGames);
  const since = gamesSinceFocusStart(repSorted, settings.focusStartGameId);
  const currentValue = since.length ? focusMetricValue(computeAgg(since), def.id) : settings.focusStartValue;

  const ma = movingAverage(since.map((g) => perGameValue(g, def.id)), TREND_WINDOW);
  const series = since.map((_, i) => ({ i: i + 1, value: ma[i] }));

  return {
    ...def,
    startValue: settings.focusStartValue,
    startedAt: settings.focusStartedAt,
    note: settings.focusNote || "",
    currentValue,
    gamesCount: since.length,
    delta: currentValue - settings.focusStartValue,
    series,
  };
}

/** Patch de settings à appliquer pour démarrer un nouveau focus — la valeur de départ
 * est la moyenne des 20 dernières games représentatives, cohérent avec les autres
 * fenêtres "récentes" déjà utilisées ailleurs dans l'app (bilan de compte, Dashboard). */
export function buildFocusStart(sorted, settings, metricId, note) {
  const repSorted = representativeGames(sorted, !!settings.includeExcludedGames);
  const baseline = repSorted.slice(-20);
  const startValue = baseline.length ? focusMetricValue(computeAgg(baseline), metricId) : 0;
  return {
    focusMetric: metricId,
    focusStartedAt: new Date().toISOString(),
    focusStartGameId: sorted.length ? sorted[sorted.length - 1].id : null,
    focusStartValue: startValue,
    focusNote: note || "",
  };
}

export function clearFocus() {
  return { focusMetric: null, focusStartedAt: null, focusStartGameId: null, focusStartValue: null, focusNote: "" };
}
