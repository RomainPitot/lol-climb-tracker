import { computeAgg } from "./stats.js";

/**
 * Statistiques propres à un rôle — les KPI d'un support n'ont rien à voir avec ceux
 * d'un mid (le CS/min d'un support ne veut à peu près rien dire), donc un panneau par
 * rôle plutôt qu'une grille unique. Quatre rôles couverts : Support, Lanes (Mid/Top),
 * ADC, Jungle (partiel — voir computeJungleStats).
 *
 * Tout est calculé depuis ce qui est déjà stocké (agrégats + timelineSummary) : rien de
 * nouveau à collecter côté Riot. Les métriques qui dépendent de la Timeline (wards,
 * contexte des morts, diffs par intervalle) ne sont remontées que pour les games qui en
 * ont une — le nombre de games réellement couvertes est renvoyé à part, pour l'annoncer
 * plutôt que de faire passer une moyenne sur 3 games pour une moyenne sur 20.
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

/** Répartition solo/teamfight des morts, contextualDeaths inclus — factorisé, réutilisé
 * par Lanes/ADC (Support l'a déjà en ligne dans computeSupportStats ci-dessus). */
function deathSplitOf(games) {
  let teamfightDeaths = 0;
  let soloDeaths = 0;
  for (const g of games) {
    for (const d of g.timelineSummary?.deaths || []) {
      if (d.context === "teamfight") teamfightDeaths++;
      else if (d.context === "solo") soloDeaths++;
    }
  }
  const total = teamfightDeaths + soloDeaths;
  return total >= MIN_DEATHS_FOR_SPLIT
    ? { total, teamfightPct: Math.round((teamfightDeaths / total) * 100), soloPct: Math.round((soloDeaths / total) * 100) }
    : null;
}

/** Moyenne de `diffs[minute].<field>` sur les games qui ont une timeline ET qui ont
 * duré au moins jusqu'à cette minute (sinon la valeur est absente, jamais à zéro — voir
 * riotTimeline.js frameAtOrBefore). Renvoie { value, gamesCovered } ou null si aucune. */
function avgDiffAt(games, minute, field) {
  let sum = 0;
  let n = 0;
  for (const g of games) {
    const d = g.timelineSummary?.diffs?.[minute];
    if (!d || d[field] == null) continue;
    sum += d[field];
    n++;
  }
  return n > 0 ? { value: sum / n, gamesCovered: n } : null;
}

/**
 * Priorité 2 (Mid/Top) — CS/min à 10/15/20 min (agrégé plutôt qu'affiché game par game),
 * deaths early/mid/late, vision/min, dégâts/game, gold diff@15.
 */
export function computeLaneStats(games) {
  if (!games.length) return null;
  const agg = computeAgg(games);

  const csAt = (min) => {
    const r = avgDiffAt(games, min, "cs");
    return r ? { perMin: r.value / min, gamesCovered: r.gamesCovered } : null;
  };
  const goldDiff15 = avgDiffAt(games, 15, "goldDiff");

  let early = 0;
  let mid = 0;
  let late = 0;
  for (const g of games) {
    for (const d of g.timelineSummary?.deaths || []) {
      if (d.phase === "early") early++;
      else if (d.phase === "mid") mid++;
      else if (d.phase === "late") late++;
    }
  }
  const totalPhased = early + mid + late;

  return {
    games: games.length,
    visionMin: agg.visionMin,
    damagePerGame: agg.damageGame,
    csAt10: csAt(10),
    csAt15: csAt(15),
    csAt20: csAt(20),
    goldDiff15,
    deathPhases:
      totalPhased > 0
        ? {
            total: totalPhased,
            earlyPct: Math.round((early / totalPhased) * 100),
            midPct: Math.round((mid / totalPhased) * 100),
            latePct: Math.round((late / totalPhased) * 100),
          }
        : null,
  };
}

/**
 * Priorité 3 (ADC) — CS/min, deaths en teamfight vs isolée (distinction critique pour ce
 * rôle : mourir en teamfight n'a pas la même cause qu'une mort seul en lane/rotation),
 * dégâts/game, vision en secondaire (généralement portée par le support).
 */
export function computeAdcStats(games) {
  if (!games.length) return null;
  const agg = computeAgg(games);
  return {
    games: games.length,
    csmin: agg.csmin,
    damagePerGame: agg.damageGame,
    visionMin: agg.visionMin,
    deathSplit: deathSplitOf(games),
  };
}

/** En dessous, une moyenne de camps/min ne veut rien dire. */
const MIN_GAMES_FOR_JUNGLE_CS = 3;

/**
 * Priorité 4 (Jungle), partiel — voir le commentaire de l'item Cue correspondant :
 * objectifs pris/donnés et deaths en early invade sont fiables (Timeline), le "gank
 * success rate" ne l'est pas (aucun événement Riot ne l'expose) donc n'est PAS calculé
 * ici — voir plutôt le tag manuel "Gank" (constants/coaching.js) affiché à part.
 */
export function computeJungleStats(games) {
  if (!games.length) return null;
  const agg = computeAgg(games);

  // jungleCs n'existe que sur les games importées après son ajout (voir importers.js) —
  // jamais approximé pour les autres, distinguer "pas de données" de "zéro camp".
  const withJungleCs = games.filter((g) => g.jungleCs != null && g.duration > 0);
  const campsPerMin =
    withJungleCs.length >= MIN_GAMES_FOR_JUNGLE_CS
      ? withJungleCs.reduce((a, g) => a + g.jungleCs / g.duration, 0) / withJungleCs.length
      : null;

  let earlyInvadeDeaths = 0;
  let objTaken = 0;
  let objGiven = 0;
  let gamesWithTimeline = 0;
  for (const g of games) {
    const ts = g.timelineSummary;
    if (!ts) continue;
    gamesWithTimeline++;
    for (const d of ts.deaths || []) {
      if (d.zone === "jungle" && d.phase === "early") earlyInvadeDeaths++;
    }
    for (const o of ts.objectives || []) {
      if (o.kind === "TOWER_BUILDING" || o.kind === "INHIBITOR_BUILDING") continue; // objectifs neutres seulement ici.
      if (o.takenByMyTeam) objTaken++;
      else objGiven++;
    }
  }

  // Ganks tagués à la main (voir constants/coaching.js) — seule source fiable pour ce
  // signal, la Timeline Riot n'expose aucun événement "gank".
  let ganksSuccess = 0;
  let ganksTotal = 0;
  for (const g of games) {
    for (const n of g.tacticalNotes || []) {
      if (n.type !== "gank") continue;
      ganksTotal++;
      if (n.value === "Réussi") ganksSuccess++;
    }
  }

  return {
    games: games.length,
    damagePerGame: agg.damageGame,
    campsPerMin,
    jungleCsGamesCovered: withJungleCs.length,
    earlyInvadeDeathsPerGame: gamesWithTimeline ? earlyInvadeDeaths / gamesWithTimeline : null,
    objectives: gamesWithTimeline ? { taken: objTaken, given: objGiven, gamesCovered: gamesWithTimeline } : null,
    ganks: ganksTotal > 0 ? { total: ganksTotal, successPct: Math.round((ganksSuccess / ganksTotal) * 100) } : null,
  };
}
