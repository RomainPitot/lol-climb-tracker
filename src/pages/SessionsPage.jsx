import { useMemo } from "react";
import { Flame, Snowflake, AlertTriangle } from "lucide-react";
import { Card, Pill, SectionTitle, EmptyChart } from "../components/ui/primitives.jsx";
import { detectSessions } from "../lib/sessions.js";
import { round1, round2 } from "../lib/format.js";

const badgeIcon = { marginRight: 3, display: "inline" };

export default function SessionsPage({ data }) {
  const sessions = useMemo(() => detectSessions(data.games), [data.games]);

  return (
    <div>
      <SectionTitle sub="Une session = games jouées avec moins de 3h d'écart entre elles.">
        Sessions
      </SectionTitle>

      {sessions.length === 0 && (
        <Card className="p-6">
          <EmptyChart label="Aucune session détectée pour l'instant." />
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sessions.map((s) => (
          <Card key={s.id} className="p-4">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                  {s.date}
                </div>
                <Pill>{s.games} games</Pill>
                <Pill tone={s.wr >= 50 ? "win" : "loss"}>
                  {s.wins}W / {s.losses}L — {round1(s.wr)}%
                </Pill>
                <Pill tone="gold">
                  {s.lpSum >= 0 ? "+" : ""}
                  {round1(s.lpSum)} LP
                </Pill>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {s.isPositive && (
                  <Pill tone="win">
                    <Flame size={11} style={badgeIcon} />
                    Session très positive
                  </Pill>
                )}
                {s.isNegative && (
                  <Pill tone="loss">
                    <Snowflake size={11} style={badgeIcon} />
                    Session très négative
                  </Pill>
                )}
                {s.drop && (
                  <Pill tone="loss">
                    <AlertTriangle size={11} style={badgeIcon} />
                    Baisse de perf
                  </Pill>
                )}
                {s.streaks.bestWin >= 3 && <Pill tone="win">Série de {s.streaks.bestWin}V</Pill>}
                {s.streaks.worstLoss >= 3 && <Pill tone="loss">Série de {s.streaks.worstLoss}D</Pill>}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 10,
                fontSize: 12.5,
                color: "var(--text)",
              }}
            >
              <Metric label="Champion principal" value={s.mainChamp} />
              <Metric label="KDA moyen" value={round2(s.kda)} />
              <Metric label="CS/min moyen" value={round1(s.csmin)} />
              <Metric label="Dégâts moyens" value={Math.round(s.damageGame)} />
              <Metric label="Deaths/game" value={round1(s.deaths)} />
              <Metric label="Durée moyenne" value={`${round1(s.avgDuration)} min`} />
              <Metric
                label="Perf. Yone"
                labelColor="var(--yone)"
                value={s.yone.games ? `${s.yone.games}g · ${round1(s.yone.wr)}%` : "—"}
              />
              <Metric
                label="Perf. Tahm"
                labelColor="var(--tahm)"
                value={s.tahm.games ? `${s.tahm.games}g · ${round1(s.tahm.wr)}%` : "—"}
              />
              <Metric label="Concentration moy." value={`${round1(s.focus)}/5`} />
              <Metric label="Tilt moyen" value={`${round1(s.tilt)}/5`} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, labelColor = "var(--dim)" }) {
  return (
    <div>
      <div style={{ color: labelColor, fontSize: 11.5 }}>{label}</div>
      <div className="tnum" style={{ fontWeight: 700, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
