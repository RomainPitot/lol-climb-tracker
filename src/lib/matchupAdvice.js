import { matchupsFor } from "./matchups.js";
import { getMatchupNote } from "./matchupNotes.js";

/**
 * Prompt "comment gagner ce matchup" — assemble ce qu'on connaît déjà (historique perso
 * chiffré + plan de lane enregistré, s'il existe) plutôt que de faire deviner un conseil
 * générique à l'IA sans données. S'il n'y a ni historique ni plan, le dit explicitement :
 * jamais de conseil présenté comme personnalisé quand il n'y a rien pour l'étayer.
 */
export function buildMatchupAdvicePrompt(champion, opponent, sorted, matchupNotes) {
  const stats = matchupsFor(sorted, champion).find((m) => m.opponent.toLowerCase() === opponent.toLowerCase());
  const note = getMatchupNote(matchupNotes, champion, opponent);

  const lines = [];
  if (stats && !stats.lowSample) {
    lines.push(`Historique perso : ${stats.games} game(s), ${Math.round(stats.wr)}% WR, KDA ${stats.kda.toFixed(2)}.`);
  } else if (stats) {
    lines.push(`Historique perso : seulement ${stats.games} game(s) — échantillon trop faible pour être fiable.`);
  } else {
    lines.push("Aucune game trackée sur ce matchup jusqu'ici.");
  }

  if (note) {
    if (note.recommendedBuild) lines.push(`Build prévu : ${note.recommendedBuild}`);
    if (note.recommendedRunes) lines.push(`Runes prévues : ${note.recommendedRunes}`);
    if (note.allInConditions) lines.push(`Conditions d'all-in déjà notées : ${note.allInConditions}`);
    if (note.dangerousTimings) lines.push(`Timings dangereux déjà notés : ${note.dangerousTimings}`);
    if (note.freezePushPlan) lines.push(`Plan freeze/push déjà noté : ${note.freezePushPlan}`);
    if (note.levelPlan) lines.push(`Plan par niveau déjà noté : ${note.levelPlan}`);
  } else {
    lines.push("Aucun plan de lane enregistré pour ce matchup.");
  }

  return `=== MATCHUP ===
${champion} vs ${opponent}
${lines.join("\n")}

=== DEMANDE ===
En 5-8 lignes maximum, clair et concret : comment gagner ce matchup — le(s) point(s) faible(s) à exploiter chez
l'adversaire, le plan de trade/all-in le plus réaliste, et un piège précis à éviter. Base-toi uniquement sur les
infos ci-dessus et ta connaissance générale du jeu, n'invente aucune statistique qui ne serait pas fournie.`;
}
