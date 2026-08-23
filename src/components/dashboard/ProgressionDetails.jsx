import { StatCard } from "../ui/primitives.jsx";
import { lpSince } from "../../lib/stats.js";
import { round1 } from "../../lib/format.js";

const RECENT_WINDOW = 20;
const signed = (n) => `${n >= 0 ? "+" : ""}${round1(n)}`;
const tone = (n) => (n >= 0 ? "var(--win)" : "var(--loss)");

export default function ProgressionDetails({ sorted, currentRank }) {
  const week = lpSince(sorted, Date.now() - 7 * 86400000);
  const month = lpSince(sorted, Date.now() - 30 * 86400000);
  const total = sorted.reduce((a, g) => a + Number(g.lpChange || 0), 0);

  const recent = sorted.slice(-RECENT_WINDOW);
  const avgLpPerGame = recent.length
    ? recent.reduce((a, g) => a + Number(g.lpChange || 0), 0) / recent.length
    : 0;
  const lpLeftToNextStep = 100 - Number(currentRank.lp || 0);

  return (
    <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard label="LP gagnés cette semaine" value={signed(week)} tone={tone(week)} />
        <StatCard label="LP gagnés ce mois" value={signed(month)} tone={tone(month)} />
        <StatCard label="Progression depuis le tracking" value={`${signed(total)} LP`} />
      </div>

      <div style={{ fontSize: 12, color: "var(--dim)", fontWeight: 600, marginBottom: 8 }}>
        ESTIMATION — BASÉE SUR LES {RECENT_WINDOW} DERNIÈRES GAMES
      </div>

      {recent.length >= 5 ? (
        <>
          <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 6 }}>
            Gain moyen actuel :{" "}
            <strong style={{ color: tone(avgLpPerGame) }}>{signed(avgLpPerGame)} LP/game</strong>.
            {avgLpPerGame > 0 &&
              ` À ce rythme, il faudrait environ ${Math.ceil(lpLeftToNextStep / avgLpPerGame)} games pour passer au palier suivant.`}
          </p>
          <p style={{ fontSize: 11, color: "var(--dim)" }}>
            Ceci est une estimation basée sur la tendance récente — ce n'est pas une prédiction certaine.
          </p>
        </>
      ) : (
        <p style={{ fontSize: 13, color: "var(--dim)" }}>
          Pas assez de games récentes pour une estimation fiable.
        </p>
      )}
    </div>
  );
}
