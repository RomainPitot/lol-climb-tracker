import { representativeGames } from "./gameModel.js";
import { roleBenchmark } from "../constants/ranks.js";
import { evaluateCorrection } from "./corrections.js";

/**
 * Alertes automatiques (voir GDD coaching) : des signaux qui méritent d'être vus tout de
 * suite sur le Dashboard plutôt que découverts en creusant un bilan. Jamais plus de 3 à la
 * fois (voir MAX_ALERTS) — la priorisation par gravité fait le tri plutôt que de tout
 * afficher en même temps.
 */

const RECENT_WINDOW = 5;
const AVOIDABLE_DEATHS_THRESHOLD = 2;
const CSMIN_STREAK_WINDOW = 5;
const VISION_MISS_STREAK = 3;
const MAX_ALERTS = 3;

/** Morts évitables d'une game : compte les morts tagguées "avoidable" si le détail par
 * mort existe (timeline + tagging manuel, voir GameAnalysisModal) — sinon retombe sur
 * l'ancien champ global `avoidableDeaths` (games ajoutées à la main, ou non taguées). */
function avoidableDeathsForGame(g) {
  if (g.timelineSummary && g.deathTags?.length) {
    return g.deathTags.filter((t) => t?.type === "avoidable").length;
  }
  return Number(g.avoidableDeaths) || 0;
}

function avoidableDeathsAlert(repSorted) {
  const recent = repSorted.slice(-RECENT_WINDOW);
  if (recent.length < RECENT_WINDOW) return null;
  const avg = recent.reduce((s, g) => s + avoidableDeathsForGame(g), 0) / recent.length;
  if (avg <= AVOIDABLE_DEATHS_THRESHOLD) return null;
  return {
    id: "avoidable-deaths",
    severity: 3,
    message: `${avg.toFixed(1)} morts évitables/game en moyenne sur les ${RECENT_WINDOW} dernières games (seuil : ${AVOIDABLE_DEATHS_THRESHOLD}).`,
  };
}

function csminStreakAlert(repSorted) {
  const recent = repSorted.slice(-CSMIN_STREAK_WINDOW);
  if (recent.length < CSMIN_STREAK_WINDOW) return null;
  const allBelow = recent.every((g) => {
    if (!g.duration) return false;
    const bench = roleBenchmark(g.rankAfterTier || g.rankBeforeTier, g.role);
    return g.cs / g.duration < bench.csmin;
  });
  if (!allBelow) return null;
  return {
    id: "csmin-streak",
    severity: 2,
    message: `CS/min sous le repère de ton rôle sur les ${CSMIN_STREAK_WINDOW} dernières games d'affilée.`,
  };
}

function correctionRegressionAlerts(data, sorted) {
  return (data.corrections || [])
    .map((c) => evaluateCorrection(c, sorted, data.settings))
    .filter((c) => c.derivedStatus === "regression")
    .map((c) => ({
      id: `correction-regression-${c.id}`,
      severity: 4,
      message: `Régression sur "${c.title}" — retombé après avoir été corrigé (actuel ${c.currentValue?.toFixed(c.def.decimals)}, cible ${c.def.invert ? "≤" : "≥"} ${c.targetValue}).`,
    }));
}

/** Vision avant objectif — approximation (voir riotTimeline.js), jamais un fait certain :
 * les objectifs les plus récents pris par mon équipe sans ward détectée à proximité,
 * en série (pas juste "au moins N sur l'historique", ce qui inclurait des ratés anciens
 * depuis corrigés). */
function visionBeforeObjectiveAlert(repSorted) {
  const flags = [];
  for (const g of repSorted) {
    for (const o of g.timelineSummary?.objectives || []) {
      if (o.takenByMyTeam && o.myTeamHadVisionApprox != null) flags.push(o.myTeamHadVisionApprox);
    }
  }
  let streak = 0;
  for (let i = flags.length - 1; i >= 0 && flags[i] === false; i--) streak++;
  if (streak < VISION_MISS_STREAK) return null;
  return {
    id: "vision-objectives",
    severity: 2,
    message: `${streak} objectifs pris de suite sans vision ≈ posée avant (approximation basée sur les wards actives à proximité).`,
  };
}

export function computeAlerts(data, sorted) {
  const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);

  const alerts = [
    ...correctionRegressionAlerts(data, sorted),
    avoidableDeathsAlert(repSorted),
    csminStreakAlert(repSorted),
    visionBeforeObjectiveAlert(repSorted),
  ].filter(Boolean);

  return alerts.sort((a, b) => b.severity - a.severity).slice(0, MAX_ALERTS);
}
