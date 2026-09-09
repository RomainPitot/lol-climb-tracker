import { matchupsFor } from "./matchups.js";

/** LCU assignedPosition (toujours en minuscules côté session, voir ChampSelectPage
 * POSITION_LABEL) → rôle français utilisé par data.championPool. */
const LCU_TO_FR_ROLE = { top: "Top", jungle: "Jungle", middle: "Mid", bottom: "ADC", utility: "Support" };

export function poolRoleFor(assignedPosition) {
  return LCU_TO_FR_ROLE[assignedPosition] || null;
}

/**
 * Classe les champions de la pool (pour le rôle assigné) du meilleur au moins bon choix
 * contre l'adversaire de lane déjà révélé — seul signal fiable disponible : l'historique
 * perso par matchup (lib/matchups.js). Sans adversaire révélé, ou sans historique
 * suffisant pour un champion donné, ce champion reste juste non classé (stats: null),
 * à sa place dans la pool plutôt que déplacé par un jugement inventé.
 */
export function rankPoolForMatchup(poolChampionNames, enemyLanerName, sorted) {
  return poolChampionNames
    .map((champion) => {
      if (!enemyLanerName) return { champion, stats: null };
      const stats = matchupsFor(sorted, champion).find((m) => m.opponent.toLowerCase() === enemyLanerName.toLowerCase());
      return { champion, stats: stats && !stats.lowSample ? stats : null };
    })
    .sort((a, b) => (b.stats?.wr ?? -1) - (a.stats?.wr ?? -1));
}
