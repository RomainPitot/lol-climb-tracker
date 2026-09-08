/** En dessous, une série n'est pas assez marquante pour être mise en avant visuellement. */
const STREAK_MIN_GAMES = 3;

export function isStreakNotable(n) {
  return n >= STREAK_MIN_GAMES;
}

/** Nombre de victoires consécutives depuis la game la plus récente. */
export function currentWinStreak(sorted) {
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (!sorted[i].win) break;
    streak++;
  }
  return streak;
}

/**
 * Série en cours de games qui remplissent, chacune individuellement, le critère d'un
 * objectif — distinct de computeGoalProgress (lib/goals.js), qui mesure une progression
 * globale/moyenne, pas une suite de bonnes games. Une game hors sujet (ex: pas le bon
 * champion pour un objectif par champion) est ignorée plutôt que de casser la série.
 *
 * Renvoie 0 pour les types d'objectif sans notion de "bonne/mauvaise" game individuelle
 * (reach_rank — voir currentWinStreak à la place, games_champion, games_without_champion —
 * ce sont des compteurs absolus, pas une suite de games à évaluer une par une).
 */
export function goalStreak(goal, sorted) {
  const passes = (g) => {
    switch (goal.type) {
      case "wr_champion":
        return g.champion === goal.champion ? g.win : null;
      case "deaths_below":
        return Number(g.deaths) <= goal.threshold;
      case "csmin_above":
        return g.duration ? g.cs / g.duration >= goal.threshold : false;
      case "kda_above": {
        const deaths = Number(g.deaths) || 0;
        const kda = deaths > 0 ? (Number(g.kills) + Number(g.assists)) / deaths : Number(g.kills) + Number(g.assists);
        return kda >= goal.threshold;
      }
      case "kills_above":
        return Number(g.kills) >= goal.threshold;
      default:
        return null;
    }
  };

  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const ok = passes(sorted[i]);
    if (ok === null) continue; // game hors sujet — ignorée, ne casse pas la série
    if (!ok) break;
    streak++;
  }
  return streak;
}
