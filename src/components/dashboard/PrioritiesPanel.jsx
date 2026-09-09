import { Target } from "lucide-react";
import { Card, Eyebrow } from "../ui/primitives.jsx";
import { computePriorities } from "../../lib/priorities.js";

/**
 * "Priorités de la semaine" — complète AlertsPanel (juste au-dessus) sans jamais répéter
 * ce qu'il affiche déjà : correctifs pas encore démarrés, puis l'axe le plus en retrait vs
 * le repère du rôle. Contrairement aux alertes, peut rester vide sans que ce soit un souci
 * (pas assez de games, ou rien qui dépasse le bruit normal) — pas de carte "tout va bien".
 */
export default function PrioritiesPanel({ data, sorted, currentRank }) {
  const priorities = computePriorities(data, sorted, currentRank);
  if (!priorities.length) return null;

  return (
    <Card className="p-4 mb-6">
      <Eyebrow style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <Target size={12} /> Priorités de la semaine
      </Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {priorities.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--text)" }}>
            <span
              className="tnum"
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "rgba(212,175,55,0.14)",
                border: "1px solid var(--gold)",
                color: "var(--gold)",
                fontWeight: 700,
                fontSize: 10.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {i + 1}
            </span>
            {p.message}
          </div>
        ))}
      </div>
    </Card>
  );
}
