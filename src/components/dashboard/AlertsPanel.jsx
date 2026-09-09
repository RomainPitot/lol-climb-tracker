import { AlertTriangle } from "lucide-react";
import { Card, Eyebrow } from "../ui/primitives.jsx";
import { computeAlerts } from "../../lib/alerts.js";

const SEVERITY_COLOR = { 4: "var(--loss)", 3: "var(--loss)", 2: "var(--gold)", 1: "var(--gold)" };

/**
 * Alertes automatiques (voir lib/alerts.js) — jamais plus de 3, triées par gravité. Rien à
 * afficher tant qu'aucun seuil n'est franchi : pas de carte vide "tout va bien" qui prendrait
 * de la place sans rien dire.
 */
export default function AlertsPanel({ data, sorted }) {
  const alerts = computeAlerts(data, sorted);
  if (!alerts.length) return null;

  return (
    <Card className="p-4 mb-6" style={{ borderColor: "rgba(255,92,92,0.35)" }}>
      <Eyebrow style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <AlertTriangle size={12} color="var(--loss)" /> Alertes
      </Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alerts.map((a) => (
          <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--text)" }}>
            <span
              style={{ width: 6, height: 6, borderRadius: "50%", background: SEVERITY_COLOR[a.severity], marginTop: 5, flexShrink: 0 }}
            />
            {a.message}
          </div>
        ))}
      </div>
    </Card>
  );
}
