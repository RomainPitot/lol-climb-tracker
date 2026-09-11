import { sortByDate } from "./rank.js";
import { gameDate, gameTime } from "./format.js";
import { roleBenchmark } from "../constants/ranks.js";

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
    // Le score de vision brut par game n'est pas comparable entre une game de 20 min et
    // une de 40 min — visionMin (pondéré par la durée, comme csmin) est la valeur à
    // utiliser pour toute comparaison/tendance ; visionGame reste dispo pour l'affichage
    // brut d'une game isolée.
    visionMin: vision / durationSum,
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

/** Rôle le plus joué d'un lot de games — sert à choisir un repère CS/min et vision
 * quand l'agrégat mélange plusieurs rôles (ex : progression du Dashboard sur les
 * dernières games, potentiellement multi-rôles). `null` si le lot est vide. */
export function mostFrequentRole(games) {
  if (!games.length) return null;
  const counts = {};
  for (const g of games) counts[g.role] = (counts[g.role] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/** Rôle le plus fréquent observé pour UN champion précis — remplace l'ancienne table
 * CHAMP_ROLE codée en dur (14 champions) : déduit du vrai historique de jeu, valable
 * pour n'importe quel champion réellement joué, jamais deviné pour un champion jamais
 * joué (retourne null plutôt qu'un rôle par défaut arbitraire). */
export function roleForChampion(games, champion) {
  return mostFrequentRole(games.filter((g) => g.champion === champion));
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

/** Marge (en % du repère) pour les bandes vert/orange/rouge — plus de réglage manuel
 * (retiré des Paramètres) : la couleur suit automatiquement le même repère de rôle/rang
 * que le Coach automatique et les benchmarks affichés partout ailleurs dans l'app. */
const BAND_PCT = 0.12;
const INVERT_KEYS = new Set(["deaths"]);

/** Couleur d'une stat (vert/orange/rouge) dérivée du repère de rôle/rang — `tier` le rang
 * (actuel ou objectif selon l'appelant) et `role` (optionnel, ajuste csmin/visionmin, voir
 * roleBenchmark) plutôt qu'un seuil réglé à la main. */
export function getColor(key, value, tier, role) {
  if (value === undefined || value === null || !isFinite(value)) return "var(--text)";
  const bench = roleBenchmark(tier, role);
  const target = bench[key];
  if (target == null) return "var(--text)";

  if (key === "wr") {
    // Le winrate ne dépend pas du rôle et une bande en % de 50 serait dérisoire — marge
    // absolue plutôt que relative.
    if (value >= target + 5) return "var(--win)";
    if (value <= target - 5) return "var(--loss)";
    return "var(--gold)";
  }

  const invert = INVERT_KEYS.has(key);
  const good = invert ? target * (1 - BAND_PCT) : target * (1 + BAND_PCT);
  const bad = invert ? target * (1 + BAND_PCT) : target * (1 - BAND_PCT);
  if (invert) {
    if (value <= good) return "var(--win)";
    if (value >= bad) return "var(--loss)";
    return "var(--gold)";
  }
  if (value >= good) return "var(--win)";
  if (value <= bad) return "var(--loss)";
  return "var(--gold)";
}

/** Paliers intermédiaires affichés autour d'un repère de palier. */
export function milestoneSteps(benchmark, invert) {
  const factors = invert ? [1.6, 1.3, 1.0, 0.85] : [0.6, 0.8, 1, 1.15];
  return factors.map((f) => Math.round(benchmark * f * 10) / 10);
}
