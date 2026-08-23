import { SESSION_GAP_MS } from "../constants/game.js";
import { sortByDate } from "./rank.js";
import { computeAgg, streaksOf } from "./stats.js";
import { gameTime } from "./format.js";

/**
 * Regroupe les games en sessions : deux games consécutives appartiennent à la même
 * session si moins de SESSION_GAP_MS séparent la fin de l'une du début de l'autre.
 * Renvoie les sessions de la plus récente à la plus ancienne.
 */
export function detectSessions(games) {
  const sorted = sortByDate(games);
  const groups = [];
  let cur = [];
  let lastEnd = null;

  sorted.forEach((g) => {
    const start = gameTime(g);
    if (lastEnd !== null && start - lastEnd > SESSION_GAP_MS) {
      if (cur.length) groups.push(cur);
      cur = [];
    }
    cur.push(g);
    lastEnd = start + (Number(g.duration) || 25) * 60000;
  });
  if (cur.length) groups.push(cur);

  return groups.reverse().map(summarizeSession);
}

function summarizeSession(list) {
  const agg = computeAgg(list);

  const champCounts = {};
  list.forEach((g) => {
    champCounts[g.champion] = (champCounts[g.champion] || 0) + 1;
  });
  const mainChamp = Object.entries(champCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const avg = (f) => list.reduce((a, g) => a + (Number(f(g)) || 0), 0) / (list.length || 1);

  // Baisse de perf : seconde moitié nettement moins bonne que la première.
  let drop = false;
  if (list.length >= 4) {
    const half = Math.floor(list.length / 2);
    const first = computeAgg(list.slice(0, half));
    const second = computeAgg(list.slice(half));
    if (second.kda < first.kda * 0.7 || second.deaths > first.deaths * 1.3) drop = true;
  }

  return {
    id: `${list[0].id}-session`,
    date: list[0].date,
    games: list.length,
    list,
    ...agg,
    mainChamp,
    yone: computeAgg(list.filter((g) => g.champion === "Yone")),
    tahm: computeAgg(list.filter((g) => g.champion === "Tahm Kench")),
    avgDuration: avg((g) => g.duration),
    focus: avg((g) => g.focus),
    tilt: avg((g) => g.tilt),
    streaks: streaksOf(list),
    drop,
    isPositive: agg.wr >= 65 && list.length >= 3,
    isNegative: agg.wr <= 35 && list.length >= 3,
  };
}
