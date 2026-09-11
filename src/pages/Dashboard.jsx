import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, ReferenceArea, ReferenceLine, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown, Percent, Zap, Swords, Trophy, Layers, Flame, Check } from "lucide-react";
import { Card, Pill, StatCard, Collapsible, EmptyChart, Eyebrow, Select, Section, SectionTitle } from "../components/ui/primitives.jsx";
import RankBadge from "../components/RankBadge.jsx";
import LadderTrack from "../components/LadderTrack.jsx";
import StatLadder from "../components/StatLadder.jsx";
import ProgressionDetails from "../components/dashboard/ProgressionDetails.jsx";
import GamesHistory from "../components/dashboard/GamesHistory.jsx";
import FocusTracker from "../components/dashboard/FocusTracker.jsx";
import PopulationReference from "../components/dashboard/PopulationReference.jsx";
import CoachBriefing from "../components/dashboard/CoachBriefing.jsx";
import RoleStatsPanel from "../components/dashboard/RoleStatsPanel.jsx";
import { PERIODS } from "../constants/game.js";
import { roleBenchmark, TIER_COLORS } from "../constants/ranks.js";
import { rankValue, rankLabel, bestRankOf, objectiveTierOf } from "../lib/rank.js";
import { buildLpChartBands, trimToRealStart } from "../lib/lpChart.js";
import { computeAgg, filterByPeriod, getColor, mostFrequentRole } from "../lib/stats.js";
import { computeGeneralAchievements } from "../lib/achievements.js";
import { representativeGames } from "../lib/gameModel.js";
import { computeGoalProgress, goalPillLabel } from "../lib/goals.js";
import { currentWinStreak, goalStreak, isStreakNotable } from "../lib/streaks.js";
import { round1, round2 } from "../lib/format.js";

const TOOLTIP_STYLE = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text)",
};

export default function Dashboard({ data, sorted, currentRank, addGame, deleteGame, deleteGames, updateGame, setSettings }) {
  const [period, setPeriod] = useState("30d");
  const [showProgression, setShowProgression] = useState(false);
  // Pont entre le rappel "morts non classées" (tout en haut) et la modale d'analyse, qui
  // vit dans GamesHistory (tout en bas) — voir UntaggedReminder/GamesHistory.
  const [pendingAnalysisId, setPendingAnalysisId] = useState(null);
  // Stats de tendance (winrate, KDA, CS/min...) : games marquées non représentatives
  // (remake, int, smurf adverse) écartées par défaut — voir Paramètres > Statistiques.
  // Le rang/LP réel (badge, courbe, meilleur rang) n'utilise jamais ce filtre : ces
  // games ont bien eu lieu et leur impact sur le rang reste réel.
  const includeExcluded = !!data.settings.includeExcludedGames;
  const repGames = useMemo(() => representativeGames(data.games, includeExcluded), [data.games, includeExcluded]);
  const repSorted = useMemo(() => representativeGames(sorted, includeExcluded), [sorted, includeExcluded]);

  const filtered = useMemo(() => filterByPeriod(repGames, period), [repGames, period]);
  const agg = useMemo(() => computeAgg(filtered), [filtered]);
  const allAgg = useMemo(() => computeAgg(repSorted), [repSorted]);
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
  // Tous les paliers visés par un objectif "atteindre un rang" (il peut y en avoir
  // plusieurs — voir Paramètres > Objectifs), pas seulement le plus élevé : ce dernier
  // (objectiveTier ci-dessus) reste le seul repère pour les benchmarks CS/min etc.
  // ci-dessous, qui ont besoin d'une seule cible, mais la frise en marque bien tous.
  const rankObjectiveTiers = useMemo(() => {
    const tiers = [...new Set(data.goals.filter((g) => g.type === "reach_rank" && g.tier).map((g) => g.tier))];
    return tiers.length ? tiers : [objectiveTier];
  }, [data.goals, objectiveTier]);

  // Série de victoires en cours, et pour chaque objectif défini, série de games qui le
  // remplissent individuellement (voir lib/streaks.js) — affichées avec une flamme dans le
  // bandeau du haut quand elles sont assez longues pour être notables.
  const winStreak = useMemo(() => currentWinStreak(sorted), [sorted]);
  const goalStreaks = useMemo(
    () => data.goals.map((g) => ({ goal: g, progress: computeGoalProgress(g, sorted), streak: goalStreak(g, sorted) })),
    [data.goals, sorted]
  );
  // CS/min et vision/min n'ont pas la même cible selon le rôle — on prend le rôle le
  // plus joué sur la fenêtre récente (elle peut mélanger plusieurs rôles) plutôt qu'un
  // repère unique valable seulement pour un laner. KDA/deaths restent partagés entre
  // rôles pour l'instant (voir constants/ranks.js roleBenchmark).
  const recent20 = useMemo(() => repSorted.slice(-20), [repSorted]);
  const dominantRole = useMemo(() => mostFrequentRole(recent20), [recent20]);
  const bench = roleBenchmark(objectiveTier, dominantRole);
  const a20 = useMemo(() => computeAgg(recent20), [recent20]);

  // Score composite rang+LP : donne une courbe continue à travers les promotions. Le
  // palier/LP réels de chaque point restent à côté (tier/div/lpAfter) pour un tooltip
  // lisible ("Émeraude II — 45 LP") plutôt que le score brut, qui ne veut rien dire seul.
  // trimToRealStart coupe un éventuel début parasite (rang jamais réglé avant le tout
  // premier vrai import/réglage — se voit à un saut de score invraisemblable) : sans ça,
  // ce départ à zéro traînerait plein de paliers jamais vraiment joués sur tout le graphique.
  // Renumérotée à partir de 1 après coupe, pour un axe des games lisible depuis le vrai début.
  const lpSeries = useMemo(() => {
    const raw = sorted.map((g) => ({
      lp: rankValue(g.rankAfterTier, g.rankAfterDiv) * 100 + Number(g.lpAfter || 0),
      tier: g.rankAfterTier,
      div: g.rankAfterDiv,
      lpAfter: Number(g.lpAfter || 0),
    }));
    return trimToRealStart(raw).map((p, i) => ({ ...p, i: i + 1 }));
  }, [sorted]);

  // Bandes/lignes de division façon u.gg (voir lib/lpChart.js) — une couleur par palier
  // (pas par division), calculées sur la plage réellement couverte par la courbe déjà coupée.
  const lpBands = useMemo(() => {
    if (lpSeries.length < 2) return null;
    const scores = lpSeries.map((p) => p.lp);
    return buildLpChartBands(Math.min(...scores), Math.max(...scores));
  }, [lpSeries]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const heroColor = TIER_COLORS[currentRank.tier] || "var(--gold)";

  return (
    <div className="reveal">
      <SectionTitle sub="Où tu en es, ce qu'il faut corriger, puis le détail — dans cet ordre.">
        Dashboard
      </SectionTitle>

      {/* NIVEAU 1 — Où j'en suis. Rang, forme du moment, distance à l'objectif.
          La courbe de LP et les succès qui traînaient ici ont été retirés : la
          première faisait doublon avec la carte "LP au fil des games" plus bas,
          les seconds ont déjà leur propre section. */}
      <Card className="hero-card p-6 mb-6" style={{ "--hero-color": heroColor }}>
        <div style={{ display: "flex", gap: "var(--sp-6)", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 300px", minWidth: 0 }}>
            <RankBadge
              name={data.settings.riotGameName ? `${data.settings.riotGameName}#${data.settings.riotTagLine || ""}` : undefined}
              tier={currentRank.tier}
              div={currentRank.div}
              lp={currentRank.lp}
            />
            <div style={{ marginTop: "var(--sp-4)", display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
              <Pill tone={allAgg.wr >= 50 ? "win" : "loss"}>
                {allAgg.wins}W / {allAgg.losses}L — {round1(allAgg.wr)}% WR
              </Pill>
              {isStreakNotable(winStreak) && (
                <Pill tone="fire" className="flame-badge" title={`${winStreak} victoires d'affilée`}>
                  <Flame size={11} style={{ marginRight: 3 }} /> {winStreak}
                </Pill>
              )}

              {data.goals.length ? (
                goalStreaks.map(({ goal, progress, streak }) => (
                  <Pill
                    key={goal.id}
                    tone={progress.met ? "win" : "gold"}
                    className={isStreakNotable(streak) ? "flame-badge" : undefined}
                    title={progress.label}
                  >
                    {progress.met && <Check size={11} style={{ marginRight: 3 }} />}
                    {goalPillLabel(goal)}
                    {isStreakNotable(streak) && <Flame size={11} style={{ marginLeft: 4 }} />}
                  </Pill>
                ))
              ) : (
                <Pill tone="gold">Objectif : {objectiveTier}</Pill>
              )}
            </div>
          </div>

          <div style={{ flex: "1 1 300px", minWidth: 240 }}>
            <Eyebrow style={{ marginBottom: "var(--sp-2)" }}>
              Objectif : {rankObjectiveTiers.join(", ")}
            </Eyebrow>
            <LadderTrack tier={currentRank.tier} div={currentRank.div} objectiveTiers={rankObjectiveTiers} />
          </div>
        </div>
      </Card>

      {/* NIVEAU 2 — Quoi faire. Une seule voix, en tête de page. */}
      <CoachBriefing
        data={data}
        sorted={sorted}
        currentRank={currentRank}
        onSelectGame={setPendingAnalysisId}
      />

      {/* NIVEAU 3 — Progression. Trois blocs qui parlaient déjà de la même chose
          (focus, comparaison à soi, repères de rang) réunis sous un seul titre,
          séparés par de l'espace plutôt que par trois bordures concurrentes. */}
      <Section
        title="Progression"
        sub="Ce que tu travailles en ce moment, et où tu en es par rapport à toi-même et à ton rang."
      >
        <FocusTracker data={data} sorted={sorted} setSettings={setSettings} />
        <RoleStatsPanel data={data} sorted={sorted} currentRank={currentRank} />
        <PopulationReference repSorted={repSorted} bench={bench} />
      </Section>

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
              // Seul un succès débloqué mérite d'être encadré : les autres restent
              // en retrait typographique, sans bordure qui les mettrait au même
              // niveau visuel que ceux réellement obtenus.
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-2)",
                  padding: "var(--sp-2) var(--sp-3)",
                  borderRadius: "var(--radius-sm)",
                  background: a.unlocked ? "rgba(212,175,55,0.1)" : "transparent",
                  border: `1px solid ${a.unlocked ? "rgba(212,175,55,0.45)" : "transparent"}`,
                  opacity: a.unlocked ? 1 : 0.4,
                }}
              >
                <Icon size={15} color={a.unlocked ? "var(--gold)" : "var(--dim)"} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: "var(--fs-xs)", fontWeight: 600, color: a.unlocked ? "var(--text)" : "var(--dim)" }}>
                  {a.label}
                </span>
              </div>
            );
          })}
        </div>

        <Eyebrow style={{ marginBottom: 12 }}>
          Progression vers le niveau {objectiveTier}{" "}
          <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
            (repères indicatifs, sur tes 20 dernières games{dominantRole ? ` — surtout ${dominantRole}` : ""})
          </span>
        </Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <StatLadder label="CS/min" value={a20.csmin} benchmark={bench.csmin} />
          <StatLadder label="Score de vision/min" value={a20.visionMin} benchmark={bench.visionmin} />
          <StatLadder label="KDA" value={a20.kda} benchmark={bench.kda} />
          <StatLadder label="Deaths/game" value={a20.deaths} benchmark={bench.deaths} invert />
        </div>
      </Collapsible>

      {/* Le sélecteur de période vivait dans la carte du rang, à ~1000px des
          chiffres qu'il filtre : un contrôle doit être à côté de ce qu'il change. */}
      <Section
        title="Statistiques"
        action={
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Période des statistiques"
            style={{ width: "auto", flexShrink: 0 }}
          >
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        }
      >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "var(--sp-3)",
        }}
      >
        <StatCard
          label="Winrate (période)"
          value={`${round1(agg.wr)}%`}
          sub={`${agg.wins}W / ${agg.losses}L — ${agg.games} games`}
          tone={getColor("wr", agg.wr, currentRank.tier)}
          icon={Percent}
        />
        <StatCard
          label="LP gagnés/perdus"
          value={`${agg.lpSum >= 0 ? "+" : ""}${round1(agg.lpSum)}`}
          tone={agg.lpSum >= 0 ? "var(--win)" : "var(--loss)"}
          icon={Zap}
        />
        <StatCard
          label="KDA moyen"
          value={round2(agg.kda)}
          sub={`${round1(agg.kills)} / ${round1(agg.deaths)} / ${round1(agg.assists)}`}
          tone={getColor("kda", agg.kda, currentRank.tier)}
          icon={Swords}
        />
        <StatCard label="LP moyen / victoire" value={`+${round1(lpPerWin)}`} tone="var(--win)" />
        <StatCard label="LP moyen / défaite" value={round1(lpPerLoss)} tone="var(--loss)" />
        <StatCard
          label="Meilleur rang (saison)"
          value={rankLabel(bestRankEver.tier, bestRankEver.div)}
          tone="var(--gold)"
          icon={Trophy}
        />
        <StatCard
          label="Games totales (tracking)"
          value={sorted.length}
          sub={`${data.historical.global.games} avant tracking`}
          icon={Layers}
        />
      </div>
      </Section>

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
          <Eyebrow>LP au fil des games (tracking) — clique pour voir le détail de la progression</Eyebrow>
          <ChevronDown
            size={16}
            color="var(--dim)"
            style={{ transform: showProgression ? "rotate(180deg)" : "none", transition: "transform .15s" }}
          />
        </button>

        <div style={{ marginTop: 10 }}>
          {lpSeries.length > 1 && lpBands ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={lpSeries} margin={{ left: 4, right: 8 }}>
                <defs>
                  {/* Courbe : mêmes couleurs que les bandes de fond, en opaque. */}
                  <linearGradient id="lpStroke" x1="0" y1="0" x2="0" y2="1">
                    {lpBands.gradientStops.map((s, i) => (
                      <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={1} />
                    ))}
                  </linearGradient>
                  {/* Remplissage sous la courbe : mêmes arrêts, translucides. */}
                  <linearGradient id="lpFill" x1="0" y1="0" x2="0" y2="1">
                    {lpBands.gradientStops.map((s, i) => (
                      <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={0.22} />
                    ))}
                  </linearGradient>
                </defs>

                {lpBands.areas.map((a) => (
                  <ReferenceArea
                    key={a.tier}
                    y1={Math.max(a.y1, lpBands.domainMin)}
                    y2={Math.min(a.y2, lpBands.domainMax)}
                    fill={a.color}
                    fillOpacity={0.07}
                    stroke="none"
                    ifOverflow="hidden"
                  />
                ))}
                {lpBands.lines.map((l) => (
                  <ReferenceLine
                    key={l.score}
                    y={l.score}
                    stroke={l.color}
                    strokeOpacity={0.45}
                    strokeDasharray="3 3"
                    ifOverflow="hidden"
                    label={{ value: l.label, position: "insideLeft", fill: l.color, fontSize: 10.5, fontWeight: 600 }}
                  />
                ))}

                <XAxis dataKey="i" stroke="var(--dim)" fontSize={11} tickLine={false} />
                <YAxis hide domain={[lpBands.domainMin, lpBands.domainMax]} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(v) => `Game #${v}`}
                  formatter={(_, __, item) => [
                    `${rankLabel(item.payload.tier, item.payload.div)} — ${item.payload.lpAfter} LP`,
                    "Rang",
                  ]}
                />
                <Area type="monotone" dataKey="lp" stroke="url(#lpStroke)" fill="url(#lpFill)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Ajoute au moins 2 games pour voir la courbe." />
          )}
        </div>

        {showProgression && <ProgressionDetails sorted={sorted} currentRank={currentRank} />}
      </Card>

      <GamesHistory
        data={data}
        sorted={sorted}
        addGame={addGame}
        deleteGame={deleteGame}
        deleteGames={deleteGames}
        updateGame={updateGame}
        pendingAnalysisId={pendingAnalysisId}
        onPendingAnalysisHandled={() => setPendingAnalysisId(null)}
      />
    </div>
  );
}
