import { Fragment } from "react";
import { Trophy, Check, Flag } from "lucide-react";
import { FULL_GAME_LADDER, TIER_ICON } from "../constants/ranks.js";
import { ladderIndex } from "../lib/rank.js";

/** Frise Fer IV → Challenger, avec le palier courant et l'objectif mis en avant. */
export default function LadderTrack({ tier, div, objectiveTier }) {
  const idx = ladderIndex(tier, div);
  // Premier palier qui correspond à l'objectif (ex: "Diamant IV" pour l'objectif "Diamant")
  // — un seul marqueur au début du palier visé, pas un par division.
  const objectiveIdx = objectiveTier ? FULL_GAME_LADDER.findIndex((s) => s.tier === objectiveTier) : -1;

  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", overflowX: "auto", padding: "10px 2px 6px" }}>
      {FULL_GAME_LADDER.map((step, i) => {
        const isCurrent = i === idx;
        const isPast = i < idx;
        const isObjective = i === objectiveIdx;
        const c = isCurrent ? "var(--gold)" : isPast ? "var(--win)" : "var(--border)";
        const Icon = TIER_ICON[step.tier] || Trophy;

        return (
          <Fragment key={`${step.tier}-${step.div ?? "apex"}`}>
            {i > 0 && (
              <div style={{ height: 2, width: 14, background: isPast || isCurrent ? c : "var(--border)", flexShrink: 0 }} />
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                {isObjective && (
                  <Flag
                    size={13}
                    color="var(--gold)"
                    fill="var(--gold)"
                    style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)" }}
                  />
                )}
                <div
                  style={{
                    width: isCurrent ? 32 : 26,
                    height: isCurrent ? 32 : 26,
                    borderRadius: 9,
                    background: isCurrent
                      ? "rgba(212,175,55,0.18)"
                      : isPast
                        ? "rgba(15,214,138,0.12)"
                        : isObjective
                          ? "rgba(212,175,55,0.08)"
                          : "var(--bg-elevated)",
                    border: `1.5px solid ${isObjective && !isPast && !isCurrent ? "var(--gold)" : c}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isCurrent ? "0 0 0 4px rgba(212,175,55,0.12)" : "none",
                  }}
                >
                  {isPast ? (
                    <Check size={12} color={c} />
                  ) : (
                    <Icon size={isCurrent ? 15 : 11} color={isObjective && !isCurrent ? "var(--gold)" : c} />
                  )}
                </div>
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: isCurrent ? "var(--gold)" : isObjective ? "var(--gold)" : "var(--dim)",
                  fontWeight: isCurrent || isObjective ? 700 : 500,
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
