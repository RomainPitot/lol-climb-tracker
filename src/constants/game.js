export const ROLES = ["Top", "Jungle", "Mid", "ADC", "Support"];
export const ROLE_STATUS = ["Rôle principal", "Rôle secondaire", "Autofill"];
export const SIDES = [
  { v: "Blue", l: "Bleu" },
  { v: "Red", l: "Rouge" },
];

export const DEATH_CAUSES = [
  "Erreur mécanique",
  "Mauvais positionnement",
  "Greed",
  "Mauvais tracking jungle",
  "Mauvais calcul de matchup",
  "Fight inutile",
  "Side lane",
  "Teamfight",
  "Mort nécessaire",
  "Autre",
];

export const PERIODS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "50g", label: "50 games" },
  { id: "100g", label: "100 games" },
  { id: "season", label: "Saison" },
  { id: "all", label: "Tout" },
];

export const GOAL_TYPES = [
  { id: "reach_rank", label: "Atteindre un rang" },
  { id: "wr_champion", label: "Maintenir un WR sur un champion" },
  { id: "deaths_below", label: "Descendre sous un nombre de morts/game" },
  { id: "csmin_above", label: "Atteindre un CS/min cible" },
  { id: "kda_above", label: "Maintenir un KDA cible" },
  { id: "kills_above", label: "Atteindre un nombre de kills/game cible" },
  { id: "games_without_champion", label: "Faire N games sans jouer un champion" },
  { id: "games_champion", label: "Faire N games sur un champion" },
];

/** Écart max entre deux games pour qu'elles appartiennent à la même session. */
export const SESSION_GAP_MS = 3 * 3600000;

export const DEFAULT_HISTORICAL = {
  yone: { games: 112, wins: 68, losses: 44, kills: 9.2, deaths: 9.2, assists: 5.1, lp: 708, maxKills: 26, maxDeaths: 18, cs: 213.8, damage: 35598, gold: 13782, doubles: 91, triples: 9, quadras: 2, pentas: 0 },
  tahm: { games: 42, wins: 25, losses: 17, kills: 6.7, deaths: 8.1, assists: 8, lp: 322, maxKills: 17, maxDeaths: 17, cs: 98.5, damage: 25432, gold: 10877, doubles: 21, triples: 3, quadras: 0, pentas: 0 },
  global: { games: 253, wins: 134, losses: 119, tier: "Émeraude", div: "III", lp: 18 },
};

export const DEFAULT_THRESHOLDS = {
  wr: { good: 55, bad: 45, invert: false, label: "Winrate (%)" },
  kda: { good: 3, bad: 2, invert: false, label: "KDA" },
  csmin: { good: 7, bad: 5.5, invert: false, label: "CS/min" },
  deaths: { good: 5, bad: 7, invert: true, label: "Deaths/game" },
};
