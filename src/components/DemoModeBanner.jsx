import { Eye } from "lucide-react";
import { Btn } from "./ui/primitives.jsx";

/**
 * Rappel permanent (pas un toast qui disparaît seul, contrairement à AlertBanner) tant que
 * des données de démo sont chargées (voir EmptyDashboardState.jsx/lib/demoData.js) — sans
 * ça, rien ne distingue ces games inventées des vraies, et le joueur pourrait continuer à
 * tracker par-dessus en pensant que c'est son propre historique.
 */
export default function DemoModeBanner({ active, onExit }) {
  if (!active) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "8px 14px",
        marginBottom: 18,
        borderRadius: "var(--radius-md)",
        background: "rgba(212,175,55,0.1)",
        border: "1px solid rgba(212,175,55,0.35)",
      }}
    >
      <Eye size={14} color="var(--gold)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: "var(--fs-sm)", color: "var(--text)", fontWeight: 600 }}>
        Mode démo — ce sont des games d'exemple, pas les tiennes.
      </span>
      <Btn onClick={onExit} style={{ marginLeft: "auto", fontSize: "var(--fs-xs)", padding: "4px 10px" }}>
        Quitter et commencer à zéro
      </Btn>
    </div>
  );
}
