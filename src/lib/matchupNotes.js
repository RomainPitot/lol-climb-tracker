/**
 * Notes de préparation par matchup (plan de lane) — voir GDD. Rien de tout ça n'est
 * dérivable de Riot (build/runes recommandés, conditions d'all-in, timings dangereux...) :
 * une saisie manuelle, versionnée par matchup (champion joué vs adversaire de lane, simple
 * correspondance texte comme le champ matchup existant sur les games), réutilisable avant
 * chaque nouvelle game contre le même adversaire plutôt que ressaisie chaque fois.
 */

export function matchupNoteKey(champion, opponent) {
  if (!champion || !opponent) return "";
  return `${champion.trim()}|${opponent.trim()}`.toLowerCase();
}

export function emptyMatchupNote(champion, opponent) {
  return {
    champion,
    opponent,
    recommendedBuild: "",
    recommendedRunes: "",
    firstBack: "",
    allInConditions: "",
    dangerousTimings: "",
    freezePushPlan: "",
    levelPlan: "", // 1-3 / 3-6 / post-6
    updatedAt: null,
  };
}

export function getMatchupNote(matchupNotes, champion, opponent) {
  const key = matchupNoteKey(champion, opponent);
  return key ? matchupNotes[key] || null : null;
}

/** Toutes les notes enregistrées pour un champion joué, la plus récemment modifiée
 * d'abord — pour la liste "mes plans de matchup" sur ChampionsPage. */
export function matchupNotesFor(matchupNotes, champion) {
  return Object.values(matchupNotes || {})
    .filter((n) => n.champion?.toLowerCase() === champion?.toLowerCase())
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
