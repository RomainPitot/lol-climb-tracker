import { isBotLaneRole } from "./gameModel.js";

/** Sample minimal avant d'oser afficher/citer un pourcentage de matchup — sous ce seuil,
 * une seule game ferait passer un adversaire de 0% à 100% de winrate, ce qui n'a aucune
 * valeur statistique. */
export const MIN_MATCHUP_GAMES = 3;

/** Nom(s) d'adversaire de lane renseigné(s) sur une game, selon le rôle (bot lane a deux
 * adversaires distincts — ADC et Support — les autres rôles n'en ont qu'un). */
export function laneOpponents(g) {
  if (isBotLaneRole(g.role)) {
    return [g.matchupAdc, g.matchupSupport].filter(Boolean);
  }
  return g.matchup ? [g.matchup] : [];
}

/**
 * Agrège les games d'un champion par adversaire de lane rencontré (nom saisi à la main,
 * simple correspondance de texte — pas d'id Data Dragon stocké sur les games). Ne retient
 * que les games où le champ matchup a été renseigné : rien à agréger sinon, et on ne
 * devine jamais un adversaire non saisi.
 */
export function matchupsFor(games, champion) {
  const byOpponent = new Map();
  for (const g of games) {
    if (g.champion !== champion) continue;
    for (const opp of laneOpponents(g)) {
      const key = opp.trim();
      if (!key) continue;
      if (!byOpponent.has(key)) byOpponent.set(key, []);
      byOpponent.get(key).push(g);
    }
  }

  return [...byOpponent.entries()]
    .map(([opponent, opponentGames]) => {
      const wins = opponentGames.filter((g) => g.win).length;
      const kda = opponentGames.reduce(
        (acc, g) => {
          acc.kills += Number(g.kills) || 0;
          acc.deaths += Number(g.deaths) || 0;
          acc.assists += Number(g.assists) || 0;
          return acc;
        },
        { kills: 0, deaths: 0, assists: 0 }
      );
      return {
        opponent,
        games: opponentGames.length,
        wins,
        losses: opponentGames.length - wins,
        wr: (wins / opponentGames.length) * 100,
        kda: kda.deaths > 0 ? (kda.kills + kda.assists) / kda.deaths : kda.kills + kda.assists,
        lowSample: opponentGames.length < MIN_MATCHUP_GAMES,
      };
    })
    .sort((a, b) => b.games - a.games);
}

/** Ligne "mon historique perso sur ce matchup précis" — utilisée par le prompt de champ
 * select en plus de l'historique par champion déjà existant. Omise (jamais devinée) tant
 * que l'échantillon est sous MIN_MATCHUP_GAMES. */
export function matchupHistoryLine(games, champion, opponent) {
  if (!champion || !opponent) return "";
  const stats = matchupsFor(games, champion).find(
    (m) => m.opponent.toLowerCase() === opponent.toLowerCase()
  );
  if (!stats || stats.lowSample) return "";
  return `Mon historique perso ${champion} vs ${opponent} : ${stats.games} game(s), ${Math.round(stats.wr)}% WR.`;
}
