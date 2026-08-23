import { Shield, Award, Gem, Crown, Star } from "lucide-react";

export const TIERS = ["Fer", "Bronze", "Argent", "Or", "Platine", "Émeraude", "Diamant"];
export const APEX = ["Maître", "Grand Maître", "Challenger"];
export const DIVS = ["IV", "III", "II", "I"];
export const DIV_NUM = { IV: 1, III: 2, II: 3, I: 4 };

/** Toutes les divisions Fer IV → Diamant I, dans l'ordre croissant. */
export const FULL_LADDER = TIERS.flatMap((tier) => DIVS.map((div) => ({ tier, div })));

/** Sous-ensemble affiché dans la barre de progression du dashboard. */
export const LADDER = [
  { tier: "Émeraude", div: "IV" },
  { tier: "Émeraude", div: "III" },
  { tier: "Émeraude", div: "II" },
  { tier: "Émeraude", div: "I" },
  { tier: "Diamant", div: "IV" },
  { tier: "Diamant", div: "III" },
  { tier: "Diamant", div: "II" },
  { tier: "Diamant", div: "I" },
  { tier: "Maître", div: null },
];

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
