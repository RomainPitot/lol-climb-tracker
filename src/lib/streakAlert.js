import { streaksOf } from "./stats.js";
import { representativeGames } from "./gameModel.js";

/** Défaites d'affilée à partir desquelles proposer une pause — l'exemple du GDD lui-même
 * ("3 défaites d'affilée..."). */
const LOSS_STREAK_THRESHOLD = 3;

/**
 * Alerte proactive avant de relancer une game après une série de défaites — la détection
 * de sessions/tilt existe déjà (lib/sessions.js) mais n'était visible qu'a posteriori dans
 * une page consultée après coup. Ici, disponible au bon moment (Dashboard, juste avant de
 * requeue), pas dans un historique qu'on ne rouvre pas entre deux games.
 */
export function computeNegativeStreakAlert(data, sorted) {
  const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);
  if (!repSorted.length) return null;

  const { current, currentType } = streaksOf(repSorted);
  if (currentType !== false || current < LOSS_STREAK_THRESHOLD) return null;

  const streakGames = repSorted.slice(-current);
  const avgLp = streakGames.reduce((s, g) => s + (Number(g.lpChange) || 0), 0) / streakGames.length;

  return {
    count: current,
    avgLp,
    message: `${current} défaites d'affilée, LP moyen ${avgLp >= 0 ? "+" : ""}${avgLp.toFixed(1)} — pause recommandée avant la prochaine game.`,
  };
}
