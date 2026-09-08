import { Shield, Award, Gem, Crown, Star } from "lucide-react";

export const TIERS = ["Fer", "Bronze", "Argent", "Or", "Platine", "Émeraude", "Diamant"];
export const APEX = ["Maître", "Grand Maître", "Challenger"];
export const DIVS = ["IV", "III", "II", "I"];
export const DIV_NUM = { IV: 1, III: 2, II: 3, I: 4 };

/** Toutes les divisions Fer IV → Diamant I, dans l'ordre croissant. */
export const FULL_LADDER = TIERS.flatMap((tier) => DIVS.map((div) => ({ tier, div })));

/** Ladder complète affichée sur le dashboard : tous les paliers du jeu, Fer IV → Challenger
 * (les paliers apex n'ont pas de division — un seul palier LP continu chacun). */
export const FULL_GAME_LADDER = [...FULL_LADDER, ...APEX.map((tier) => ({ tier, div: null }))];

export const TIER_COLORS = {
  Fer: "#8B8D92",
  Bronze: "#A9754F",
  Argent: "#B9C1CC",
  Or: "#E3B341",
  Platine: "#2DD4BF",
  Émeraude: "#0FD68A",
  Diamant: "#5AC8FA",
  Maître: "#C77DFF",
  "Grand Maître": "#FF6B6B",
  Challenger: "#FFD166",
};

export const TIER_ICON = {
  Fer: Shield,
  Bronze: Shield,
  Argent: Shield,
  Or: Award,
  Platine: Award,
  Émeraude: Gem,
  Diamant: Gem,
  Maître: Crown,
  "Grand Maître": Crown,
  Challenger: Star,
};

/**
 * Repères indicatifs par palier (estimations générales, pas de données temps réel).
 * Sert uniquement à afficher des paliers de progression, jamais à juger une game isolée.
 * Repères "laner" de référence (Top/Mid/ADC) — voir ROLE_CSMIN_FACTOR/roleBenchmark
 * ci-dessous pour l'ajustement par rôle (Jungle/Support farment structurellement moins).
 */
export const BENCHMARKS = {
  Fer: { csmin: 3.5, kda: 1.5, deaths: 8.5, wr: 50 },
  Bronze: { csmin: 4.2, kda: 1.8, deaths: 8.0, wr: 50 },
  Argent: { csmin: 5.0, kda: 2.0, deaths: 7.5, wr: 50 },
  Or: { csmin: 5.7, kda: 2.2, deaths: 7.0, wr: 50 },
  Platine: { csmin: 6.3, kda: 2.5, deaths: 6.5, wr: 50 },
  Émeraude: { csmin: 7.0, kda: 2.8, deaths: 6.0, wr: 50 },
  Diamant: { csmin: 7.6, kda: 3.2, deaths: 5.5, wr: 50 },
  Maître: { csmin: 8.2, kda: 3.6, deaths: 5.0, wr: 50 },
  "Grand Maître": { csmin: 8.2, kda: 3.6, deaths: 5.0, wr: 50 },
  Challenger: { csmin: 8.2, kda: 3.6, deaths: 5.0, wr: 50 },
};

/**
 * Facteurs multiplicatifs appliqués aux repères "laner" ci-dessus (CS/min) et à
 * VISION_BASE_TARGET (vision/min) — sans ça, un support comparé au même repère qu'un ADC
 * ressort toujours "mauvais" sur des métriques qui ne mesurent structurellement pas la
 * même chose pour lui (le support ne farme quasiment pas, mais pose l'essentiel de la
 * vision). KDA/deaths restent partagés entre rôles pour l'instant — différenciation
 * jugée secondaire et plus incertaine à chiffrer correctement.
 */
export const ROLE_CSMIN_FACTOR = { Top: 1, Mid: 1, ADC: 1, Jungle: 0.68, Support: 0.12 };
export const ROLE_VISIONMIN_FACTOR = { Top: 1, Mid: 1.05, ADC: 0.85, Jungle: 1.8, Support: 3.2 };

/** Vision/min cible pour un rôle de référence (Top), tous tiers confondus — la vision
 * dépend surtout de la discipline/du rôle, beaucoup moins du rang que le CS/min. */
export const VISION_BASE_TARGET = 0.5;

/** Repère CS/min + vision/min pour un tier et un rôle donnés, dérivé de BENCHMARKS via
 * les facteurs ci-dessus. `role` absent ou inconnu -> pas d'ajustement (repère laner). */
export function roleBenchmark(tier, role) {
  const base = BENCHMARKS[tier] || BENCHMARKS.Diamant;
  const csFactor = ROLE_CSMIN_FACTOR[role] ?? 1;
  const visFactor = ROLE_VISIONMIN_FACTOR[role] ?? 1;
  return { ...base, csmin: base.csmin * csFactor, visionmin: VISION_BASE_TARGET * visFactor };
}
