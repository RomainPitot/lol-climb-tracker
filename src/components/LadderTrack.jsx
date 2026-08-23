import { Fragment } from "react";
import { Trophy, Check } from "lucide-react";
import { LADDER, TIER_ICON } from "../constants/ranks.js";
import { ladderIndex } from "../lib/rank.js";

/** Frise Émeraude IV → Maître, avec le palier courant mis en avant. */
export default function LadderTrack({ tier, div }) {
  const idx = ladderIndex(tier, div);

  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", overflowX: "auto", padding: "6px 2px" }}>
      {LADDER.map((step, i) => {
        const isCurrent = i === idx;
        const isPast = i < idx;
        const c = isCurrent ? "var(--gold)" : isPast ? "var(--win)" : "var(--border)";
        const Icon = TIER_ICON[step.tier] || Trophy;

        return (
          <Fragment key={`${step.tier}-${step.div ?? "apex"}`}>
            {i > 0 && (
              <div
                style={{
                  height: 2,
                  width: 26,
                  background: isPast || isCurrent ? c : "var(--border)",
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div
                style={{
                  width: isCurrent ? 40 : 30,
                  height: isCurrent ? 40 : 30,
                  borderRadius: 10,
                  background: isCurrent
                    ? "rgba(212,175,55,0.18)"
                    : isPast
                      ? "rgba(15,214,138,0.12)"
                      : "var(--bg-elevated)",
                  border: `1.5px solid ${c}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isCurrent ? "0 0 0 4px rgba(212,175,55,0.12)" : "none",
                }}
              >
                {isPast ? <Check size={14} color={c} /> : <Icon size={isCurrent ? 16 : 12} color={c} />}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: isCurrent ? "var(--gold)" : "var(--dim)",
                  fontWeight: isCurrent ? 700 : 500,
                  whiteSpace: "nowrap",
                }}
              >
                {step.div ? `${step.tier[0]}${step.div}` : step.tier}
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
