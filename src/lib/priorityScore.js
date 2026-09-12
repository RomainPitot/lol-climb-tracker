import { perGameValue } from "./focus.js";

/** Fenêtre récente pour juger si un point s'aggrave ou s'améliore — même ordre de
 * grandeur que les autres fenêtres "court terme" de l'app. */
const RECENT_WINDOW = 5;
/** Fenêtre de référence juste avant la fenêtre récente, pour comparer. */
const BASELINE_WINDOW = 10;
/** Combien de games récentes examiner pour juger si un problème est systématique ou un
 * accident isolé (voir frequencyWeight). */
const FREQUENCY_WINDOW = 10;

/**
 * Score unique de priorité — remplace les sévérités arbitraires (1 à 4) posées à la main
 * dans alerts.js/priorities.js, chacune sur sa propre échelle non comparable aux autres.
 * Combine :
 * - l'écart (gapPct, déjà calculé ailleurs — le plus fort entre repère de rang et
 *   différentiel victoire/défaite, jamais recalculé ici) ;
 * - un poids de TENDANCE (trendWeight) : ce point s'aggrave-t-il récemment ?
 * - un poids de FRÉQUENCE (frequencyWeight) : est-ce systématique ou un accident isolé ?
 * Le produit des trois donne un score comparable entre n'importe quelle métrique, sur
 * n'importe quelle fenêtre — contrairement à des sévérités entières posées au jugé.
 */
export function computeScore(gapPct, trend, freq) {
  return Math.max(0, gapPct) * trend * freq;
}

/**
 * >1 si ce point s'aggrave sur les RECENT_WINDOW dernières games par rapport aux
 * BASELINE_WINDOW précédentes, <1 s'il s'améliore. Neutre (1) si pas assez de games des
 * deux côtés pour juger une tendance sur un échantillon trop court — jamais une tendance
 * inventée sur trop peu de données.
 */
export function trendWeight(games, metricId, invert) {
  if (games.length < RECENT_WINDOW + BASELINE_WINDOW) return 1;
  const recent = games.slice(-RECENT_WINDOW);
  const baseline = games.slice(-(RECENT_WINDOW + BASELINE_WINDOW), -RECENT_WINDOW);
  const avg = (list) => list.reduce((a, g) => a + perGameValue(g, metricId), 0) / list.length;
  const recentAvg = avg(recent);
  const baselineAvg = avg(baseline);
  // > 0 veut toujours dire "ça s'aggrave", peu importe le sens naturel de la métrique.
  const diff = invert ? recentAvg - baselineAvg : baselineAvg - recentAvg;
  const ref = Math.max(Math.abs(baselineAvg), 0.01);
  const relChange = diff / ref;
  // Aggravation → jusqu'à 1.4x plus prioritaire ; amélioration → jusqu'à 0.7x moins
  // prioritaire, jamais masqué entièrement (une tendance favorable ne suffit pas à
  // effacer un problème par ailleurs réel et mesuré).
  return Math.min(1.4, Math.max(0.7, 1 + relChange));
}

/**
 * Combien des FREQUENCY_WINDOW dernières games échouent INDIVIDUELLEMENT sur cette
 * métrique (vs la cible), pas seulement en moyenne — une moyenne mauvaise tirée par 2
 * games catastrophiques sur 10 n'est pas le même problème qu'une moyenne mauvaise parce
 * que la cible n'est JAMAIS tenue. Le second cas est plus prioritaire : plus fiable
 * (systématique, pas un accident) et plus facile à corriger (un pattern, pas un hasard).
 */
export function frequencyWeight(games, metricId, invert, target) {
  if (!games.length || !target) return 1;
  const recent = games.slice(-FREQUENCY_WINDOW);
  const failing = recent.filter((g) => {
    const v = perGameValue(g, metricId);
    return invert ? v > target : v < target;
  }).length;
  const ratio = failing / recent.length;
  // 0.8x (occasionnel) à 1.2x (quasi systématique).
  return 0.8 + 0.4 * ratio;
}
