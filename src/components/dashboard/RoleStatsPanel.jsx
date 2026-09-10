import { useMemo } from "react";
import { Eye, Handshake, Skull, Swords } from "lucide-react";
import { Card, Eyebrow, Pill } from "../ui/primitives.jsx";
import { representativeGames } from "../../lib/gameModel.js";
import { mostFrequentRole } from "../../lib/stats.js";
import { computeSupportStats } from "../../lib/roleStats.js";
import { roleBenchmark } from "../../constants/ranks.js";
import { round1, round2 } from "../../lib/format.js";

/** Fenêtre d'analyse — même ordre de grandeur que le reste du Dashboard. */
const WINDOW = 20;
/** Sous ce nombre de games dans le rôle, une moyenne ne veut rien dire. */
const MIN_GAMES = 3;

/**
 * Panneau de stats spécifique au rôle réellement joué. Un seul panneau à la fois (celui
 * du rôle dominant récent) : afficher les quatre rôles empilés reviendrait à remettre un
 * mur d'informations dont trois quarts ne concernent pas le joueur.
 * Seul le Support est implémenté pour l'instant — les autres rôles suivront.
 */
export default function RoleStatsPanel({ data, sorted, currentRank }) {
  const stats = useMemo(() => {
    const rep = representativeGames(sorted, !!data.settings.includeExcludedGames);
    const recent = rep.slice(-WINDOW);
    if (mostFrequentRole(recent) !== "Support") return null;
    const roleGames = recent.filter((g) => g.role === "Support");
    if (roleGames.length < MIN_GAMES) return null;
    return computeSupportStats(roleGames);
  }, [sorted, data.settings.includeExcludedGames]);

  if (!stats) return null;

  const bench = roleBenchmark(currentRank.tier, "Support");
  const visionOk = stats.visionMin >= bench.visionmin;

  return (
    <Card variant="flat" className="p-4 mb-4">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
        <Eyebrow style={{ marginBottom: 0 }}>Ton rôle — Support</Eyebrow>
        <Pill tone="neutral">{stats.games} games</Pill>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "var(--sp-4)" }}>
        <Metric
          icon={Eye}
          label="Vision/min"
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

        <Metric
          icon={Handshake}
          label="Assists par game"
          value={round1(stats.assistsPerGame)}
          sub="présence dans les kills de l'équipe"
        />

        <Metric
          icon={Skull}
          label="Morts par game"
          value={round1(stats.deathsPerGame)}
          tone={stats.deathsPerGame <= bench.deaths ? "var(--win)" : "var(--loss)"}
          sub={`repère ${round1(bench.deaths)}`}
        />

        {/* Dégâts volontairement sans code couleur : un enchanteur (Lulu, Janna) fera
            toujours moins de dégâts qu'un Pyke ou un Thresh, ce n'est pas un défaut. */}
        <Metric
          icon={Swords}
          label="Dégâts par game"
          value={Math.round(stats.damagePerGame).toLocaleString("fr-FR")}
          sub="dépend beaucoup du champion"
        />
      </div>

      {stats.deathSplit && (
        <p className="prose" style={{ fontSize: "var(--fs-sm)", color: "var(--dim)", marginTop: "var(--sp-4)" }}>
          {stats.deathSplit.teamfightPct}% de tes morts arrivent en combat groupé, {stats.deathSplit.soloPct}% isolée
          {stats.deathSplit.soloPct >= 50
            ? " — te faire prendre seul (rotation, pose de ward) coûte plus cher qu'un engage raté, c'est le premier levier."
            : " — le profil normal d'un support qui engage ou qui peel."}{" "}
          <span style={{ opacity: 0.75 }}>(approximation de contexte, pas une donnée Riot brute)</span>
        </p>
      )}

      {stats.wards && stats.wards.gamesCovered < stats.games && (
        <p style={{ fontSize: "var(--fs-xs)", color: "var(--dim)", marginTop: "var(--sp-2)" }}>
          Wards calculées sur {stats.wards.gamesCovered} des {stats.games} games (les autres n'ont pas de timeline).
        </p>
      )}
    </Card>
  );
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
