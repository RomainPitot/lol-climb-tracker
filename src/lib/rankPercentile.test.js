import { describe, it, expect } from "vitest";
import { estimatedPercentile, formatPercentile } from "./rankPercentile.js";

describe("estimatedPercentile", () => {
  it("looks up a known tier+division", () => {
    expect(estimatedPercentile("Diamant", "I")).toBeCloseTo(1.62);
    expect(estimatedPercentile("Fer", "IV")).toBe(100);
  });

  it("handles the apex tiers, which have no division", () => {
    expect(estimatedPercentile("Maître", null)).toBeCloseTo(0.85);
    expect(estimatedPercentile("Grand Maître", null)).toBeCloseTo(0.03);
    expect(estimatedPercentile("Challenger", null)).toBeCloseTo(0.0086);
  });

  it("returns null for an unknown tier rather than inventing a number", () => {
    expect(estimatedPercentile("Inconnu", "I")).toBeNull();
  });

  it("is monotonically non-decreasing from Challenger down to Fer IV — a higher tier is always a smaller or equal top %", () => {
    const ladder = [
      ["Challenger", null],
      ["Grand Maître", null],
      ["Maître", null],
      ["Diamant", "I"],
      ["Diamant", "IV"],
      ["Or", "I"],
      ["Or", "IV"],
      ["Fer", "I"],
      ["Fer", "IV"],
    ];
    const values = ladder.map(([tier, div]) => estimatedPercentile(tier, div));
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
  });
});

describe("formatPercentile", () => {
  it("uses 3 decimals under 0.1%", () => {
    expect(formatPercentile(0.0086)).toBe("0.009");
  });

  it("uses 2 decimals under 1%", () => {
    expect(formatPercentile(0.85)).toBe("0.85");
  });

  it("uses 1 decimal under 10%", () => {
    expect(formatPercentile(1.62)).toBe("1.6");
  });

  it("rounds to a whole number at 10% and above", () => {
    expect(formatPercentile(24.2)).toBe("24");
    expect(formatPercentile(100)).toBe("100");
  });
});
