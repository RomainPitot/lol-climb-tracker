import { describe, it, expect } from "vitest";
import { newCorrection, startCorrection, evaluateCorrection, primaryActiveCorrection } from "./corrections.js";

const SETTINGS = { includeExcludedGames: false };

function makeGames(ids, deaths) {
  return ids.map((id) => ({ id, deaths, kills: 0, assists: 0, cs: 0, duration: 30, visionScore: 0, win: true, excluded: false }));
}

describe("newCorrection", () => {
  it("starts as todo, with no target when none is given", () => {
    const sorted = makeGames(["g1", "g2", "g3"], 6);
    const c = newCorrection({ title: "Réduire les morts", metricId: "deaths", targetValue: "", sorted, settings: SETTINGS });
    expect(c.status).toBe("todo");
    expect(c.targetValue).toBeNull();
    expect(c.startedAt).toBeNull();
  });

  it("computes the initial value from the last 20 representative games", () => {
    const sorted = makeGames(Array.from({ length: 20 }, (_, i) => `g${i}`), 7);
    const c = newCorrection({ title: "x", metricId: "deaths", targetValue: 5, sorted, settings: SETTINGS });
    expect(c.targetValue).toBe(5);
    expect(c.initialValue).toBeCloseTo(7);
  });
});

describe("startCorrection", () => {
  it("switches to in_progress and pins the last played game as the start point", () => {
    const sorted = makeGames(["g1", "g2", "g3"], 6);
    const c = newCorrection({ title: "x", metricId: "deaths", targetValue: 5, sorted, settings: SETTINGS });
    const started = startCorrection(c, sorted);
    expect(started.status).toBe("in_progress");
    expect(started.startGameId).toBe("g3");
    expect(started.startedAt).not.toBeNull();
  });
});

describe("evaluateCorrection", () => {
  it("leaves a todo correction untouched", () => {
    const c = { metric: "deaths", status: "todo" };
    const result = evaluateCorrection(c, [], SETTINGS);
    expect(result.derivedStatus).toBe("todo");
    expect(result.currentValue).toBeNull();
  });

  it("without a numeric target, stays in_progress forever and just tracks the current value (ex-\"Point de focus\")", () => {
    const sorted = [...makeGames(["start"], 8), ...makeGames(["g1", "g2", "g3"], 4)];
    const c = { metric: "deaths", status: "in_progress", startGameId: "start", targetValue: null };
    const result = evaluateCorrection(c, sorted, SETTINGS);
    expect(result.derivedStatus).toBe("in_progress");
    expect(result.currentValue).toBeCloseTo(4);
    expect(result.gamesCount).toBe(3);
  });

  it("stays in_progress while the target has never been met", () => {
    const sorted = [...makeGames(["start"], 8), ...makeGames(Array.from({ length: 10 }, (_, i) => `g${i}`), 10)];
    const c = { metric: "deaths", status: "in_progress", startGameId: "start", targetValue: 6 };
    const result = evaluateCorrection(c, sorted, SETTINGS);
    expect(result.derivedStatus).toBe("in_progress");
  });

  it("reports \"corrected\" once the target has been met and still holds", () => {
    const sorted = [...makeGames(["start"], 8), ...makeGames(Array.from({ length: 12 }, (_, i) => `g${i}`), 5)];
    const c = { metric: "deaths", status: "in_progress", startGameId: "start", targetValue: 6 };
    const result = evaluateCorrection(c, sorted, SETTINGS);
    expect(result.derivedStatus).toBe("corrected");
  });

  it("reports \"regression\" after being corrected once but falling back off target — never silently stays \"corrected\"", () => {
    const goodStretch = makeGames(Array.from({ length: 10 }, (_, i) => `good${i}`), 5); // sous la cible
    const badStretch = makeGames(Array.from({ length: 5 }, (_, i) => `bad${i}`), 10); // retombé au-dessus
    const sorted = [...makeGames(["start"], 8), ...goodStretch, ...badStretch];
    const c = { metric: "deaths", status: "in_progress", startGameId: "start", targetValue: 6 };
    const result = evaluateCorrection(c, sorted, SETTINGS);
    expect(result.derivedStatus).toBe("regression");
  });
});

describe("primaryActiveCorrection", () => {
  it("returns null when nothing is in_progress", () => {
    const data = { corrections: [{ metric: "deaths", status: "todo" }], settings: SETTINGS };
    expect(primaryActiveCorrection(data, [])).toBeNull();
  });

  it("picks the most recently started in_progress correction, not just the first in the list", () => {
    const sorted = makeGames(["start"], 8);
    const older = { metric: "deaths", status: "in_progress", startGameId: "start", targetValue: null, startedAt: "2026-01-01T00:00:00Z" };
    const newer = { metric: "csmin", status: "in_progress", startGameId: "start", targetValue: null, startedAt: "2026-02-01T00:00:00Z" };
    const data = { corrections: [older, newer], settings: SETTINGS };
    const result = primaryActiveCorrection(data, sorted);
    expect(result.metric).toBe("csmin");
  });
});
