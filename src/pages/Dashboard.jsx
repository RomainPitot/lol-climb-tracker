import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown } from "lucide-react";
import { Card, Pill, StatCard, Collapsible, EmptyChart } from "../components/ui/primitives.jsx";
import RankBadge from "../components/RankBadge.jsx";
import LadderTrack from "../components/LadderTrack.jsx";
import StatLadder from "../components/StatLadder.jsx";
import ProgressionDetails from "../components/dashboard/ProgressionDetails.jsx";
import GamesHistory from "../components/dashboard/GamesHistory.jsx";
import { PERIODS } from "../constants/game.js";
import { BENCHMARKS } from "../constants/ranks.js";
import { rankValue, rankLabel, bestRankOf, objectiveTierOf } from "../lib/rank.js";
import { computeAgg, filterByPeriod, getColor } from "../lib/stats.js";
import { computeGeneralAchievements } from "../lib/achievements.js";
import { round1, round2 } from "../lib/format.js";

const TOOLTIP_STYLE = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text)",
};

export default function Dashboard({ data, sorted, currentRank, deleteGame, deleteGames, updateGame }) {
  const [period, setPeriod] = useState("30d");
  const [showProgression, setShowProgression] = useState(false);
  const th = data.thresholds;

  const filtered = useMemo(() => filterByPeriod(data.games, period), [data.games, period]);
  const agg = useMemo(() => computeAgg(filtered), [filtered]);
  const allAgg = useMemo(() => computeAgg(sorted), [sorted]);
  const bestRankEver = useMemo(() => bestRankOf(sorted, currentRank), [sorted, currentRank]);
  const achievements = useMemo(
    () => computeGeneralAchievements(sorted, currentRank, data.goals),
    [sorted, currentRank, data.goals]
  );

  // Moyenne des LP sur les seules games où le signe correspond au résultat :
  // une victoire à -3 LP (decay, MMR bas) fausserait la lecture.
  const lpPerWin = useMemo(() => {
    const wins = filtered.filter((g) => g.win && g.lpChange > 0);
    return wins.length ? wins.reduce((a, g) => a + Number(g.lpChange), 0) / wins.length : 0;
  }, [filtered]);
  const lpPerLoss = useMemo(() => {
    const losses = filtered.filter((g) => !g.win && g.lpChange < 0);
    return losses.length ? losses.reduce((a, g) => a + Number(g.lpChange), 0) / losses.length : 0;
  }, [filtered]);

  const objectiveTier = objectiveTierOf(data.goals);
  const bench = BENCHMARKS[objectiveTier] || BENCHMARKS.Diamant;
  const a20 = useMemo(() => computeAgg(sorted.slice(-20)), [sorted]);

  // Score composite rang+LP : donne une courbe continue à travers les promotions.
  const lpSeries = useMemo(
    () =>
      sorted.map((g, i) => ({
        i: i + 1,
        lp: rankValue(g.rankAfterTier, g.rankAfterDiv) * 100 + Number(g.lpAfter || 0),
      })),
    [sorted]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "var(--dim)", fontWeight: 500, marginBottom: 6 }}>
            SITUATION ACTUELLE
          </div>
          <RankBadge tier={currentRank.tier} div={currentRank.div} lp={currentRank.lp} />
          <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Pill tone={allAgg.wr >= 50 ? "win" : "loss"}>
              {allAgg.wins}W / {allAgg.losses}L — {round1(allAgg.wr)}% WR
            </Pill>
            <Pill tone="gold">Objectif : {objectiveTier}</Pill>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                padding: "6px 11px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: period === p.id ? "var(--gold)" : "var(--card)",
                color: period === p.id ? "#1a1406" : "var(--dim)",
                border: `1px solid ${period === p.id ? "var(--gold)" : "var(--border)"}`,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <Card className="p-4 mb-5">
        <div style={{ fontSize: 12, color: "var(--dim)", fontWeight: 600, marginBottom: 4 }}>
          PROGRESSION VERS MASTER
        </div>
        <LadderTrack tier={currentRank.tier} div={currentRank.div} />
      </Card>

      <Collapsible
        title={`Succès — ${unlockedCount}/${achievements.length} débloqués`}
        sub={`Progression vers le niveau ${objectiveTier}`}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {achievements.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: a.unlocked ? "rgba(212,175,55,0.1)" : "var(--bg-elevated)",
                  border: `1px solid ${a.unlocked ? "var(--gold)" : "var(--border)"}`,
                  opacity: a.unlocked ? 1 : 0.45,
                }}
              >
                <Icon size={16} color={a.unlocked ? "var(--gold)" : "var(--dim)"} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: a.unlocked ? "var(--text)" : "var(--dim)" }}>
                  {a.label}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 12, color: "var(--dim)", fontWeight: 600, marginBottom: 10 }}>
          PROGRESSION VERS LE NIVEAU {objectiveTier.toUpperCase()}{" "}
          <span style={{ fontWeight: 400 }}>(repères indicatifs, sur tes 20 dernières games)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <StatLadder label="CS/min" value={a20.csmin} benchmark={bench.csmin} />
          <StatLadder label="KDA" value={a20.kda} benchmark={bench.kda} />
          <StatLadder label="Deaths/game" value={a20.deaths} benchmark={bench.deaths} invert />
        </div>
      </Collapsible>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="Winrate (période)"
          value={`${round1(agg.wr)}%`}
          sub={`${agg.wins}W / ${agg.losses}L — ${agg.games} games`}
          tone={getColor("wr", agg.wr, th)}
        />
        <StatCard
          label="LP gagnés/perdus"
          value={`${agg.lpSum >= 0 ? "+" : ""}${round1(agg.lpSum)}`}
          tone={agg.lpSum >= 0 ? "var(--win)" : "var(--loss)"}
        />
        <StatCard
          label="KDA moyen"
          value={round2(agg.kda)}
          sub={`${round1(agg.kills)} / ${round1(agg.deaths)} / ${round1(agg.assists)}`}
          tone={getColor("kda", agg.kda, th)}
        />
        <StatCard label="LP moyen / victoire" value={`+${round1(lpPerWin)}`} tone="var(--win)" />
        <StatCard label="LP moyen / défaite" value={round1(lpPerLoss)} tone="var(--loss)" />
        <StatCard
          label="Meilleur rang (saison)"
          value={rankLabel(bestRankEver.tier, bestRankEver.div)}
          tone="var(--gold)"
        />
        <StatCard
          label="Games totales (tracking)"
          value={sorted.length}
          sub={`${data.historical.global.games} avant tracking`}
        />
      </div>

      <Card className="p-4 mb-6">
        <button
          onClick={() => setShowProgression((s) => !s)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--dim)", fontWeight: 600 }}>
            LP AU FIL DES GAMES (TRACKING) — clique pour voir le détail de la progression
          </span>
          <ChevronDown
            size={16}
            color="var(--dim)"
            style={{ transform: showProgression ? "rotate(180deg)" : "none", transition: "transform .15s" }}
          />
        </button>

        <div style={{ marginTop: 10 }}>
          {lpSeries.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={lpSeries}>
                <defs>
                  <linearGradient id="lpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="i" stroke="var(--dim)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--dim)" fontSize={11} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(v) => `Game #${v}`}
                  formatter={(v) => [v, "Score rang"]}
                />
                <Area type="monotone" dataKey="lp" stroke="var(--gold)" fill="url(#lpGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Ajoute au moins 2 games pour voir la courbe." />
          )}
        </div>

        {showProgression && <ProgressionDetails sorted={sorted} currentRank={currentRank} />}
      </Card>

      <GamesHistory
        sorted={sorted}
        deleteGame={deleteGame}
        deleteGames={deleteGames}
        updateGame={updateGame}
      />
    </div>
  );
}
