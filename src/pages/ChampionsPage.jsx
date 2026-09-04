import { useState, useMemo } from "react";
import { Card, StatCard, SectionTitle, LowSample, EmptyChart, Eyebrow } from "../components/ui/primitives.jsx";
import ChampAvatar from "../components/ChampAvatar.jsx";
import ChartBlock from "../components/ChartBlock.jsx";
import { ROSTER, CHAMP_ROLE, champColor } from "../constants/roster.js";
import { sortByDate } from "../lib/rank.js";
import { computeAgg, groupByChampion, streaksOf, movingAverage, getColor } from "../lib/stats.js";
import { round1, round2 } from "../lib/format.js";

const MA_WINDOW = 10;

/** Stats historiques importées, disponibles seulement pour les deux mains champions. */
const HISTORICAL_KEY = { Yone: "yone", "Tahm Kench": "tahm" };

export default function ChampionsPage({ data, sorted }) {
  const th = data.thresholds;
  const [active, setActive] = useState("Yone");

  const champsPlayed = useMemo(() => groupByChampion(data.games), [data.games]);
  const champMap = useMemo(
    () => Object.fromEntries(champsPlayed.map((c) => [c.champion, c])),
    [champsPlayed]
  );

  const activeGames = useMemo(
    () => sortByDate(data.games.filter((g) => g.champion === active)),
    [data.games, active]
  );
  const activeAgg = champMap[active] || computeAgg([]);
  const streaks = streaksOf(activeGames);
  const accent = champColor(active);
  const hist = data.historical[HISTORICAL_KEY[active]] || null;

  const chartData = useMemo(() => {
    const csmin = activeGames.map((g) => (g.duration ? g.cs / g.duration : 0));
    const deaths = activeGames.map((g) => Number(g.deaths) || 0);
    const damage = activeGames.map((g) => Number(g.damage) || 0);
    const csminMA = movingAverage(csmin, MA_WINDOW);
    const deathsMA = movingAverage(deaths, MA_WINDOW);
    const damageMA = movingAverage(damage, MA_WINDOW);

    let lpAcc = 0;
    let winAcc = 0;

    return activeGames.map((g, i) => {
      lpAcc += Number(g.lpChange) || 0;
      if (g.win) winAcc++;
      return {
        i: i + 1,
        csmin: round1(csmin[i]),
        csminMA: round1(csminMA[i]),
        deaths: deaths[i],
        deathsMA: round1(deathsMA[i]),
        damage: damage[i],
        damageMA: Math.round(damageMA[i]),
        wr: round1((winAcc / (i + 1)) * 100),
        lp: lpAcc,
      };
    });
  }, [activeGames]);

  const sharePct = sorted.length ? round1((activeGames.length / sorted.length) * 100) : null;

  return (
    <div>
      <SectionTitle sub="Vue d'ensemble de ton roster — clique un champion pour voir le détail.">
        Champions
      </SectionTitle>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {ROSTER.map((c) => {
          const stats = champMap[c.name];
          const isActive = active === c.name;
          const cc = champColor(c.name);
          return (
            <button
              key={c.name}
              onClick={() => setActive(c.name)}
              className="hoverable"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: 14,
                borderRadius: "var(--radius-lg)",
                textAlign: "left",
                cursor: "pointer",
                background: isActive ? `${cc}1c` : "var(--card)",
                border: `1.5px solid ${isActive ? cc : "var(--border)"}`,
                boxShadow: isActive ? `0 6px 20px ${cc}30` : "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ChampAvatar name={c.name} size={38} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text)" }}>{c.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--dim)" }}>{c.role}</div>
                </div>
              </div>
              {stats ? (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span className="tnum" style={{ color: "var(--dim)" }}>{stats.games}g</span>
                  <span className="tnum" style={{ color: getColor("wr", stats.wr, th), fontWeight: 700 }}>
                    {round1(stats.wr)}%
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "var(--dim)" }}>Pas de données</div>
              )}
            </button>
          );
        })}
      </div>

      <Card className="hero-card p-6" style={{ "--hero-color": accent }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <ChampAvatar name={active} size={64} />
          <div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 30, color: accent, lineHeight: 1.1 }}>
              {active}
            </div>
            <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 2 }}>
              {CHAMP_ROLE[active]}
              {sharePct !== null && ` — ~${sharePct}% des games trackées`}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <StatCard label="Games (tracking)" value={activeAgg.games} />
          <StatCard label="Winrate" value={`${round1(activeAgg.wr)}%`} tone={getColor("wr", activeAgg.wr, th)} />
          <StatCard
            label="KDA"
            value={round2(activeAgg.kda)}
            sub={`${round1(activeAgg.kills)}/${round1(activeAgg.deaths)}/${round1(activeAgg.assists)}`}
            tone={getColor("kda", activeAgg.kda, th)}
          />
          <StatCard label="CS/min" value={round1(activeAgg.csmin)} tone={getColor("csmin", activeAgg.csmin, th)} />
          <StatCard label="Gold/min" value={round1(activeAgg.goldmin)} />
          <StatCard label="Dégâts/game" value={Math.round(activeAgg.damageGame)} />
          <StatCard label="Vision/game" value={round1(activeAgg.visionGame)} />
          <StatCard
            label="LP gagnés"
            value={`${activeAgg.lpSum >= 0 ? "+" : ""}${round1(activeAgg.lpSum)}`}
            tone={accent}
          />
          <StatCard label="Meilleure série de victoires" value={streaks.bestWin} tone="var(--win)" />
          <StatCard label="Plus longue série de défaites" value={streaks.worstLoss} tone="var(--loss)" />
        </div>
        <LowSample n={activeAgg.games} />

        {hist && <HistoricalBlock hist={hist} accent={accent} />}

        {chartData.length > 1 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <ChartBlock
              title="Winrate cumulé (%)"
              data={chartData}
              lines={[{ key: "wr", color: accent, name: "WR%" }]}
            />
            <ChartBlock
              title={`CS/min (moy. mobile ${MA_WINDOW} games)`}
              data={chartData}
              lines={[
                { key: "csmin", color: "#3a4258", name: "CS/min", opacity: 0.4 },
                { key: "csminMA", color: accent, name: "Moy. mobile" },
              ]}
            />
            <ChartBlock
              title={`Deaths/game (moy. mobile ${MA_WINDOW} games)`}
              data={chartData}
              lines={[
                { key: "deaths", color: "#3a4258", name: "Deaths", opacity: 0.4 },
                { key: "deathsMA", color: "var(--loss)", name: "Moy. mobile" },
              ]}
            />
            <ChartBlock
              title={`Dégâts/game (moy. mobile ${MA_WINDOW} games)`}
              data={chartData}
              lines={[
                { key: "damage", color: "#3a4258", name: "Dégâts", opacity: 0.4 },
                { key: "damageMA", color: accent, name: "Moy. mobile" },
              ]}
            />
            <ChartBlock
              title="LP cumulés au fil des games"
              data={chartData}
              lines={[{ key: "lp", color: "var(--gold)", name: "LP cumulés" }]}
              full
            />
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <EmptyChart label={`Ajoute au moins 2 games ${active} pour voir les graphiques.`} />
          </div>
        )}
      </Card>
    </div>
  );
}

function HistoricalBlock({ hist, accent }) {
  const cells = [
    ["Games", hist.games],
    ["WR", `${round1((hist.wins / hist.games) * 100)}%`],
    ["W/L", `${hist.wins}W / ${hist.losses}L`],
    ["KDA", `${hist.kills}/${hist.deaths}/${hist.assists}`],
    ["LP cumulés", hist.lp],
    ["CS moy.", hist.cs],
    ["Dégâts", hist.damage.toLocaleString()],
    ["Multi-kills", `${hist.doubles}/${hist.triples}/${hist.quadras}/${hist.pentas}`],
  ];

  return (
    <Card className="p-4 my-5" style={{ borderColor: `${accent}44` }}>
      <Eyebrow color={accent} style={{ marginBottom: 10 }}>
        Historique importé (avant le début du tracking — non mélangé)
      </Eyebrow>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 10,
          fontSize: 12.5,
        }}
      >
        {cells.map(([label, value]) => (
          <div key={label}>
            <div style={{ color: "var(--dim)" }}>{label}</div>
            <div style={{ fontWeight: 700, color: "var(--text)" }}>{value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
