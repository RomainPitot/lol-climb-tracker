import { useState, useMemo } from "react";
import { Card, StatCard, SectionTitle, LowSample, EmptyChart, Eyebrow } from "../components/ui/primitives.jsx";
import ChampAvatar from "../components/ChampAvatar.jsx";
import ChartBlock from "../components/ChartBlock.jsx";
import { champColor } from "../constants/roster.js";
import { sortByDate } from "../lib/rank.js";
import { computeAgg, groupByChampion, roleForChampion, streaksOf, movingAverage, getColor } from "../lib/stats.js";
import { representativeGames } from "../lib/gameModel.js";
import { matchupsFor, MIN_MATCHUP_GAMES } from "../lib/matchups.js";
import MatchupNotesPanel from "../components/MatchupNotesPanel.jsx";
import MatchupAdviceCard from "../components/MatchupAdviceCard.jsx";
import { round1, round2 } from "../lib/format.js";

const MA_WINDOW = 10;

/** Stats historiques importées, disponibles seulement pour les deux mains champions. */
const HISTORICAL_KEY = { Yone: "yone", "Tahm Kench": "tahm" };

export default function ChampionsPage({ data, sorted, currentRank, saveMatchupNote, deleteMatchupNote }) {
  // Games marquées non représentatives (remake, int, smurf adverse) écartées par défaut
  // des stats/tendances par champion — voir Paramètres > Statistiques.
  const includeExcluded = !!data.settings.includeExcludedGames;
  const repGames = useMemo(() => representativeGames(data.games, includeExcluded), [data.games, includeExcluded]);
  const repSorted = useMemo(() => representativeGames(sorted, includeExcluded), [sorted, includeExcluded]);

  // Uniquement les champions réellement joués — jamais un roster figé à la main, sinon
  // on affiche des champions jamais lancés ("Pas de données") et on cache ceux joués
  // hors de la petite liste de mains suivie par ailleurs (historique, matchups...).
  const champsPlayed = useMemo(() => groupByChampion(repGames), [repGames]);
  const champMap = useMemo(
    () => Object.fromEntries(champsPlayed.map((c) => [c.champion, c])),
    [champsPlayed]
  );
  // Rôle le plus fréquent observé sur les games de ce champion — jamais une table figée
  // à la main, jamais deviné au hasard pour un champion qui n'a pas encore de rôle dominant.
  const roleOf = (champion) => roleForChampion(repGames, champion) || "?";

  const [active, setActive] = useState(() => champsPlayed[0]?.champion || null);

  const activeGames = useMemo(
    () => sortByDate(repGames.filter((g) => g.champion === active)),
    [repGames, active]
  );
  const activeAgg = active ? champMap[active] || computeAgg([]) : computeAgg([]);
  const streaks = streaksOf(activeGames);
  const accent = active ? champColor(active) : "var(--gold)";
  // CS/min et vision/min se lisent très différemment selon le rôle (un support à
  // 1 CS/min n'est pas "mauvais") — voir constants/ranks.js ROLE_CSMIN_FACTOR.
  const activeRole = active ? roleOf(active) : null;
  const hist = active ? data.historical[HISTORICAL_KEY[active]] || null : null;

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

  const sharePct = repSorted.length && active ? round1((activeGames.length / repSorted.length) * 100) : null;
  const matchups = useMemo(() => (active ? matchupsFor(repGames, active) : []), [repGames, active]);

  return (
    <div>
      <SectionTitle sub="Les champions que tu as réellement joués — clique-en un pour voir le détail.">
        Champions
      </SectionTitle>

      {champsPlayed.length === 0 ? (
        <EmptyChart label="Aucune game trackée pour l'instant — ajoute une game pour voir apparaître tes champions ici." />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {champsPlayed.map((stats) => {
            const isActive = active === stats.champion;
            const cc = champColor(stats.champion);
            return (
              // Seul le champion sélectionné porte une bordure colorée : les autres
              // restent des tuiles plates. Avant, 14 cartes bordées se disputaient
              // l'attention et on ne repérait plus la sélection courante d'un coup d'œil.
              <button
                key={stats.champion}
                onClick={() => setActive(stats.champion)}
                className="hoverable"
                aria-pressed={isActive}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--sp-2)",
                  padding: "var(--sp-3)",
                  borderRadius: "var(--radius-md)",
                  textAlign: "left",
                  cursor: "pointer",
                  background: isActive ? `${cc}1c` : "var(--bg-elevated)",
                  border: `1px solid ${isActive ? cc : "transparent"}`,
                  boxShadow: isActive ? `0 6px 20px ${cc}30` : "none",
                  transition: "background-color var(--fast) var(--ease), border-color var(--fast) var(--ease)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ChampAvatar name={stats.champion} size={38} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "var(--fs-base)", color: "var(--text)" }}>
                      {stats.champion}
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--dim)" }}>{roleOf(stats.champion)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)" }}>
                  <span className="tnum" style={{ color: "var(--dim)" }}>{stats.games}g</span>
                  <span className="tnum" style={{ color: getColor("wr", stats.wr, currentRank.tier), fontWeight: 700 }}>
                    {round1(stats.wr)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {active && (
      <Card className="hero-card p-6" style={{ "--hero-color": accent }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <ChampAvatar name={active} size={64} />
          <div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "var(--fs-2xl)", color: accent, lineHeight: 1.1 }}>
              {active}
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--dim)", marginTop: 2 }}>
              {activeRole}
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
          <StatCard label="Winrate" value={`${round1(activeAgg.wr)}%`} tone={getColor("wr", activeAgg.wr, currentRank.tier)} />
          <StatCard
            label="KDA"
            value={round2(activeAgg.kda)}
            sub={`${round1(activeAgg.kills)}/${round1(activeAgg.deaths)}/${round1(activeAgg.assists)}`}
            tone={getColor("kda", activeAgg.kda, currentRank.tier)}
          />
          <StatCard
            label="CS/min"
            value={round1(activeAgg.csmin)}
            tone={getColor("csmin", activeAgg.csmin, currentRank.tier, activeRole)}
          />
          <StatCard label="Gold/min" value={round1(activeAgg.goldmin)} />
          <StatCard label="Dégâts/game" value={Math.round(activeAgg.damageGame)} />
          <StatCard
            label="Score de vision/min"
            value={round1(activeAgg.visionMin)}
            tone={getColor("visionmin", activeAgg.visionMin, currentRank.tier, activeRole)}
          />
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

        {matchups.length > 0 && <MatchupsBlock matchups={matchups} accent={accent} tier={currentRank.tier} />}

        <MatchupAdviceCard champion={active} sorted={repSorted} data={data} />

        <MatchupNotesPanel
          champion={active}
          data={data}
          saveMatchupNote={saveMatchupNote}
          deleteMatchupNote={deleteMatchupNote}
        />

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
      )}
    </div>
  );
}

/** Tendances par adversaire de lane rencontré — nécessite le champ matchup renseigné à la
 * main sur les games (voir GameFormFields), aucune correspondance automatique côté Riot. */
function MatchupsBlock({ matchups, accent, tier }) {
  return (
    <Card variant="flat" className="p-4 my-5">
      <Eyebrow color={accent} style={{ marginBottom: 10 }}>
        Performance par matchup (adversaire de lane)
      </Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
        {matchups.map((m) => (
          <div
            key={m.opponent}
            style={{
              padding: "var(--sp-2) var(--sp-3)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-elevated)",
            }}
            title={m.lowSample ? "Échantillon trop petit pour être fiable" : undefined}
          >
            <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--text)" }}>{m.opponent}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", marginTop: 3 }}>
              <span style={{ color: "var(--dim)" }}>{m.games}g{m.lowSample ? " (≈)" : ""}</span>
              <span className="tnum" style={{ color: getColor("wr", m.wr, tier), fontWeight: 700 }}>
                {round1(m.wr)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--dim)", marginTop: "var(--sp-2)" }}>
        (≈) = moins de {MIN_MATCHUP_GAMES} games, winrate peu fiable.
      </div>
    </Card>
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
    <Card variant="flat" className="p-4 my-5">
      <Eyebrow color={accent} style={{ marginBottom: 10 }}>
        Historique importé (avant le début du tracking — non mélangé)
      </Eyebrow>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 10,
          fontSize: "var(--fs-sm)",
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
