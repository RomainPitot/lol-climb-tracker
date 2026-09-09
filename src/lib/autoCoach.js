import { computeAgg } from "./stats.js";
import { roleBenchmark } from "../constants/ranks.js";
import { computeAlerts } from "./alerts.js";
import { computePriorities } from "./priorities.js";
import { computeFocus } from "./focus.js";
import { representativeGames } from "./gameModel.js";
import { DEATH_TYPES, DEATH_CAUSES } from "../constants/coaching.js";
import { rankLabel } from "./rank.js";

const deathTypeLabel = (id) => DEATH_TYPES.find((t) => t.id === id)?.label;
const deathCauseLabel = (id) => DEATH_CAUSES.find((c) => c.id === id)?.label;

const RECENT_WINDOW = 20;
/** Écart minimum (en % du repère) pour compter comme point fort/faible — sous ce seuil,
 * l'écart est dans le bruit normal, pas un vrai signal (même logique que priorities.js). */
const MIN_GAP_PCT = 0.08;

/**
 * "Coach automatique" — PAS une vraie IA : une synthèse en français, entièrement calculée
 * à partir des signaux déjà en place ailleurs dans l'app (alertes, priorités, correctifs,
 * repères de rôle, timeline de la dernière game). Se recalcule à chaque nouvelle game
 * importée, sans bouton — mais reste explicitement présenté comme automatique/mécanique,
 * jamais comme un vrai jugement d'IA, pour ne jamais faire croire à une analyse plus
 * intelligente que ce qu'elle est réellement (même principe que tout le reste du GDD :
 * jamais de valeur/jugement inventé au-delà de ce que les chiffres soutiennent).
 */
export function buildAutoCoachReport(data, sorted, currentRank) {
  const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);
  if (!repSorted.length) return null;

  const lastGame = repSorted[repSorted.length - 1];
  const gameReport = buildGameSection(lastGame, currentRank);

  const recent = repSorted.slice(-RECENT_WINDOW);
  const agg = computeAgg(recent);
  const bench = roleBenchmark(currentRank.tier, lastGame.role);
  const { strengths, weaknesses } = compareToRole(agg, bench);

  const alerts = computeAlerts(data, sorted);
  const priorities = computePriorities(data, sorted, currentRank);
  const toFocus = [...alerts, ...priorities].slice(0, 4).map((a) => a.message);

  const focus = computeFocus(sorted, data.settings);

  return { game: gameReport, strengths, weaknesses, toFocus, focus, sampleSize: recent.length };
}

function compareToRole(agg, bench) {
  const metrics = [
    { key: "csmin", label: "CS/min", current: agg.csmin, target: bench.csmin, invert: false, decimals: 1 },
    { key: "visionMin", label: "Vision/min", current: agg.visionMin, target: bench.visionmin, invert: false, decimals: 2 },
    { key: "kda", label: "KDA", current: agg.kda, target: bench.kda, invert: false, decimals: 2 },
    { key: "deaths", label: "Deaths/game", current: agg.deaths, target: bench.deaths, invert: true, decimals: 1 },
  ];

  const strengths = [];
  const weaknesses = [];
  for (const m of metrics) {
    if (!m.target) continue;
    const gapPct = m.invert ? (m.target - m.current) / m.target : (m.current - m.target) / m.target;
    if (gapPct >= MIN_GAP_PCT) {
      strengths.push(`${m.label} au-dessus du repère de ton rôle (${m.current.toFixed(m.decimals)} vs ${m.target.toFixed(m.decimals)}).`);
    } else if (gapPct <= -MIN_GAP_PCT) {
      weaknesses.push(`${m.label} en retrait vs le repère de ton rôle (${m.current.toFixed(m.decimals)} vs ${m.target.toFixed(m.decimals)}).`);
    }
  }
  return { strengths, weaknesses };
}

function buildGameSection(g, currentRank) {
  const lines = [];
  lines.push(
    `${g.champion} (${g.role}) — ${g.win ? "Victoire" : "Défaite"}, ${g.kills}/${g.deaths}/${g.assists}, ${g.lpChange >= 0 ? "+" : ""}${g.lpChange} LP.`
  );

  const t = g.timelineSummary;
  if (t) {
    const d10 = t.diffs?.[10];
    const d15 = t.diffs?.[15];
    if (d15?.csDiff != null) {
      lines.push(`Lane @15 : CS ${d15.csDiff >= 0 ? "+" : ""}${d15.csDiff}, or ${d15.goldDiff >= 0 ? "+" : ""}${d15.goldDiff}.`);
    } else if (d10?.csDiff != null) {
      lines.push(`Lane @10 : CS ${d10.csDiff >= 0 ? "+" : ""}${d10.csDiff}, or ${d10.goldDiff >= 0 ? "+" : ""}${d10.goldDiff}.`);
    }

    if (t.deaths?.length) {
      const tagged = g.deathTags?.find((tag) => tag?.type);
      const idxTagged = tagged ? g.deathTags.indexOf(tagged) : -1;
      if (idxTagged >= 0) {
        const cause = tagged.cause ? ` — ${deathCauseLabel(tagged.cause) || tagged.cause}` : "";
        lines.push(`Mort classée : ${deathTypeLabel(tagged.type) || tagged.type}${cause}.`);
      } else {
        lines.push(`${t.deaths.length} mort(s) — encore aucune classée (type/cause) dans l'analyse détaillée.`);
      }
    }

    const lostObjNoVision = t.objectives?.filter((o) => o.takenByMyTeam && o.myTeamHadVisionApprox === false) || [];
    if (lostObjNoVision.length) {
      lines.push(`${lostObjNoVision.length} objectif(s) pris sans vision ≈ posée avant (approximation).`);
    }
  }

  return { game: g, lines, rank: rankLabel(currentRank.tier, currentRank.div) };
}
