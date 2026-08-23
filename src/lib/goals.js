import { rankValue, rankLabel } from "./rank.js";
import { computeAgg } from "./stats.js";
import { round1, round2 } from "./format.js";

/** Les objectifs de perf se jugent sur une fenêtre récente, pas sur tout l'historique. */
const RECENT_WINDOW = 20;

export function computeGoalProgress(goal, sorted) {
  const recent = sorted.slice(-RECENT_WINDOW);
  const pctOf = (value, target) => Math.min(100, (value / (target || 1)) * 100);

  switch (goal.type) {
    case "reach_rank": {
      const last = sorted.at(-1);
      const cur = last ? rankValue(last.rankAfterTier, last.rankAfterDiv) : 0;
      const target = rankValue(goal.tier, goal.div);
      return {
        pct: target ? Math.min(100, (cur / target) * 100) : 0,
        label: `${rankLabel(last?.rankAfterTier, last?.rankAfterDiv)} → ${rankLabel(goal.tier, goal.div)}`,
        met: cur >= target,
      };
    }

    case "wr_champion": {
      const games = sorted.filter((g) => g.champion === goal.champion);
      const wr = games.length ? (games.filter((g) => g.win).length / games.length) * 100 : 0;
      return {
        pct: pctOf(wr, goal.threshold),
        label: `${round1(wr)}% / ${goal.threshold}% (${goal.champion})`,
        met: wr >= goal.threshold,
      };
    }

    case "deaths_below": {
      const avg = recent.length
        ? recent.reduce((a, g) => a + Number(g.deaths), 0) / recent.length
        : 0;
      return {
        // Objectif inversé : on progresse en descendant vers le seuil.
        pct: goal.threshold ? Math.min(100, (goal.threshold / (avg || goal.threshold)) * 100) : 0,
        label: `${round1(avg)} / ${goal.threshold} morts (${RECENT_WINDOW} dernières)`,
        met: avg <= goal.threshold,
      };
    }

    case "csmin_above": {
      const avg = recent.length
        ? recent.reduce((a, g) => a + (g.duration ? g.cs / g.duration : 0), 0) / recent.length
        : 0;
      return {
        pct: pctOf(avg, goal.threshold),
        label: `${round1(avg)} / ${goal.threshold} CS/min (${RECENT_WINDOW} dernières)`,
        met: avg >= goal.threshold,
      };
    }

    case "kda_above": {
      const a = computeAgg(recent);
      return {
        pct: pctOf(a.kda, goal.threshold),
        label: `${round2(a.kda)} / ${goal.threshold} KDA (${RECENT_WINDOW} dernières)`,
        met: a.kda >= goal.threshold,
      };
    }

    case "kills_above": {
      const a = computeAgg(recent);
      return {
        pct: pctOf(a.kills, goal.threshold),
        label: `${round1(a.kills)} / ${goal.threshold} kills/game (${RECENT_WINDOW} dernières)`,
        met: a.kills >= goal.threshold,
      };
    }

    case "games_without_champion": {
      let count = 0;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].champion === goal.champion) break;
        count++;
      }
      return {
        pct: pctOf(count, goal.count),
        label: `${count} / ${goal.count} games sans ${goal.champion}`,
        met: count >= goal.count,
      };
    }

    case "games_champion": {
      const n = sorted.filter((g) => g.champion === goal.champion).length;
      return {
        pct: pctOf(n, goal.count),
        label: `${n} / ${goal.count} games ${goal.champion}`,
        met: n >= goal.count,
      };
    }

    default:
      return { pct: 0, label: "—", met: false };
  }
}
