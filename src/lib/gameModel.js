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
