import { FOCUS_METRICS, focusMetricValue, gamesSinceFocusStart } from "./focus.js";
import { computeAgg } from "./stats.js";
import { representativeGames } from "./gameModel.js";
import { uid } from "./format.js";

/** Mêmes métriques que le Point de focus (lib/focus.js) — pas la peine d'en redéfinir un
 * second jeu, un correctif n'est qu'un focus avec une cible chiffrée et un historique. */
export const CORRECTION_METRICS = FOCUS_METRICS;

/** Nombre de games consécutives sur lesquelles une cible doit être tenue pour compter comme
 * "corrigé" — reprend l'ordre de grandeur du GDD ("10 prochaines games"). */
export const VALIDATION_WINDOW = 10;

/** Nouveau correctif : "todo" jusqu'à ce qu'on commence à le travailler (voir
 * startCorrection) — la valeur de départ est déjà connue (moyenne des 20 dernières games
 * représentatives, comme le Point de focus) pour donner un delta dès la création. */
export function newCorrection({ title, cause, action, metricId, targetValue, sorted, settings }) {
  const repSorted = representativeGames(sorted, !!settings.includeExcludedGames);
  const baseline = repSorted.slice(-20);
  const initialValue = baseline.length ? focusMetricValue(computeAgg(baseline), metricId) : 0;
  return {
    id: uid(),
    title: title || "",
    cause: cause || "",
    action: action || "",
    metric: metricId,
    targetValue: Number(targetValue) || 0,
    initialValue,
    createdAt: new Date().toISOString(),
    status: "todo", // todo | in_progress — corrigé/régression sont toujours dérivés, jamais cochés
    startedAt: null,
    startGameId: null,
  };
}

/** Passe un correctif en "en cours" : fige la game de départ, à partir de laquelle les
 * games suivantes compteront pour juger si la cible est tenue. */
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
 * - "in_progress" : la cible n'a encore jamais été tenue sur VALIDATION_WINDOW games d'affilée.
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

export const CORRECTION_STATUS_LABEL = {
  todo: "À travailler",
  in_progress: "En cours",
  corrected: "Corrigé",
  regression: "Régression",
};
