import { riotFetch } from "./riotApi.js";

/** Les 3 ligues apex — du point de vue de Riot, une seule ladder continue triée par LP :
 * Challenger est juste le sommet de Grandmaster qui est juste le sommet de Master. */
const APEX_LEAGUE_PATHS = ["challengerleagues", "grandmasterleagues", "masterleagues"];

/**
 * Rang exact et percentile réels au sein de Master+ — league-v4 expose ces 3 ligues
 * complètes et déjà triées par LP (contrairement à Fer→Diamant, où aucun endpoint Riot ne
 * liste tous les comptes — voir lib/rankPercentile.js pour l'estimation en dessous de
 * Master). On fusionne les 3 listes et on trie par LP pour retrouver la position réelle du
 * joueur — un des seuls endroits de l'app où le chiffre affiché est certain, pas un "≈".
 *
 * Volontairement PAS appelé dans le polling automatique (voir useAutoRiotImport.js) : ces
 * listes peuvent contenir des dizaines de milliers d'entrées sur une grosse région/queue —
 * seulement à la demande (bouton "Actualiser mon rang exact", voir RankStanding.jsx).
 */
export async function fetchApexRank(conn, puuid) {
  const lists = await Promise.all(
    APEX_LEAGUE_PATHS.map((path) =>
      riotFetch(`https://${conn.platform}.api.riotgames.com/lol/league/v4/${path}/by-queue/RANKED_SOLO_5x5`, conn)
    )
  );
  const allEntries = lists.flatMap((l) => l.entries || []);
  allEntries.sort((a, b) => b.leaguePoints - a.leaguePoints);

  const idx = allEntries.findIndex((e) => e.puuid === puuid);
  if (idx === -1) {
    const err = new Error(
      "Compte introuvable dans la ladder Master+ (rang pas encore synchronisé côté Riot, ou retombé sous Master depuis)."
    );
    err.kind = "not-found";
    throw err;
  }

  return {
    globalRank: idx + 1,
    totalPlayers: allEntries.length,
    percentile: ((idx + 1) / allEntries.length) * 100,
    fetchedAt: new Date().toISOString(),
  };
}
