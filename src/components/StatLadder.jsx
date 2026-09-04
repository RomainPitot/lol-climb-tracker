import { milestoneSteps } from "../lib/stats.js";
import { round1 } from "../lib/format.js";

/** Barre de paliers vers un repère de rang (4 segments franchis progressivement). */
export default function StatLadder({ label, value, benchmark, invert, unit = "" }) {
  const steps = milestoneSteps(benchmark, invert);
  const passedCount = steps.filter((s) => (invert ? value <= s : value >= s)).length;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: "var(--dim)", fontWeight: 600 }}>{label}</span>
        <span className="tnum" style={{ color: "var(--text)", fontWeight: 700 }}>
          {round1(value)}
          {unit}{" "}
          <span style={{ color: "var(--dim)", fontWeight: 400 }}>
            (cible {round1(benchmark)}
            {unit})
          </span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {steps.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: i < passedCount ? "var(--win)" : "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
            title={`${s}${unit}`}
          />
        ))}
      </div>
    </div>
  );
}
