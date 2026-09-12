import { describe, it, expect } from "vitest";
import { computeWinLossDiff, winLossDiffPhrase } from "./winLossDiff.js";

/** Game minimale mais complète pour computeAgg (lib/stats.js) — csmin/visionMin/kda égaux
 * entre victoires et défaites par défaut, pour isoler la métrique qu'on fait varier dans
 * chaque test plutôt que de laisser du bruit sur les autres. */
function game({ win, deaths, kills = 6, assists = 4, cs = 180, duration = 30, visionScore = 15 }) {
  return { win, deaths, kills, assists, cs, duration, visionScore, damage: 0, gold: 0, lpChange: 0 };
}

describe("computeWinLossDiff", () => {
  it("returns nothing below the minimum sample size per group", () => {
    const games = [
      ...Array.from({ length: 4 }, () => game({ win: true, deaths: 3 })),
      ...Array.from({ length: 4 }, () => game({ win: false, deaths: 6 })),
    ];
    expect(computeWinLossDiff(games)).toEqual([]);
  });

  it("surfaces deaths as the signal when it's the only metric that actually differs", () => {
    // KDA gardé identique (10/5 = 16/8 = 2) pour isoler deaths comme seul signal réel.
    const wins = Array.from({ length: 5 }, () => game({ win: true, deaths: 5, kills: 6, assists: 4 }));
    const losses = Array.from({ length: 5 }, () => game({ win: false, deaths: 8, kills: 10, assists: 6 }));
    const diffs = computeWinLossDiff([...wins, ...losses]);

    expect(diffs.length).toBe(1);
    expect(diffs[0].key).toBe("deaths");
    // invert=true : raw = lossValue - winValue = 8 - 5 = 3, ref = 8 -> 0.375
    expect(diffs[0].gapPct).toBeCloseTo(3 / 8, 5);
  });

  it("normalizes as a relative %, not a raw difference — an aggressive and a safe player with the same relative gap score identically", () => {
    // Joueur agressif : 8 morts en victoire, 11 en défaite (écart brut 3, comme le test du GDD).
    const aggressiveWins = Array.from({ length: 5 }, () => game({ win: true, deaths: 8 }));
    const aggressiveLosses = Array.from({ length: 5 }, () => game({ win: false, deaths: 11 }));
    // Joueur safe : 2 morts en victoire, 2.75 en défaite (même écart RELATIF, écart brut minime).
    const safeWins = Array.from({ length: 5 }, () => game({ win: true, deaths: 2 }));
    const safeLosses = Array.from({ length: 5 }, () => game({ win: false, deaths: 2.75 }));

    const aggressiveDiff = computeWinLossDiff([...aggressiveWins, ...aggressiveLosses])[0];
    const safeDiff = computeWinLossDiff([...safeWins, ...safeLosses])[0];

    expect(aggressiveDiff.gapPct).toBeCloseTo(safeDiff.gapPct, 2);
  });

  it("never flags a metric that's uniformly bad in both wins and losses — that's the rank-benchmark comparison's job, not this one", () => {
    // Vision basse (0.2) de façon identique en victoire ET en défaite : gapPct proche de 0,
    // donc jamais retenue ici (voir le garde-fou documenté dans winLossDiff.js), même si
    // c'est objectivement un point faible réel (revélé ailleurs, par roleBenchmark).
    const wins = Array.from({ length: 5 }, () => game({ win: true, deaths: 4, visionScore: 6 }));
    const losses = Array.from({ length: 5 }, () => game({ win: false, deaths: 4, visionScore: 6 }));
    const diffs = computeWinLossDiff([...wins, ...losses]);
    expect(diffs.find((d) => d.key === "visionMin")).toBeUndefined();
  });

  it("sorts the strongest relative gap first", () => {
    const wins = Array.from({ length: 5 }, () => game({ win: true, deaths: 4, kills: 6, assists: 4, cs: 210, duration: 30 }));
    const losses = Array.from({ length: 5 }, () => game({ win: false, deaths: 9, kills: 6, assists: 4, cs: 150, duration: 30 }));
    const diffs = computeWinLossDiff([...wins, ...losses]);
    expect(diffs.length).toBeGreaterThan(1);
    for (let i = 1; i < diffs.length; i++) expect(diffs[i - 1].gapPct).toBeGreaterThanOrEqual(diffs[i].gapPct);
  });
});

describe("winLossDiffPhrase", () => {
  it("returns null without a diff", () => {
    expect(winLossDiffPhrase(null)).toBeNull();
  });

  it("formats the diff with rounded percentage and the metric's own decimals", () => {
    const diff = { label: "Deaths/game", winValue: 5, lossValue: 8, gapPct: 0.375, decimals: 1 };
    const phrase = winLossDiffPhrase(diff);
    expect(phrase).toContain("5.0");
    expect(phrase).toContain("8.0");
    expect(phrase).toContain("38%");
  });
});
