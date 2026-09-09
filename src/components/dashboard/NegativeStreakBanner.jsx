import { Coffee } from "lucide-react";
import { Card } from "../ui/primitives.jsx";
import { computeNegativeStreakAlert } from "../../lib/streakAlert.js";

/** Bannière proactive avant de relancer une queue après une série de défaites — voir
 * lib/streakAlert.js. Rien à afficher tant que la série en cours ne dépasse pas le seuil. */
export default function NegativeStreakBanner({ data, sorted }) {
  const alert = computeNegativeStreakAlert(data, sorted);
  if (!alert) return null;

  return (
    <Card className="p-4 mb-6" style={{ borderColor: "rgba(212,175,55,0.4)", display: "flex", alignItems: "center", gap: 10 }}>
      <Coffee size={16} color="var(--gold)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, color: "var(--text)" }}>{alert.message}</span>
    </Card>
  );
}
