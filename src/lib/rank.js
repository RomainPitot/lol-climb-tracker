import { TIERS, APEX, DIV_NUM, FULL_LADDER, LADDER } from "../constants/ranks.js";
import { gameTime } from "./format.js";

/** Valeur ordonnable d'un rang : les paliers apex passent au-dessus de tout le reste. */
export function rankValue(tier, div) {
  const ai = APEX.indexOf(tier);
  if (ai >= 0) return 1000 + ai;
  const ti = TIERS.indexOf(tier);
  if (ti < 0) return 0;
  return ti * 4 + (DIV_NUM[div] || 1);
}

export function rankLabel(tier, div) {
  if (!tier) return "—";
  return APEX.includes(tier) ? tier : `${tier} ${div || ""}`.trim();
}

/** Index dans LADDER (barre de progression) du palier atteint. */
export function ladderIndex(tier, div) {
  const v = rankValue(tier, div);
  let idx = 0;
  LADDER.forEach((s, i) => {
    if (rankValue(s.tier, s.div) <= v) idx = i;
  });
  return Math.max(0, Math.min(LADDER.length - 1, idx));
}

/**
 * Applique un gain/perte de LP à un rang, en gérant les promotions et rétrogradations.
 * Modèle simplifié : pas de série de promotion ni de protection contre la descente.
 */
export function applyLpChange(rank, delta) {
  const d = Number(delta) || 0;
  if (APEX.includes(rank.tier)) {
    return { tier: rank.tier, div: null, lp: Math.max(0, Math.round((Number(rank.lp) || 0) + d)) };
  }

  let idx = FULL_LADDER.findIndex((s) => s.tier === rank.tier && s.div === rank.div);
  if (idx === -1) idx = TIERS.indexOf("Émeraude") * 4 + 1;

  let lp = (Number(rank.lp) || 0) + d;

  while (lp >= 100 && idx < FULL_LADDER.length - 1) {
    lp -= 100;
    idx++;
  }
  // Dépasser Diamant I fait basculer en Maître, où les LP ne sont plus bornés à 100.
  if (lp >= 100 && idx === FULL_LADDER.length - 1) {
    return { tier: "Maître", div: null, lp: Math.max(0, Math.round(lp - 100)) };
  }
  while (lp < 0 && idx > 0) {
    lp += 100;
    idx--;
  }

  lp = Math.max(0, Math.min(99, Math.round(lp)));
  return { tier: FULL_LADDER[idx].tier, div: FULL_LADDER[idx].div, lp };
}

export function sortByDate(games) {
  return [...games].sort((a, b) => gameTime(a) - gameTime(b));
}

/** Le rang courant est celui laissé par la dernière game trackée, sinon l'historique saisi. */
export function recomputeCurrentRank(games, historical) {
  if (!games.length) {
    return { tier: historical.global.tier, div: historical.global.div, lp: historical.global.lp };
  }
  const latest = sortByDate(games).at(-1);
  return {
    tier: latest.rankAfterTier,
    div: latest.rankAfterDiv,
    lp: Number(latest.lpAfter) || 0,
  };
}

/** Meilleur rang atteint sur l'ensemble des games trackées. */
export function bestRankOf(sorted, fallback) {
  if (!sorted.length) return fallback;
  return sorted.reduce(
    (best, g) =>
      rankValue(g.rankAfterTier, g.rankAfterDiv) > rankValue(best.tier, best.div)
        ? { tier: g.rankAfterTier, div: g.rankAfterDiv }
        : best,
    { tier: sorted[0].rankAfterTier, div: sorted[0].rankAfterDiv }
  );
}

/** Palier visé, déduit des objectifs « atteindre un rang » définis par l'utilisateur. */
export function objectiveTierOf(goals) {
  const rankGoals = (goals || []).filter((g) => g.type === "reach_rank" && g.tier);
  if (!rankGoals.length) return "Diamant";
  return rankGoals.reduce(
    (best, g) => (rankValue(g.tier, g.div) > rankValue(best, "I") ? g.tier : best),
    rankGoals[0].tier
  );
}
