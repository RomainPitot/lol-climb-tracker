import { FOCUS_METRICS, focusMetricValue, gamesSinceFocusStart, perGameValue } from "./focus.js";
import { computeAgg, movingAverage } from "./stats.js";
import { representativeGames } from "./gameModel.js";
import { uid } from "./format.js";

/** Mêmes métriques partout (voir lib/focus.js). */
export const CORRECTION_METRICS = FOCUS_METRICS;

/** Nombre de games consécutives sur lesquelles une cible doit être tenue pour compter comme
 * "corrigé" — reprend l'ordre de grandeur du GDD ("10 prochaines games"). Ne s'applique
 * qu'aux correctifs AVEC cible chiffrée (voir evaluateCorrection). */
export const VALIDATION_WINDOW = 10;

/** Fenêtre de la moyenne mobile affichée dans le graphe de tendance (correctionSeries) —
 * même ordre de grandeur que l'ancien Point de focus. */
const TREND_WINDOW = 5;

/**
 * Nouveau correctif : "todo" jusqu'à ce qu'on commence à le travailler (voir
 * startCorrection) — la valeur de départ est déjà connue (moyenne des 20 dernières games
 * représentatives) pour donner un delta dès la création.
 *
 * `targetValue` est OPTIONNEL : sans cible chiffrée, c'est un suivi de tendance pur
 * (l'ancien "Point de focus" — une seule chose à la fois, sans objectif précis, juste
 * regarder si ça s'améliore). Avec une cible, "corrigé"/"régression" deviennent calculables
 * (voir evaluateCorrection). Les deux vivent dans le même tableau `data.corrections` — un
 * seul système plutôt que deux qui ne se parlaient pas.
 */
export function newCorrection({ title, cause, action, metricId, targetValue, sorted, settings }) {
  const repSorted = representativeGames(sorted, !!settings.includeExcludedGames);
  const baseline = repSorted.slice(-20);
  const initialValue = baseline.length ? focusMetricValue(computeAgg(baseline), metricId) : 0;
  const hasTarget = targetValue !== "" && targetValue != null;
  return {
    id: uid(),
    title: title || "",
    cause: cause || "",
    action: action || "",
    metric: metricId,
    targetValue: hasTarget ? Number(targetValue) : null,
    initialValue,
    createdAt: new Date().toISOString(),
    status: "todo", // todo | in_progress — corrigé/régression sont toujours dérivés, jamais cochés
    startedAt: null,
    startGameId: null,
  };
}

/** Passe un correctif en "en cours" : fige la game de départ, à partir de laquelle les
 * games suivantes compteront pour juger si la cible est tenue (ou simplement pour tracer
 * la tendance, sans cible). */
export function startCorrection(correction, sorted) {
  return {
    ...correction,
    status: "in_progress",
    startedAt: new Date().toISOString(),
    startGameId: sorted.length ? sorted[sorted.length - 1].id : null,
  };
}

function meetsTarget(value, def, target) {
  return def.invert ? value <= target : value >= target;
}

/**
 * État réel d'un correctif "en cours", calculé depuis les games jouées après son départ —
 * jamais stocké, toujours recalculé, pour qu'une régression ne puisse pas rester cachée
 * derrière un statut coché une fois pour toutes :
 * - "in_progress" : la cible n'a encore jamais été tenue sur VALIDATION_WINDOW games d'affilée
 *   (ou : pas de cible du tout — un suivi de tendance pur reste toujours "in_progress",
 *   "corrigé"/"régression" n'ont de sens que face à un objectif chiffré).
 * - "corrected" : elle l'a déjà été à un moment, ET elle l'est encore sur les dernières games.
 * - "regression" : elle l'a déjà été à un moment, mais ne l'est plus maintenant — exactement
 *   l'exemple du GDD ("0,6 → corrigé, puis retour à 2,1 → régression").
 */
export function evaluateCorrection(correction, sorted, settings) {
  const def = CORRECTION_METRICS.find((m) => m.id === correction.metric);
  if (!def || correction.status === "todo") {
    return { ...correction, derivedStatus: correction.status, def, currentValue: null, gamesCount: 0 };
  }

  const repSorted = representativeGames(sorted, !!settings.includeExcludedGames);
  const since = gamesSinceFocusStart(repSorted, correction.startGameId);

  if (!since.length) {
    return { ...correction, derivedStatus: "in_progress", def, currentValue: null, gamesCount: 0 };
  }

  // Sans cible chiffrée : suivi de tendance pur (ex-Point de focus). "Corrigé"/"régression"
  // n'ont pas de sens sans objectif à comparer — juste la valeur courante, sur tout
  // l'historique depuis le départ plutôt qu'une fenêtre glissante de validation.
  if (correction.targetValue == null) {
    const currentValue = focusMetricValue(computeAgg(since), def.id);
    return { ...correction, derivedStatus: "in_progress", def, currentValue, gamesCount: since.length };
  }

  const windowSize = Math.min(VALIDATION_WINDOW, since.length);

  let hasEverMet = false;
  for (let end = windowSize; end <= since.length; end++) {
    const chunk = since.slice(end - windowSize, end);
    if (meetsTarget(focusMetricValue(computeAgg(chunk), def.id), def, correction.targetValue)) {
      hasEverMet = true;
      break;
    }
  }

  const trailing = since.slice(-windowSize);
  const currentValue = focusMetricValue(computeAgg(trailing), def.id);
  const currentlyMet = meetsTarget(currentValue, def, correction.targetValue);

  const derivedStatus = !hasEverMet ? "in_progress" : currentlyMet ? "corrected" : "regression";

  return {
    ...correction,
    derivedStatus,
    def,
    currentValue,
    gamesCount: since.length,
    windowSize,
    windowFull: since.length >= VALIDATION_WINDOW,
  };
}

/** Série pour le graphe de tendance (moyenne mobile depuis le départ du correctif) —
 * même logique que l'ancien Point de focus, généralisée à n'importe quel correctif
 * "in_progress", avec ou sans cible chiffrée. */
export function correctionSeries(correction, sorted, settings) {
  const def = CORRECTION_METRICS.find((m) => m.id === correction.metric);
  if (!def || correction.status === "todo") return [];
  const repSorted = representativeGames(sorted, !!settings.includeExcludedGames);
  const since = gamesSinceFocusStart(repSorted, correction.startGameId);
  const ma = movingAverage(since.map((g) => perGameValue(g, def.id)), TREND_WINDOW);
  return since.map((_, i) => ({ i: i + 1, value: ma[i] }));
}

/**
 * Le correctif "en cours" à mettre en avant sur le Dashboard (widget principal, à la place
 * de l'ancien Point de focus) — le plus récemment démarré parmi ceux "in_progress". On peut
 * avoir plusieurs correctifs actifs (voir CorrectionsPanel, Coach IA), mais un seul mérite
 * la vedette du Dashboard à la fois — cohérent avec le principe "une chose à la fois" qui
 * motivait l'ancien Point de focus. Renvoie déjà évalué (currentValue, derivedStatus...),
 * prêt à afficher.
 */
export function primaryActiveCorrection(data, sorted) {
  const inProgress = (data.corrections || [])
    .filter((c) => c.status === "in_progress")
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  if (!inProgress.length) return null;
  return evaluateCorrection(inProgress[0], sorted, data.settings);
}

export const CORRECTION_STATUS_LABEL = {
  todo: "À travailler",
  in_progress: "En cours",
  corrected: "Corrigé",
  regression: "Régression",
};
