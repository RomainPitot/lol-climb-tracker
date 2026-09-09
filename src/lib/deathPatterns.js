/**
 * Repère un pattern récurrent dans le TIMING/la ZONE des morts, à travers plusieurs games
 * (voir GDD : "morts systématiques en repush post-kill entre 10 et 15 min" par ex.) — une
 * seule game ne suffit pas à dire "c'est récurrent", il faut regarder l'ensemble. Ne
 * remonte quelque chose que si un pattern se détache clairement (voir MIN_SHARE) : mieux
 * vaut ne rien dire qu'inventer une tendance à partir de trop peu de données.
 */

const MIN_DEATHS = 8; // sous ce total, la répartition n'est pas assez fiable pour parler de pattern.
const MIN_SHARE = 0.45; // une catégorie doit peser au moins ça du total pour être "le" pattern.

const PHASE_LABEL = { early: "early game (0-14 min)", mid: "mid game (14-25 min)", late: "late game (25 min+)" };
const ZONE_LABEL = { lane: "en lane", river: "en river", jungle: "en jungle", base: "près de la base" };

function dominant(counts, total, labels) {
  const [topKey, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
  if (!topKey || topCount / total < MIN_SHARE) return null;
  return { key: topKey, label: labels[topKey] || topKey, count: topCount, total, sharePct: Math.round((topCount / total) * 100) };
}

export function summarizeDeathPatterns(games) {
  const phaseCounts = { early: 0, mid: 0, late: 0 };
  const zoneCounts = {};
  let total = 0;
  let teamfightCount = 0;

  for (const g of games) {
    for (const d of g.timelineSummary?.deaths || []) {
      total++;
      if (d.phase) phaseCounts[d.phase] = (phaseCounts[d.phase] || 0) + 1;
      if (d.zone) zoneCounts[d.zone] = (zoneCounts[d.zone] || 0) + 1;
      if (d.context === "teamfight") teamfightCount++;
    }
  }

  if (total < MIN_DEATHS) return null;

  const phase = dominant(phaseCounts, total, PHASE_LABEL);
  const zone = dominant(zoneCounts, total, ZONE_LABEL);
  const teamfightShare = teamfightCount / total;
  const context =
    teamfightShare >= MIN_SHARE
      ? { label: "en teamfight", sharePct: Math.round(teamfightShare * 100) }
      : 1 - teamfightShare >= MIN_SHARE
        ? { label: "en duel/solo", sharePct: Math.round((1 - teamfightShare) * 100) }
        : null;

  if (!phase && !zone && !context) return null;
  return { total, phase, zone, context };
}
