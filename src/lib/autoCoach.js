import { computeAgg } from "./stats.js";
import { roleBenchmark } from "../constants/ranks.js";
import { computeAlerts } from "./alerts.js";
import { computePriorities } from "./priorities.js";
import { computeFocus } from "./focus.js";
import { representativeGames } from "./gameModel.js";
import { summarizeDeathPatterns } from "./deathPatterns.js";
import { DEATH_TYPES, DEATH_CAUSES } from "../constants/coaching.js";
import { rankLabel } from "./rank.js";

const deathTypeLabel = (id) => DEATH_TYPES.find((t) => t.id === id)?.label;
const deathCauseLabel = (id) => DEATH_CAUSES.find((c) => c.id === id)?.label;

const RECENT_WINDOW = 20;
/** Écart minimum (en % du repère) pour compter comme point fort/faible — sous ce seuil,
 * l'écart est dans le bruit normal, pas un vrai signal (même logique que priorities.js). */
const MIN_GAP_PCT = 0.08;
/** Écart à partir duquel le ton monte d'un cran (verdict plus sévère) — un léger retard
 * n'appelle pas le même degré de fermeté qu'un très gros retard. */
const SEVERE_GAP_PCT = 0.2;

/**
 * "Coach automatique" — PAS une vraie IA : une synthèse en français, entièrement calculée
 * à partir des signaux déjà en place ailleurs dans l'app (alertes, priorités, correctifs,
 * repères de rôle, patterns de morts, timeline de la dernière game). Se recalcule à chaque
 * nouvelle game importée, sans bouton. Le ton imite volontairement un coach exigeant
 * (direct, jamais de flatterie gratuite, toujours une raison + une action) — mais reste
 * explicitement annoncé comme mécanique dans l'UI (voir AutoCoachCard), jamais comme un
 * vrai jugement d'IA : le texte est plus sec, pas plus intelligent que les chiffres qui le
 * soutiennent (même principe que tout le reste du GDD).
 */
export function buildAutoCoachReport(data, sorted, currentRank) {
  const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);
  if (!repSorted.length) return null;

  const lastGame = repSorted[repSorted.length - 1];
  const recent = repSorted.slice(-RECENT_WINDOW);
  const deathPattern = summarizeDeathPatterns(recent);

  const gameReport = buildGameSection(lastGame, currentRank);

  const agg = computeAgg(recent);
  const bench = roleBenchmark(currentRank.tier, lastGame.role);
  const { strengths, weaknesses } = compareToRole(agg, bench, deathPattern);

  const alerts = computeAlerts(data, sorted);
  const priorities = computePriorities(data, sorted, currentRank);
  const toFocus = [...alerts, ...priorities].slice(0, 4).map((a) => a.message);

  const focus = computeFocus(sorted, data.settings);

  return { game: gameReport, strengths, weaknesses, toFocus, focus, sampleSize: recent.length, deathPattern };
}

/** Action concrète par métrique — générique (on n'a pas de cause plus fine que le chiffre
 * lui-même sauf pour les morts, où le pattern détecté sert de raison réelle). */
const METRIC_ADVICE = {
  csmin: "Reprends la gestion de wave (freeze/slow push, voir Learn) et compte les vagues ratées, pas juste le total en fin de game.",
  visionMin: "Achète plus de control wards et pose-les avant les combats d'objectif, pas après.",
  kda: "Chaque mort doit rapporter plus à l'équipe qu'elle ne coûte — sinon c'est un pari, pas un plan.",
  deaths: "Classe tes morts dans l'analyse détaillée : tant que tu ne sais pas pourquoi tu meurs, tu ne corriges rien.",
};

function deathPatternPhrase(deathPattern) {
  if (!deathPattern) return null;
  const parts = [];
  if (deathPattern.zone) parts.push(deathPattern.zone.label);
  if (deathPattern.phase) parts.push(`en ${deathPattern.phase.label}`);
  if (deathPattern.context) parts.push(deathPattern.context.label);
  if (!parts.length) return null;
  const lead = deathPattern.zone || deathPattern.phase || deathPattern.context;
  return `${lead.sharePct}% de tes morts récentes arrivent ${parts.join(", ")} — ce n'est pas la malchance, c'est un pattern.`;
}

function compareToRole(agg, bench, deathPattern) {
  const metrics = [
    { key: "csmin", label: "CS/min", current: agg.csmin, target: bench.csmin, invert: false, decimals: 1 },
    { key: "visionMin", label: "Score de vision/min", current: agg.visionMin, target: bench.visionmin, invert: false, decimals: 2 },
    { key: "kda", label: "KDA", current: agg.kda, target: bench.kda, invert: false, decimals: 2 },
    { key: "deaths", label: "Deaths/game", current: agg.deaths, target: bench.deaths, invert: true, decimals: 1 },
  ];

  const strengths = [];
  const weaknesses = [];
  for (const m of metrics) {
    if (!m.target) continue;
    const gapPct = m.invert ? (m.target - m.current) / m.target : (m.current - m.target) / m.target;
    const cur = m.current.toFixed(m.decimals);
    const tgt = m.target.toFixed(m.decimals);

    if (gapPct >= MIN_GAP_PCT) {
      // Le coach ne flatte jamais gratuitement : un point fort est noté, pas célébré —
      // et sert surtout à dire que ce n'est pas là qu'il faut chercher le problème.
      strengths.push({ key: m.key, text: `${m.label} correct pour ton rang (${cur} vs ${tgt} attendu).` });
    } else if (gapPct <= -MIN_GAP_PCT) {
      const severe = gapPct <= -SEVERE_GAP_PCT;
      // Pour une métrique inversée (deaths : moins = mieux), être "en retard" veut dire
      // être AU-DESSUS du repère, pas en dessous — l'inverse de csmin/vision/kda.
      const direction = m.invert ? "au-dessus des" : "sous les";
      const verdict = severe
        ? `${m.label} à ${cur}, largement ${direction} ${tgt} attendus à ton rang.`
        : `${m.label} à ${cur}, ${direction} ${tgt} attendus à ton rang.`;
      const reason = (m.key === "deaths" && deathPatternPhrase(deathPattern)) || null;
      const action = METRIC_ADVICE[m.key];
      weaknesses.push({
        key: m.key,
        gapPct,
        verdict,
        reason,
        action,
        text: [verdict, reason, action].filter(Boolean).join(" "),
      });
    }
  }
  return { strengths, weaknesses };
}

export function buildGameSection(g, currentRank) {
  const lines = [];
  lines.push(
    `${g.champion} (${g.role}) — ${g.win ? "Victoire" : "Défaite"}, ${g.kills}/${g.deaths}/${g.assists}, ${g.lpChange >= 0 ? "+" : ""}${g.lpChange} LP.`
  );

  const t = g.timelineSummary;
  if (t) {
    const d10 = t.diffs?.[10];
    const d15 = t.diffs?.[15];
    const d = d15?.csDiff != null ? { min: 15, ...d15 } : d10?.csDiff != null ? { min: 10, ...d10 } : null;
    if (d) {
      if (d.csDiff < 0 || d.goldDiff < 0) {
        lines.push(`Lane @${d.min} : CS ${d.csDiff}, or ${d.goldDiff}. Tu as perdu ta lane avant même le premier gros combat — c'est souvent là que la game a basculé.`);
      } else {
        lines.push(`Lane @${d.min} : CS +${d.csDiff}, or +${d.goldDiff}. Lane gagnée — si la game s'est perdue, ce n'est pas là qu'il faut chercher.`);
      }
    }

    if (t.deaths?.length) {
      const tagged = g.deathTags?.find((tag) => tag?.type);
      const idxTagged = tagged ? g.deathTags.indexOf(tagged) : -1;
      if (idxTagged >= 0) {
        const cause = tagged.cause ? ` — ${deathCauseLabel(tagged.cause) || tagged.cause}` : "";
        lines.push(`Mort classée : ${deathTypeLabel(tagged.type) || tagged.type}${cause}.`);
      } else {
        lines.push(`${t.deaths.length} mort(s), aucune classée encore. Tu ne peux pas corriger ce que tu n'as pas identifié — va les classer.`);
      }
    }

    const lostObjNoVision = t.objectives?.filter((o) => o.takenByMyTeam && o.myTeamHadVisionApprox === false) || [];
    if (lostObjNoVision.length) {
      lines.push(`${lostObjNoVision.length} objectif(s) pris sans vision ≈ posée avant (approximation). Ça passe une fois, pas trois.`);
    }
  }

  return { game: g, lines, rank: rankLabel(currentRank.tier, currentRank.div) };
}
