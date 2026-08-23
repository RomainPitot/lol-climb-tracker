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
  };
}

export const isBotLaneRole = (role) => role === "ADC" || role === "Support";
