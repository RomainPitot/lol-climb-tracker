import { Trophy } from "lucide-react";
import { APEX, DIV_NUM, TIER_COLORS, TIER_ICON } from "../constants/ranks.js";
import { rankLabel } from "../lib/rank.js";

/** Les 4 carrés représentant la division dans le tier (IV → I). */
function DivisionPips({ tier, div, color, size = 6 }) {
  if (APEX.includes(tier) || !div) return null;
  const filled = DIV_NUM[div] || 1;

  return (
    <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: big ? 56 : 40,
          height: big ? 56 : 40,
          borderRadius: 14,
          background: `linear-gradient(155deg, ${c}22, ${c}08)`,
          border: `1.5px solid ${c}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={big ? 26 : 18} color={c} />
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: big ? 24 : 16,
            color: "var(--text)",
            lineHeight: 1.1,
          }}
        >
          {rankLabel(tier, div)}
        </div>
        {lp !== undefined && (
          <div style={{ fontSize: 12, color: c, fontWeight: 600 }}>{lp} LP</div>
        )}
        <DivisionPips tier={tier} div={div} color={c} size={big ? 7 : 5} />
      </div>
    </div>
  );
}
