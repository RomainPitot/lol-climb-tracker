import { Card, Eyebrow } from "../ui/primitives.jsx";
import { computeAgg } from "../../lib/stats.js";
import { round1, round2 } from "../../lib/format.js";
import { TIERS, TIER_COLORS, roleBenchmark } from "../../constants/ranks.js";
import { tierLevelForMetric } from "../../lib/rankLevel.js";

const MIN_GAMES = 5;

const METRICS = [
  { key: "csmin", benchKey: "csmin", label: "CS/min", round: round1, invert: false },
  { key: "visionMin", benchKey: "visionmin", label: "Score de vision/min", round: round1, invert: false },
  { key: "kda", benchKey: "kda", label: "KDA", round: round2, invert: false },
  { key: "deaths", benchKey: "deaths", label: "Deaths/game", round: round1, invert: true },
];

/**
 * "Tu es déjà au niveau Or sur cette métrique, mais Fer sur cette autre" — idée
 * utilisateur (12/09). roleBenchmark(tier, role) ne renvoie ailleurs qu'UN rang à la fois
 * (le rang courant ou l'objectif, voir PopulationReference/StatLadder) ; ici on le boucle
 * sur tous les tiers (Fer→Diamant — Maître+ partagent le repère de Diamant, voir
 * BENCHMARKS) pour situer chaque métrique individuellement sur toute la ladder,
 * indépendamment du rang réel du joueur. Signal motivant tôt en saison (Fer/Bronze/Argent)
 * quand le rang global stagne mais qu'une métrique précise est déjà largement au niveau.
 */
export default function RankLadderComparison({ repSorted, role }) {
  if (repSorted.length < MIN_GAMES) return null;
  const agg = computeAgg(repSorted.slice(-20));

  return (
    <Card className="p-4 mb-6">
      <Eyebrow style={{ marginBottom: 4 }}>Ta ladder par métrique</Eyebrow>
      <p style={{ fontSize: 11, color: "var(--dim)", marginBottom: 14 }}>
        Où chaque métrique te situerait, isolément, sur Fer → Diamant — indépendamment de ton rang réel actuel.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {METRICS.map((m) => (
          <MetricRung key={m.key} metric={m} value={agg[m.key]} role={role} />
        ))}
      </div>
    </Card>
  );
}

function MetricRung({ metric: m, value, role }) {
  const tier = tierLevelForMetric(value, role, m.benchKey, m.invert);
  const tierIdx = tier ? TIERS.indexOf(tier) : -1;
  const nextTier = TIERS[tierIdx + 1];
  const nextTarget = nextTier ? roleBenchmark(nextTier, role)[m.benchKey] : null;
  const diff = nextTarget == null ? null : m.invert ? value - nextTarget : nextTarget - value;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--fs-sm)", color: "var(--dim)", fontWeight: 600 }}>{m.label}</span>
        <span className="tnum" style={{ fontSize: "var(--fs-sm)" }}>
          <span style={{ color: "var(--text)" }}>{m.round(value)}</span>{" — "}
          <span style={{ color: tier ? TIER_COLORS[tier] : "var(--dim)", fontWeight: 700 }}>
            {tier ? `niveau ${tier}` : "sous Fer"}
          </span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {TIERS.map((t, i) => (
          <div
            key={t}
            title={t}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: i <= tierIdx ? TIER_COLORS[t] : "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--dim)", marginTop: 4 }}>
        {diff != null
          ? `${m.round(Math.max(0, diff))} pour passer niveau ${nextTier}`
          : tier === TIERS[TIERS.length - 1]
          ? "Niveau plafond (Diamant) atteint sur cette métrique — le repère ne va pas plus loin."
          : null}
      </div>
    </div>
  );
}
