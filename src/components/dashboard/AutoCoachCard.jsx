import { Bot, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, Eyebrow, Pill } from "../ui/primitives.jsx";
import { buildAutoCoachReport } from "../../lib/autoCoach.js";

/**
 * "Coach automatique" — se met à jour seul à chaque nouvelle game, sans bouton ni clic.
 * PAS une vraie IA : uniquement une synthèse en français des signaux déjà calculés
 * ailleurs dans l'app (alertes, priorités, correctifs, repères de rôle). Étiqueté comme
 * tel explicitement (voir la note en pied de carte) — jamais présenté comme un jugement
 * plus intelligent que ce qu'il est réellement.
 */
export default function AutoCoachCard({ data, sorted, currentRank }) {
  const report = buildAutoCoachReport(data, sorted, currentRank);
  if (!report) return null;

  const { game, strengths, weaknesses, focus, sampleSize } = report;

  return (
    <Card className="p-5 mb-6">
      <Eyebrow style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <Bot size={13} /> Coach automatique
      </Eyebrow>
      <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: -8, marginBottom: 14 }}>
        Direct, sans complaisance — un chiffre mauvais est dit comme tel, avec une raison et une action.
      </p>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 6 }}>Dernière game</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {game.lines.map((line, i) => (
            <div key={i} style={{ fontSize: 13, color: i === 0 ? "var(--text)" : "var(--dim)", fontWeight: i === 0 ? 600 : 400 }}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {weaknesses.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--loss)", marginBottom: 8, fontWeight: 700 }}>
            <ThumbsDown size={12} /> Ce qui te coûte des games ({sampleSize} dernières games)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {weaknesses.map((s, i) => (
              <div
                key={i}
                style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.5, padding: "8px 10px", borderLeft: "2px solid var(--loss)", background: "var(--bg-elevated)", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0" }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {strengths.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--win)", marginBottom: 6, fontWeight: 700 }}>
            <ThumbsUp size={12} /> Pas le problème actuel
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {strengths.map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--dim)" }}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {focus && (
        <Pill tone="gold" title={focus.note}>
          Focus en cours : {focus.label} depuis {focus.gamesCount} game(s)
        </Pill>
      )}

      <p style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        Synthèse automatique calculée à partir de tes stats et des repères de rôle — pas une vraie IA, aucune
        génération de texte externe. Le "quoi faire" détaillé reste juste au-dessous (Alertes/Priorités) ; pour un
        vrai avis rédigé, utilise "Bilan de compte" ou "Bilan de cette game" dans Coach IA.
      </p>
    </Card>
  );
}
