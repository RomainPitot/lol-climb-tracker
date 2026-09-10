import { Fragment, useMemo } from "react";
import { Check, Flag } from "lucide-react";
import { APEX, DIVS, DIV_NUM, ALL_TIERS } from "../constants/ranks.js";
import RankEmblem from "./RankEmblem.jsx";

/**
 * Un nœud par palier, sauf le palier COURANT : celui-là se déplie en ses 4 divisions
 * (IV → I) plutôt que de rester un seul bloc — les autres paliers n'ont pas besoin de
 * ce détail, seul celui où on se trouve réellement le justifie.
 */
function buildNodes(currentTier) {
  const nodes = [];
  for (const t of ALL_TIERS) {
    if (!APEX.includes(t) && t === currentTier) {
      for (const d of DIVS) nodes.push({ tier: t, div: d, expanded: true });
    } else {
      nodes.push({ tier: t, div: null, expanded: false });
    }
  }
  return nodes;
}

/**
 * Frise Fer → Challenger, avec le palier courant déplié et l'objectif (ou les objectifs —
 * plusieurs paliers visés peuvent être définis, voir Paramètres > Objectifs) mis en avant.
 */
export default function LadderTrack({ tier, div, objectiveTiers }) {
  const nodes = useMemo(() => buildNodes(tier), [tier]);
  const currentTierIdx = ALL_TIERS.indexOf(tier);
  // Premier nœud de chaque palier visé (la division IV s'il est déplié) — un seul marqueur
  // par palier objectif, pas un par division.
  const objectiveIdxs = useMemo(() => {
    const set = new Set();
    for (const t of objectiveTiers || []) {
      const idx = nodes.findIndex((n) => n.tier === t);
      if (idx >= 0) set.add(idx);
    }
    return set;
  }, [objectiveTiers, nodes]);

  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", overflowX: "auto", padding: "10px 2px 6px" }}>
      {nodes.map((node, i) => {
        const tierIdx = ALL_TIERS.indexOf(node.tier);
        const isPast = node.expanded
          ? DIV_NUM[node.div] < DIV_NUM[div]
          : tierIdx < currentTierIdx;
        const isCurrent = node.expanded ? node.div === div : tierIdx === currentTierIdx;
        const isObjective = objectiveIdxs.has(i);
        const big = isCurrent || (!node.expanded && node.tier === tier);
        // x2 par rapport à la taille d'origine (40/30/34) — les logos de rangs, ici affichés
        // en frise, doivent rester lisibles même en défilement horizontal.
        const size = big ? 80 : node.expanded ? 60 : 68;

        const c = isCurrent ? "var(--gold)" : isPast ? "var(--win)" : "var(--border)";

        return (
          <Fragment key={`${node.tier}-${node.div ?? "apex"}`}>
            {i > 0 && (
              <div style={{ height: 2, width: 10, background: isPast || isCurrent ? c : "var(--border)", flexShrink: 0 }} />
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <div style={{ position: "relative", width: size, height: size }}>
                {isObjective && (
                  <Flag
                    size={24}
                    color="var(--gold)"
                    fill="var(--gold)"
                    style={{ position: "absolute", top: -26, left: "50%", transform: "translateX(-50%)" }}
                  />
                )}
                <div
                  style={{
                    width: size,
                    height: size,
                    borderRadius: 10,
                    background: isCurrent ? "rgba(212,175,55,0.16)" : "transparent",
                    border: isCurrent ? "1.5px solid var(--gold)" : isObjective ? "1.5px solid rgba(212,175,55,0.5)" : "none",
                    boxShadow: isCurrent ? "0 0 0 4px rgba(212,175,55,0.12)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <RankEmblem tier={node.tier} size={size - (isCurrent ? 12 : 4)} dim={!isPast && !isCurrent} />
                </div>
                {isPast && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -6,
                      right: -6,
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "var(--win)",
                      border: "4px solid var(--bg-card, var(--card))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={18} color="#0a0a0f" strokeWidth={3} />
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: "var(--fs-xs)",
                  color: isCurrent ? "var(--gold)" : isObjective ? "var(--gold)" : "var(--dim)",
                  fontWeight: isCurrent || isObjective ? 700 : 500,
                  whiteSpace: "nowrap",
                }}
              >
                {node.div ? `${node.tier[0]}${node.div}` : node.tier}
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
