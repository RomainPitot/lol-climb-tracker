import { useMemo } from "react";
import { Eye, Handshake, Skull, Swords, Coins, TrendingUp, Crosshair } from "lucide-react";
import { Card, Eyebrow, Pill } from "../ui/primitives.jsx";
import { representativeGames } from "../../lib/gameModel.js";
import { mostFrequentRole } from "../../lib/stats.js";
import { computeSupportStats, computeLaneStats, computeAdcStats, computeJungleStats } from "../../lib/roleStats.js";
import { roleBenchmark } from "../../constants/ranks.js";
import { round1, round2 } from "../../lib/format.js";

/** Fenêtre d'analyse — même ordre de grandeur que le reste du Dashboard. */
const WINDOW = 20;
/** Sous ce nombre de games dans le rôle, une moyenne ne veut rien dire. */
const MIN_GAMES = 3;

const COMPUTE_BY_ROLE = {
  Support: computeSupportStats,
  Mid: computeLaneStats,
  Top: computeLaneStats,
  ADC: computeAdcStats,
  Jungle: computeJungleStats,
};

/**
 * Panneau de stats spécifique au rôle réellement joué. Un seul panneau à la fois (celui
 * du rôle dominant récent) : afficher les cinq rôles empilés reviendrait à remettre un
 * mur d'informations dont la plupart ne concernent pas le joueur.
 */
export default function RoleStatsPanel({ data, sorted, currentRank }) {
  const role = useMemo(() => {
    const rep = representativeGames(sorted, !!data.settings.includeExcludedGames);
    return mostFrequentRole(rep.slice(-WINDOW));
  }, [sorted, data.settings.includeExcludedGames]);

  const stats = useMemo(() => {
    const compute = COMPUTE_BY_ROLE[role];
    if (!compute) return null;
    const rep = representativeGames(sorted, !!data.settings.includeExcludedGames);
    const roleGames = rep.slice(-WINDOW).filter((g) => g.role === role);
    if (roleGames.length < MIN_GAMES) return null;
    return compute(roleGames);
  }, [sorted, data.settings.includeExcludedGames, role]);

  if (!stats) return null;
  const bench = roleBenchmark(currentRank.tier, role);

  return (
    <Card variant="flat" className="p-4 mb-4">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
        <Eyebrow style={{ marginBottom: 0 }}>Ton rôle — {role}</Eyebrow>
        <Pill tone="neutral">{stats.games} games</Pill>
      </div>

      {role === "Support" && <SupportBlock stats={stats} bench={bench} />}
      {(role === "Mid" || role === "Top") && <LaneBlock stats={stats} bench={bench} />}
      {role === "ADC" && <AdcBlock stats={stats} bench={bench} />}
      {role === "Jungle" && <JungleBlock stats={stats} />}
    </Card>
  );
}

function SupportBlock({ stats, bench }) {
  const visionOk = stats.visionMin >= bench.visionmin;
  return (
    <>
      <Grid>
        <Metric
          icon={Eye}
          label="Score de vision/min"
          value={round2(stats.visionMin)}
          tone={visionOk ? "var(--win)" : "var(--loss)"}
          sub={`repère ${round2(bench.visionmin)} à ton rang`}
        />
        {stats.wards ? (
          <Metric
            icon={Eye}
            label="Wards par game"
            value={round1(stats.wards.placedPerGame)}
            sub={
              stats.wards.clearRatio != null
                ? `${round1(stats.wards.destroyedPerGame)} détruites · ${round1(stats.wards.controlPerGame)} control`
                : "—"
            }
          />
        ) : (
          <Metric icon={Eye} label="Wards par game" value="—" sub="aucune game avec timeline" />
        )}
        <Metric icon={Handshake} label="Assists par game" value={round1(stats.assistsPerGame)} sub="présence dans les kills de l'équipe" />
        <Metric
          icon={Skull}
          label="Morts par game"
          value={round1(stats.deathsPerGame)}
          tone={stats.deathsPerGame <= bench.deaths ? "var(--win)" : "var(--loss)"}
          sub={`repère ${round1(bench.deaths)}`}
        />
        {/* Dégâts volontairement sans code couleur : un enchanteur (Lulu, Janna) fera
            toujours moins de dégâts qu'un Pyke ou un Thresh, ce n'est pas un défaut. */}
        <Metric icon={Swords} label="Dégâts par game" value={Math.round(stats.damagePerGame).toLocaleString("fr-FR")} sub="dépend beaucoup du champion" />
      </Grid>

      {stats.deathSplit && (
        <DeathSplitNote
          split={stats.deathSplit}
          highSoloNote="te faire prendre seul (rotation, pose de ward) coûte plus cher qu'un engage raté, c'est le premier levier."
          lowSoloNote="le profil normal d'un support qui engage ou qui peel."
        />
      )}
      {stats.wards && stats.wards.gamesCovered < stats.games && (
        <Caveat>Wards calculées sur {stats.wards.gamesCovered} des {stats.games} games (les autres n'ont pas de timeline).</Caveat>
      )}
    </>
  );
}

function LaneBlock({ stats, bench }) {
  const visionOk = stats.visionMin >= bench.visionmin;
  const csPoints = [stats.csAt10, stats.csAt15, stats.csAt20].filter(Boolean);
  const csGamesCovered = csPoints.length ? Math.max(...csPoints.map((c) => c.gamesCovered)) : 0;
  return (
    <>
      <Grid>
        <Metric icon={Crosshair} label="CS/min à 10 min" value={stats.csAt10 ? round1(stats.csAt10.perMin) : "—"} sub={stats.csAt10 ? null : "pas assez de games avec timeline"} />
        <Metric icon={Crosshair} label="CS/min à 15 min" value={stats.csAt15 ? round1(stats.csAt15.perMin) : "—"} />
        <Metric icon={Crosshair} label="CS/min à 20 min" value={stats.csAt20 ? round1(stats.csAt20.perMin) : "—"} />
        <Metric
          icon={Coins}
          label="Gold diff @15"
          value={stats.goldDiff15 ? `${stats.goldDiff15.value >= 0 ? "+" : ""}${Math.round(stats.goldDiff15.value)}` : "—"}
          tone={stats.goldDiff15 ? (stats.goldDiff15.value >= 0 ? "var(--win)" : "var(--loss)") : undefined}
          sub="vs l'adversaire de lane"
        />
        <Metric
          icon={Eye}
          label="Score de vision/min"
          value={round2(stats.visionMin)}
          tone={visionOk ? "var(--win)" : "var(--loss)"}
          sub={`repère ${round2(bench.visionmin)} à ton rang`}
        />
        <Metric icon={Swords} label="Dégâts par game" value={Math.round(stats.damagePerGame).toLocaleString("fr-FR")} sub="dépend beaucoup du champion" />
      </Grid>

      {stats.deathPhases && (
        <p className="prose" style={{ fontSize: "var(--fs-sm)", color: "var(--dim)", marginTop: "var(--sp-4)" }}>
          Tes morts se répartissent {stats.deathPhases.earlyPct}% en early (avant 14 min), {stats.deathPhases.midPct}% en mid,{" "}
          {stats.deathPhases.latePct}% en late.
        </p>
      )}
      {csGamesCovered > 0 && csGamesCovered < stats.games && (
        <Caveat>CS/min par intervalle calculé sur {csGamesCovered} des {stats.games} games (les autres n'ont pas de timeline ou n'ont pas duré assez longtemps).</Caveat>
      )}
    </>
  );
}

function AdcBlock({ stats, bench }) {
  const csOk = stats.csmin >= bench.csmin;
  return (
    <>
      <Grid>
        <Metric icon={Crosshair} label="CS/min" value={round1(stats.csmin)} tone={csOk ? "var(--win)" : "var(--loss)"} sub={`repère ${round1(bench.csmin)} à ton rang`} />
        <Metric icon={Swords} label="Dégâts par game" value={Math.round(stats.damagePerGame).toLocaleString("fr-FR")} sub="ton rôle principal en teamfight" />
        {/* Vision volontairement sans code couleur ici : elle est en général portée par le
            support, un ADC bas en vision n'est pas nécessairement en faute. */}
        <Metric icon={Eye} label="Score de vision/min" value={round2(stats.visionMin)} sub="généralement porté par ton support" />
      </Grid>

      {stats.deathSplit && (
        <DeathSplitNote
          split={stats.deathSplit}
          highSoloNote="mourir isolé (en lane, en rotation) avant même d'arriver au teamfight coûte le plus cher — c'est le levier à travailler en premier."
          lowSoloNote="tes morts arrivent surtout en combat groupé — le positionnement en teamfight est le levier le plus rentable."
        />
      )}
    </>
  );
}

function JungleBlock({ stats }) {
  return (
    <>
      <Grid>
        <Metric
          icon={TrendingUp}
          label="Camps/min"
          value={stats.campsPerMin != null ? round2(stats.campsPerMin) : "—"}
          sub={stats.campsPerMin != null ? "camps neutres seuls, hors minions de lane" : "pas assez de games avec cette donnée"}
        />
        <Metric icon={Swords} label="Dégâts par game" value={Math.round(stats.damagePerGame).toLocaleString("fr-FR")} />
        <Metric
          icon={Skull}
          label="Morts en early invade/game"
          value={stats.earlyInvadeDeathsPerGame != null ? round1(stats.earlyInvadeDeathsPerGame) : "—"}
          sub="zone jungle, avant 14 min — approximation de position"
        />
        {stats.objectives && (
          <Metric
            icon={TrendingUp}
            label="Objectifs pris vs donnés"
            value={`${stats.objectives.taken} / ${stats.objectives.given}`}
            tone={stats.objectives.taken >= stats.objectives.given ? "var(--win)" : "var(--loss)"}
            sub="dragons, hérauts, nashors, grubs"
          />
        )}
        {stats.ganks && (
          <Metric icon={Crosshair} label="Ganks tagués" value={`${stats.ganks.total}`} sub={`${stats.ganks.successPct}% réussis (tag manuel)`} />
        )}
      </Grid>

      <Caveat>
        Le taux de réussite des ganks n'est pas dans la Timeline Riot (aucun événement dédié) — seuls les ganks tagués à la main (voir "Analyser" sur une game) comptent ici.
        {stats.jungleCsGamesCovered < stats.games &&
          ` Camps/min calculé sur ${stats.jungleCsGamesCovered} des ${stats.games} games (les imports plus anciens ne séparent pas encore les camps neutres du CS total).`}
      </Caveat>
    </>
  );
}

function Grid({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "var(--sp-4)" }}>{children}</div>;
}

function DeathSplitNote({ split, highSoloNote, lowSoloNote }) {
  return (
    <p className="prose" style={{ fontSize: "var(--fs-sm)", color: "var(--dim)", marginTop: "var(--sp-4)" }}>
      {split.teamfightPct}% de tes morts arrivent en combat groupé, {split.soloPct}% isolée —{" "}
      {split.soloPct >= 50 ? highSoloNote : lowSoloNote}{" "}
      <span style={{ opacity: 0.75 }}>(approximation de contexte, pas une donnée Riot brute)</span>
    </p>
  );
}

function Caveat({ children }) {
  return <p style={{ fontSize: "var(--fs-xs)", color: "var(--dim)", marginTop: "var(--sp-2)" }}>{children}</p>;
}

function Metric({ icon: Icon, label, value, sub, tone }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: "var(--sp-1)" }}>
        <Icon size={13} color="var(--dim)" style={{ flexShrink: 0 }} />
        <span className="eyebrow">{label}</span>
      </div>
      <div
        className="tnum"
        style={{
          fontFamily: "var(--display)",
          fontSize: "var(--fs-xl)",
          fontWeight: 700,
          color: tone || "var(--text)",
          lineHeight: "var(--lh-tight)",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: "var(--fs-xs)", color: "var(--dim)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
