import { Card, Eyebrow } from "../ui/primitives.jsx";
import { computeAgg } from "../../lib/stats.js";
import { round1, round2 } from "../../lib/format.js";

const RECENT_WINDOW = 5;
const MID_WINDOW = 20;

const ROWS = [
  { key: "csmin", label: "CS/min", round: round1, invert: false },
  { key: "visionMin", label: "Vision/min", round: round1, invert: false },
  { key: "kda", label: "KDA", round: round2, invert: false },
  { key: "deaths", label: "Deaths/game", round: round1, invert: true },
];

/**
 * Faute d'accès à une vraie population Riot (moyenne du rôle à cet elo, percentile — pas
 * de source publique), la comparaison réaliste : "moi maintenant" vs "moi sur mes 20
 * dernières" vs "moi sur toute la saison", trois références déjà calculables à partir des
 * games trackées, affichées côte à côte plutôt qu'une seule comparaison implicite au
 * repère de rôle (déjà affiché ailleurs — voir StatLadder).
 */
export default function PopulationReference({ repSorted, bench }) {
  if (repSorted.length < RECENT_WINDOW) return null;

  const now = computeAgg(repSorted.slice(-RECENT_WINDOW));
  const mid = computeAgg(repSorted.slice(-MID_WINDOW));
  const season = computeAgg(repSorted);

  return (
    <Card className="p-4 mb-6">
      <Eyebrow style={{ marginBottom: 4 }}>Toi maintenant vs toi avant</Eyebrow>
      <p style={{ fontSize: 11, color: "var(--dim)", marginBottom: 12 }}>
        Pas de moyenne de population Riot par rôle/elo/patch disponible publiquement — comparaison à toi-même sur
        trois fenêtres, plutôt qu'un repère externe qu'on ne peut pas vérifier.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--fs-sm)" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--dim)" }}>
              <th style={{ textAlign: "left", padding: "6px 8px", fontSize: "var(--fs-xs)" }} className="eyebrow">
                Métrique
              </th>
              <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-xs)" }} className="eyebrow">
                Dernières {RECENT_WINDOW}
              </th>
              <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-xs)" }} className="eyebrow">
                Dernières {MID_WINDOW}
              </th>
              <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-xs)" }} className="eyebrow">
                Saison
              </th>
              {bench && (
                <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-xs)" }} className="eyebrow">
                  Repère rôle
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.key} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "6px 8px", color: "var(--dim)", fontWeight: 600 }}>{r.label}</td>
                <td className="tnum" style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "var(--text)" }}>
                  {r.round(now[r.key])}
                </td>
                <td className="tnum" style={{ padding: "6px 8px", textAlign: "right", color: "var(--text)" }}>
                  {r.round(mid[r.key])}
                </td>
                <td className="tnum" style={{ padding: "6px 8px", textAlign: "right", color: "var(--text)" }}>
                  {r.round(season[r.key])}
                </td>
                {bench && (
                  <td className="tnum" style={{ padding: "6px 8px", textAlign: "right", color: "var(--gold)" }}>
                    {r.round(bench[r.key])}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
