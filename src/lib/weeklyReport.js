import { computeAgg } from "./stats.js";
import { computeAlerts } from "./alerts.js";
import { computePriorities } from "./priorities.js";
import { evaluateCorrection, CORRECTION_STATUS_LABEL } from "./corrections.js";
import { representativeGames } from "./gameModel.js";
import { rankLabel } from "./rank.js";
import { gameDate } from "./format.js";

const WEEK_MS = 7 * 86400000;

/** Delta signé, ou null si pas de semaine précédente à comparer (première semaine de
 * tracking) — jamais un delta contre zéro, qui laisserait croire à une vraie tendance. */
function deltaStr(current, previous, decimals = 1, unit = "") {
  if (previous == null) return "";
  const d = current - previous;
  return ` (${d >= 0 ? "+" : ""}${d.toFixed(decimals)}${unit} vs semaine précédente)`;
}

/**
 * Rapport hebdomadaire (voir GDD coaching) — assemble ce qui existe déjà plutôt que de
 * reconstruire un moteur séparé : alertes, priorités, correctifs actifs, agrégats des 7
 * derniers jours vs les 7 précédents. Pas de génération IA côté serveur (cohérent avec le
 * reste de l'app) : un prompt à coller, via le même AiCoachPanel que les autres bilans.
 * Retourne null s'il n'y a aucune game cette semaine — rien à rapporter.
 */
export function buildWeeklyReportPrompt(data, sorted, currentRank) {
  const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);
  const now = Date.now();
  const thisWeek = repSorted.filter((g) => now - gameDate(g).getTime() <= WEEK_MS);
  if (!thisWeek.length) return null;
  const lastWeek = repSorted.filter((g) => {
    const age = now - gameDate(g).getTime();
    return age > WEEK_MS && age <= 2 * WEEK_MS;
  });

  const aggThis = computeAgg(thisWeek);
  const aggLast = lastWeek.length ? computeAgg(lastWeek) : null;

  const alerts = computeAlerts(data, sorted);
  const priorities = computePriorities(data, sorted, currentRank);

  const activeCorrections = (data.corrections || [])
    .map((c) => evaluateCorrection(c, sorted, data.settings))
    .filter((c) => c.status !== "todo");
  const regressions = activeCorrections.filter((c) => c.derivedStatus === "regression");

  const chiffresCles = [
    `Winrate : ${aggThis.wr.toFixed(0)}% (${aggThis.wins}W/${aggThis.losses}L)${aggLast ? deltaStr(aggThis.wr, aggLast.wr, 0, "pt") : ""}`,
    `LP cumulés : ${aggThis.lpSum >= 0 ? "+" : ""}${aggThis.lpSum.toFixed(0)}${aggLast ? deltaStr(aggThis.lpSum, aggLast.lpSum, 0) : ""}`,
    `KDA moyen : ${aggThis.kda.toFixed(2)}${aggLast ? deltaStr(aggThis.kda, aggLast.kda, 2) : ""}`,
  ];

  const alertsBlock = alerts.length ? `\n=== ALERTES ACTIVES ===\n${alerts.map((a) => `- ${a.message}`).join("\n")}\n` : "";
  const prioritiesBlock = priorities.length ? `\n=== PRIORITÉS EN COURS ===\n${priorities.map((p) => `- ${p.message}`).join("\n")}\n` : "";
  const correctionsBlock = activeCorrections.length
    ? `\n=== CORRECTIFS SUIVIS ===\n${activeCorrections
        .map((c) => `- ${c.title} : ${CORRECTION_STATUS_LABEL[c.derivedStatus]}${c.derivedStatus === "regression" ? " — ATTENTION, retombé après correction" : ""}`)
        .join("\n")}\n`
    : "";

  return `=== RAPPORT HEBDOMADAIRE ===
Rang actuel : ${rankLabel(currentRank.tier, currentRank.div)}
Cette semaine : ${thisWeek.length} game(s)${lastWeek.length ? ` (semaine précédente : ${lastWeek.length} game(s))` : " (pas de semaine précédente à comparer)"}

=== CHIFFRES CLÉS ===
${chiffresCles.map((l) => `- ${l}`).join("\n")}
${alertsBlock}${prioritiesBlock}${correctionsBlock}
=== DEMANDE ===
En 30 secondes de lecture : résume où j'en suis cette semaine (mieux/moins bien que la semaine précédente et pourquoi si visible dans les chiffres ci-dessus), signale en premier toute régression listée ci-dessus, puis donne un plan de travail limité à 1-2 priorités réellement actionnables pour la semaine prochaine — pas une liste de dix choses. Reste concis, à puces, sans blabla.${regressions.length ? " Une régression est en cours, insiste dessus." : ""}`;
}
