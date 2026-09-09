/**
 * Games récentes dont au moins une mort (issue de la Timeline, voir riotTimeline.js)
 * n'a pas encore été classée à la main (type/cause, voir GameAnalysisModal) — le GDD
 * insiste sur le tagging fait à chaud (dans les 24h) : sans rappel, ces morts restent
 * "non classée" indéfiniment et une partie de la valeur coaching se perd.
 */
export function findUntaggedDeathGames(sorted, limit = 5) {
  const found = [];
  for (let i = sorted.length - 1; i >= 0 && found.length < limit; i--) {
    const g = sorted[i];
    const deaths = g.timelineSummary?.deaths;
    if (!deaths?.length) continue;
    const tags = g.deathTags || [];
    const hasUntagged = deaths.some((_, idx) => !tags[idx]?.type);
    if (hasUntagged) found.push(g);
  }
  return found; // la plus récente d'abord
}
