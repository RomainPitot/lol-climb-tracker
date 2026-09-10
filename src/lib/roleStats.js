import { computeAgg } from "./stats.js";

/**
 * Statistiques propres à un rôle — les KPI d'un support n'ont rien à voir avec ceux
 * d'un mid (le CS/min d'un support ne veut à peu près rien dire), donc un panneau par
 * rôle plutôt qu'une grille unique. Premier rôle couvert : Support.
 *
 * Tout est calculé depuis ce qui est déjà stocké (agrégats + timelineSummary) : rien de
 * nouveau à collecter côté Riot. Les métriques qui dépendent de la Timeline (wards,
 * contexte des morts) ne sont remontées que pour les games qui en ont une — le nombre de
 * games réellement couvertes est renvoyé à part, pour l'annoncer plutôt que de faire
 * passer une moyenne sur 3 games pour une moyenne sur 20.
 */

/** En dessous, une répartition (morts en teamfight vs isolées) n'est pas exploitable. */
const MIN_DEATHS_FOR_SPLIT = 6;

export function computeSupportStats(games) {
  if (!games.length) return null;

  const agg = computeAgg(games);

  let placed = 0;
  let destroyed = 0;
  let controlBought = 0;
  let gamesWithWards = 0;
  for (const g of games) {
    const w = g.timelineSummary?.wards;
    if (!w) continue;
    gamesWithWards++;
    placed += w.placed || 0;
    destroyed += w.destroyed || 0;
    controlBought += w.controlWardsBought || 0;
  }

  // Mort en teamfight = engagée dans un combat groupé (le cas normal pour un support
  // qui engage ou qui peel) ; mort isolée = prise seule, en rotation ou en warding.
  // Approximation assumée (voir riotTimeline.js classifyDeathContext), jamais un fait Riot.
  let teamfightDeaths = 0;
  let soloDeaths = 0;
  for (const g of games) {
    for (const d of g.timelineSummary?.deaths || []) {
      if (d.context === "teamfight") teamfightDeaths++;
      else if (d.context === "solo") soloDeaths++;
    }
  }
  const contextualDeaths = teamfightDeaths + soloDeaths;

  return {
    games: games.length,
    visionMin: agg.visionMin,
    assistsPerGame: agg.assists,
    deathsPerGame: agg.deaths,
    damagePerGame: agg.damageGame,
    wards: gamesWithWards
      ? {
          gamesCovered: gamesWithWards,
          placedPerGame: placed / gamesWithWards,
          destroyedPerGame: destroyed / gamesWithWards,
          controlPerGame: controlBought / gamesWithWards,
          // Un score de vision bas cache deux problèmes opposés : "je ne warde pas" ou
          // "je warde mais l'adversaire nettoie" — ce ratio sépare les deux.
          clearRatio: placed > 0 ? destroyed / placed : null,
        }
      : null,
    deathSplit:
      contextualDeaths >= MIN_DEATHS_FOR_SPLIT
        ? {
            total: contextualDeaths,
            teamfightPct: Math.round((teamfightDeaths / contextualDeaths) * 100),
            soloPct: Math.round((soloDeaths / contextualDeaths) * 100),
          }
        : null,
  };
}
