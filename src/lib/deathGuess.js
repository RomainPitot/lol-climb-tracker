/**
 * Suggestion automatique (type + cause, voir constants/coaching.js) pour une mort pas
 * encore classée — TOUJOURS une approximation à confirmer ou modifier, jamais une
 * classification définitive : le "pourquoi" réel reste un jugement humain (voir GameAnalysisModal,
 * qui pré-remplit avec cette suggestion plutôt que de la forcer). Basée uniquement sur ce
 * que la Timeline expose déjà (zone/contexte déjà calculés par riotTimeline.js, wards
 * connues) — jamais une nouvelle donnée inventée. Retourne null quand aucune heuristique
 * n'est assez fiable pour proposer quoi que ce soit : mieux vaut ne rien suggérer que
 * deviner sur un cas trop ambigu (ex: mort en défendant sa base).
 */

/** Rayon/fenêtre "vision proche avant la mort" — mêmes ordres de grandeur que
 * l'approximation de vision avant objectif déjà utilisée (riotTimeline.js). */
const NEARBY_VISION_RADIUS = 2000;
const NEARBY_VISION_WINDOW_MS = 3 * 60 * 1000;

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** true/false si on peut trancher, null si on n'a pas l'info nécessaire (position
 * manquante, ou aucune ward avec timestamp connu — anciennes games). */
function hadNearbyVisionBeforeDeath(death, wardPositions) {
  if (!death.position || !wardPositions?.length) return null;
  const withTimestamp = wardPositions.filter((w) => w.ts != null);
  if (!withTimestamp.length) return null;
  return withTimestamp.some((w) => {
    const age = death.timestamp - w.ts;
    return age >= 0 && age <= NEARBY_VISION_WINDOW_MS && distance(w, death.position) <= NEARBY_VISION_RADIUS;
  });
}

export function guessDeathTag(death, wardPositions) {
  if (!death.zone || !death.context) return null;

  // Une mort de teamfight est presque toujours "liée au jeu d'équipe" plutôt qu'une
  // erreur individuelle isolée — mais on ne devine pas la cause précise (positionnement ?
  // mauvais focus ? ça reste trop variable pour une heuristique fiable).
  if (death.context === "teamfight") {
    return { type: "teamplay", cause: null };
  }

  // Mort près de sa propre base : trop ambigu (défense légitime d'un objectif/tour vs
  // erreur) pour qu'une heuristique tranche correctement.
  if (death.zone === "base") return null;

  const hadVision = hadNearbyVisionBeforeDeath(death, wardPositions);
  const ganked = (death.assists?.length || 0) >= 1;

  if (death.zone === "jungle" || death.zone === "river") {
    // Mort solo en jungle/river sans vision alliée proche dans les minutes précédentes —
    // le profil classique d'un overextend qui n'a pas vu venir l'adversaire.
    if (hadVision === false) return { type: "avoidable", cause: "overextend_no_vision" };
    return { type: "avoidable", cause: null };
  }

  if (death.zone === "lane") {
    // Mort en lane avec un allié du killer impliqué (gank) et sans vision proche : même
    // logique que ci-dessus, transposée à la lane.
    if (ganked && hadVision === false) return { type: "avoidable", cause: "overextend_no_vision" };
    // Duel 1v1 pur en lane, sans tiers impliqué : le cas le plus proche d'un "mauvais trade".
    if (!ganked) return { type: "avoidable", cause: "bad_trade" };
    return null;
  }

  return null;
}
