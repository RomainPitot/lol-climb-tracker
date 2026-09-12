import { describe, it, expect } from "vitest";
import { computeScore, trendWeight, frequencyWeight } from "./priorityScore.js";

describe("computeScore", () => {
  it("multiplies the three factors together", () => {
    expect(computeScore(0.1, 1.4, 1.2)).toBeCloseTo(0.1 * 1.4 * 1.2);
  });

  it("clamps a negative gap to zero rather than a negative score", () => {
    // Un gapPct négatif ne devrait jamais arriver ici (voir autoCoach.js, appelé seulement
    // sur des points faibles), mais le score ne doit jamais être négatif si ça arrive quand
    // même — Math.max(0, gapPct) protège ça.
    expect(computeScore(-0.5, 1, 1)).toBe(0);
  });

  it("returns zero when the gap itself is zero", () => {
    expect(computeScore(0, 1.4, 1.2)).toBe(0);
  });
});

describe("trendWeight", () => {
  it("stays neutral (1) when there isn't enough history to judge a trend", () => {
    const games = Array.from({ length: 14 }, () => ({ deaths: 5 }));
    expect(trendWeight(games, "deaths", true)).toBe(1);
  });

  it("weighs a worsening inverted metric (deaths climbing) above 1", () => {
    // 10 games de référence à 5 morts, puis 5 games récentes à 10 morts : ça empire.
    const baseline = Array.from({ length: 10 }, () => ({ deaths: 5 }));
    const recent = Array.from({ length: 5 }, () => ({ deaths: 10 }));
    const w = trendWeight([...baseline, ...recent], "deaths", true);
    expect(w).toBeGreaterThan(1);
    expect(w).toBeLessThanOrEqual(1.4);
  });

  it("weighs an improving inverted metric (deaths dropping) below 1", () => {
    const baseline = Array.from({ length: 10 }, () => ({ deaths: 10 }));
    const recent = Array.from({ length: 5 }, () => ({ deaths: 5 }));
    const w = trendWeight([...baseline, ...recent], "deaths", true);
    expect(w).toBeLessThan(1);
    expect(w).toBeGreaterThanOrEqual(0.7);
  });

  it("weighs a worsening non-inverted metric (csmin dropping) above 1", () => {
    const baseline = Array.from({ length: 10 }, () => ({ cs: 300, duration: 30 })); // 10 cs/min
    const recent = Array.from({ length: 5 }, () => ({ cs: 150, duration: 30 })); // 5 cs/min : pire
    const w = trendWeight([...baseline, ...recent], "csmin", false);
    expect(w).toBeGreaterThan(1);
  });

  it("never reports a flat baseline as worsening or improving beyond neutral", () => {
    const games = Array.from({ length: 15 }, () => ({ deaths: 5 }));
    expect(trendWeight(games, "deaths", true)).toBe(1);
  });
});

describe("frequencyWeight", () => {
  it("stays neutral (1) without a numeric target", () => {
    expect(frequencyWeight([{ deaths: 5 }], "deaths", true, null)).toBe(1);
  });

  it("stays neutral (1) with no games", () => {
    expect(frequencyWeight([], "deaths", true, 7)).toBe(1);
  });

  it("reaches the maximum (1.2) when every recent game individually fails the target", () => {
    const games = Array.from({ length: 10 }, () => ({ deaths: 10 })); // target 7, invert : 10 > 7 rate
    expect(frequencyWeight(games, "deaths", true, 7)).toBeCloseTo(1.2);
  });

  it("reaches the minimum (0.8) when no recent game individually fails the target", () => {
    const games = Array.from({ length: 10 }, () => ({ deaths: 3 })); // 3 <= 7, jamais en échec
    expect(frequencyWeight(games, "deaths", true, 7)).toBeCloseTo(0.8);
  });

  it("lands in between when only some games fail the target", () => {
    // 5 games sur 10 en échec (deaths > 7) -> 0.8 + 0.4*0.5 = 1.0
    const games = [
      ...Array.from({ length: 5 }, () => ({ deaths: 3 })),
      ...Array.from({ length: 5 }, () => ({ deaths: 10 })),
    ];
    expect(frequencyWeight(games, "deaths", true, 7)).toBeCloseTo(1.0);
  });
});
