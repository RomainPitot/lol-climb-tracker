import { Trophy } from "lucide-react";
import { APEX, DIV_NUM, TIER_COLORS, TIER_ICON } from "../constants/ranks.js";
import { rankLabel } from "../lib/rank.js";

/** Les 4 carrés représentant la division dans le tier (IV → I). */
function DivisionPips({ tier, div, color, size = 6 }) {
  if (APEX.includes(tier) || !div) return null;
  const filled = DIV_NUM[div] || 1;

  return (
    <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          style={{
            width: size,
            height: size,
            borderRadius: 2,
            background: n <= filled ? color : "transparent",
            border: `1px solid ${color}`,
            opacity: n <= filled ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

export default function RankBadge({ tier, div, lp, size = "lg" }) {
  const c = TIER_COLORS[tier] || "var(--dim)";
  const Icon = TIER_ICON[tier] || Trophy;
  const big = size === "lg";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: big ? 18 : 12 }}>
      <div
        style={{
          width: big ? 72 : 40,
          height: big ? 72 : 40,
          borderRadius: big ? "var(--radius-lg)" : 14,
          background: `linear-gradient(155deg, ${c}33, ${c}0a)`,
          border: `1.5px solid ${c}66`,
          boxShadow: big ? `0 0 0 1px ${c}22, 0 8px 28px ${c}40` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={big ? 34 : 18} color={c} strokeWidth={big ? 1.75 : 2} />
      </div>
      <div>
        <div
          className="tnum"
          style={{
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: big ? 34 : 16,
            color: "var(--text)",
            lineHeight: 1.05,
          }}
        >
          {rankLabel(tier, div)}
        </div>
        {lp !== undefined && (
          <div className="tnum" style={{ fontSize: big ? 14 : 12, color: c, fontWeight: 700, marginTop: 2 }}>
            {lp} LP
          </div>
        )}
        <DivisionPips tier={tier} div={div} color={c} size={big ? 7 : 5} />
      </div>
    </div>
  );
}
