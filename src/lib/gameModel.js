/** Game vierge pré-remplie avec l'instant courant — base du formulaire d'ajout. */
export function emptyGame() {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    champion: "Yone",
    role: "Mid",
    roleStatus: "Rôle principal",
    win: true,
    lpChange: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    cs: 0,
    duration: 25,
    damage: 0,
    gold: 0,
    visionScore: 0,
    matchup: "",
    matchupAdc: "",
    matchupSupport: "",
    side: "Blue",
    firstDeath: false,
    firstBlood: false,
    avoidableDeaths: 0,
    deathCause: "",
    comment: "",
    gameComment: "",
    feeling: 3,
    focus: 3,
    tilt: 1,
    excluded: false,
    excludedReason: "",
    // Détail minute par minute (diffs CS/or/XP, morts avec contexte, wards, objectifs) —
    // voir lib/riotTimeline.js. Toujours vide pour une game ajoutée à la main : seul
    // l'import Riot le remplit. `deathTags` (classification par mort par le coach — type,
    // cause) est un tableau parallèle à `timelineSummary.deaths`, une entrée par mort.
    timelineSummary: null,
    deathTags: [],
    // Build final (items + runes) — voir lib/importers.js riotMatchToGame. Toujours vide
    // pour une game ajoutée à la main.
    build: null,
    // Notes tactiques manuelles (wave/recall/roam/teamfight) — voir constants/coaching.js
    // et GameAnalysisModal. Jamais rempli automatiquement : la Timeline Riot n'expose
    // aucun de ces événements.
    tacticalNotes: [],
    // Lien vers l'enregistrement de la game (Twitch/YouTube...), si le joueur en a un —
    // Riot ne fournit aucune vidéo, ça reste à la charge du joueur (voir GameAnalysisModal).
    vodUrl: "",
    // Comparaison manuelle build réel vs plan de matchup enregistré (voir
    // constants/coaching.js BUILD_VS_PLAN_TAGS, lib/matchupNotes.js) — jamais déduit
    // automatiquement, le plan recommandé est du texte libre.
    buildTag: "",
  };
}

export const isBotLaneRole = (role) => role === "ADC" || role === "Support";

/**
 * Games à utiliser pour toute analyse de tendance/performance (agrégats, benchmarks,
 * prompts de bilan) — exclut par défaut celles marquées non représentatives (remake,
 * teammate qui feed volontairement, smurf adverse...), qui polluent la lecture de la
 * vraie progression sans rien dire du niveau réel du joueur. `includeExcluded` (option
 * "réafficher", voir Paramètres) les remet dans le calcul si explicitement demandé.
 * L'historique (GamesHistory) et le suivi de rang/LP ne passent jamais par ici : ces
 * games ont bien eu lieu et leur impact sur le rang reste réel, seule leur valeur
 * d'analyse de skill est écartée.
 */
export function representativeGames(games, includeExcluded = false) {
  return includeExcluded ? games : games.filter((g) => !g.excluded);
}
