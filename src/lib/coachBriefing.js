import { buildAutoCoachReport } from "./autoCoach.js";
import { computeAlerts } from "./alerts.js";
import { computePriorities } from "./priorities.js";
import { computeNegativeStreakAlert } from "./streakAlert.js";
import { findUntaggedDeathGames } from "./untaggedGames.js";
import { representativeGames } from "./gameModel.js";

/** Jamais plus de 3 choses à corriger affichées d'un coup — au-delà, plus personne ne
 * priorise vraiment (même règle que le GDD pour les alertes et le bandeau de priorités,
 * appliquée cette fois à l'ensemble fusionné). */
const MAX_TO_FIX = 3;
const MAX_STRENGTHS = 2;

/** Alertes/priorités qui parlent en fait de la même métrique qu'un point faible du coach —
 * on ne garde que la version du coach (verdict + raison + action), la plus utile. */
const ID_TO_METRIC = {
  "csmin-streak": "csmin",
  "weak-csmin": "csmin",
  "weak-visionmin": "visionMin",
  "weak-kda": "kda",
  "weak-deaths": "deaths",
  "avoidable-deaths": "deaths",
};

/**
 * Briefing unique du Dashboard : fusionne ce qui était éclaté en cinq cartes empilées
 * (coach automatique, alertes, priorités, série de défaites, morts non classées) en une
 * seule liste priorisée et dédoublonnée. Les mêmes signaux disaient souvent la même chose
 * deux fois ("KDA en retrait" côté priorités ET côté points faibles) : ici, une métrique
 * n'apparaît qu'une fois, dans sa formulation la plus actionnable.
 */
export function buildCoachBriefing(data, sorted, currentRank) {
  const report = buildAutoCoachReport(data, sorted, currentRank);
  if (!report) return null;

  const alerts = computeAlerts(data, sorted);
  const priorities = computePriorities(data, sorted, currentRank);

  const toFix = [];
  const seenMetrics = new Set();

  // 1. Les alertes qui ne doublonnent pas une métrique du coach passent en premier : ce
  // sont des seuils franchis, pas des tendances (régression d'un correctif, vision...).
  for (const a of alerts) {
    const metric = ID_TO_METRIC[a.id];
    if (metric) continue; // traité via les points faibles du coach, plus détaillés
    toFix.push({ id: a.id, text: a.message, severity: a.severity ?? 3, tone: "loss" });
  }

  // 2. Les points faibles du coach (verdict + raison + action), du plus gros écart au plus petit.
  const weaknesses = [...report.weaknesses].sort((a, b) => a.gapPct - b.gapPct);
  for (const w of weaknesses) {
    seenMetrics.add(w.key);
    toFix.push({ id: `weak-${w.key}`, text: w.text, severity: 2, tone: "loss" });
  }

  // 3. Les priorités restantes (correctifs pas démarrés, etc.) seulement si elles
  // n'évoquent pas une métrique déjà couverte ci-dessus.
  for (const p of priorities) {
    const metric = ID_TO_METRIC[p.id];
    if (metric && seenMetrics.has(metric)) continue;
    if (toFix.some((t) => t.id === p.id)) continue;
    toFix.push({ id: p.id, text: p.message, severity: p.severity ?? 1, tone: "gold" });
  }

  const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);
  const streak = computeNegativeStreakAlert(data, sorted);
  const untaggedGames = findUntaggedDeathGames(repSorted);

  return {
    lastGame: report.game,
    personalSignal: report.personalSignal,
    toFix: toFix.sort((a, b) => b.severity - a.severity).slice(0, MAX_TO_FIX),
    hiddenCount: Math.max(0, toFix.length - MAX_TO_FIX),
    strengths: report.strengths.slice(0, MAX_STRENGTHS),
    focus: report.focus,
    streak,
    untaggedGames,
    sampleSize: report.sampleSize,
  };
}
