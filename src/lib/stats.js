import { sortByDate } from "./rank.js";
import { gameDate, gameTime } from "./format.js";

export function withinPeriod(game, period, allSorted) {
  if (period === "all" || period === "season") return true;

  const dt = gameDate(game);
  const now = new Date();

  if (period === "today") return dt.toDateString() === now.toDateString();
  if (period === "7d") return now - dt <= 7 * 86400000;
  if (period === "30d") return now - dt <= 30 * 86400000;
  if (period === "50g" || period === "100g") {
    const n = period === "50g" ? 50 : 100;
    return allSorted.slice(-n).some((g) => g.id === game.id);
  }
  return true;
}

export function filterByPeriod(games, period) {
  const sorted = sortByDate(games);
  return sorted.filter((g) => withinPeriod(g, period, sorted));
}

/** Agrégat complet d'un lot de games. Les moyennes « /min » sont pondérées par la durée. */
export function computeAgg(games) {
  const n = games.length;
  const wins = games.filter((g) => g.win).length;
  const sum = (f) => games.reduce((a, g) => a + (Number(f(g)) || 0), 0);

  const durationSum = sum((g) => g.duration) || 1;
  const csSum = sum((g) => g.cs);
  const kills = sum((g) => g.kills);
  const deaths = sum((g) => g.deaths);
  const assists = sum((g) => g.assists);
  const damage = sum((g) => g.damage);
  const gold = sum((g) => g.gold);
  const vision = sum((g) => g.visionScore);

  const bestKDA = games.reduce((best, g) => {
    const k = (Number(g.kills) + Number(g.assists)) / Math.max(1, Number(g.deaths));
    return k > best ? k : best;
  }, 0);

  return {
    games: n,
    wins,
    losses: n - wins,
    wr: n ? (wins / n) * 100 : 0,
    kills: n ? kills / n : 0,
    deaths: n ? deaths / n : 0,
    assists: n ? assists / n : 0,
    kda: deaths ? (kills + assists) / deaths : kills + assists,
    csmin: csSum / durationSum,
    goldmin: gold / durationSum,
    damageGame: n ? damage / n : 0,
    damageMin: damage / durationSum,
    visionGame: n ? vision / n : 0,
    lpSum: sum((g) => g.lpChange),
    maxKills: games.reduce((m, g) => Math.max(m, Number(g.kills) || 0), 0),
    maxDeaths: games.reduce((m, g) => Math.max(m, Number(g.deaths) || 0), 0),
    bestKDA,
  };
}

/** Moyenne mobile « à fenêtre montante » : les premiers points moyennent ce qui existe. */
export function movingAverage(arr, window) {
  return arr.map((_, i) => {
    const slice = arr.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export function groupByChampion(games) {
  const map = {};
  games.forEach((g) => {
    (map[g.champion] ||= []).push(g);
  });
  return Object.entries(map)
    .map(([champion, list]) => ({
      champion,
      ...computeAgg(list),
      lpGained: list.reduce((a, g) => a + (Number(g.lpChange) || 0), 0),
    }))
    .sort((a, b) => b.games - a.games);
}

export function streaksOf(sortedGames) {
  let bestWin = 0;
  let worstLoss = 0;
  let curWin = 0;
  let curLoss = 0;

  sortedGames.forEach((g) => {
    if (g.win) {
      curWin++;
      curLoss = 0;
    } else {
      curLoss++;
      curWin = 0;
    }
    bestWin = Math.max(bestWin, curWin);
    worstLoss = Math.max(worstLoss, curLoss);
  });

  // Série en cours : on remonte depuis la fin tant que le résultat ne change pas.
  let cur = 0;
  let curType = null;
  for (let i = sortedGames.length - 1; i >= 0; i--) {
    const w = sortedGames[i].win;
    if (curType === null) {
      curType = w;
      cur = 1;
    } else if (w === curType) {
      cur++;
    } else break;
  }

  return { bestWin, worstLoss, current: cur, currentType: curType };
}

/** Somme des LP gagnés/perdus depuis un instant donné. */
export function lpSince(sorted, sinceMs) {
  return sorted
    .filter((g) => gameTime(g) >= sinceMs)
    .reduce((a, g) => a + Number(g.lpChange || 0), 0);
}

/** Couleur d'une stat selon les seuils configurés (vert / orange / rouge). */
export function getColor(key, value, thresholds) {
  const t = thresholds[key];
  if (!t || value === undefined || value === null || !isFinite(value)) return "var(--text)";

  if (t.invert) {
    if (value <= t.good) return "var(--win)";
    if (value >= t.bad) return "var(--loss)";
    return "var(--gold)";
  }
  if (value >= t.good) return "var(--win)";
  if (value <= t.bad) return "var(--loss)";
  return "var(--gold)";
}

/** Paliers intermédiaires affichés autour d'un repère de palier. */
export function milestoneSteps(benchmark, invert) {
  const factors = invert ? [1.6, 1.3, 1.0, 0.85] : [0.6, 0.8, 1, 1.15];
  return factors.map((f) => Math.round(benchmark * f * 10) / 10);
}
