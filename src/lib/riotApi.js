import { APEX } from "../constants/ranks.js";
import { RIOT_TIER_TO_FR } from "../constants/riot.js";
import { riotMatchToGame } from "./importers.js";

/** Queue ID de la SoloQ classée. */
const QUEUE_SOLO_RANKED = 420;

/**
 * En mode proxy, la clé Riot vit côté Worker : on ne transmet que le token du proxy.
 * En mode direct, la clé part depuis le navigateur (bloqué par CORS dans la majorité des cas).
 */
export function buildRiotRequestUrl(riotUrl, conn) {
  if (conn.mode === "proxy") {
    // Une URL de Worker collée sans son schéma (ex: "lol-proxy.x.workers.dev") devient une
    // URL RELATIVE pour `fetch` : le navigateur l'interprète alors comme un chemin de la page
    // en cours. Piège vécu : ça retourne le 404 du site (GitHub Pages), pas celui de Riot —
    // message trompeur ("compte introuvable") pour un problème qui n'a rien à voir. On corrige
    // ici en amont plutôt que de compter sur une saisie toujours parfaite.
    const withScheme = /^https?:\/\//i.test(conn.proxyUrl) ? conn.proxyUrl : `https://${conn.proxyUrl}`;
    const base = withScheme.replace(/\/$/, "");
    return `${base}?token=${encodeURIComponent(conn.proxyToken || "")}&url=${encodeURIComponent(riotUrl)}`;
  }
  const sep = riotUrl.includes("?") ? "&" : "?";
  return `${riotUrl}${sep}api_key=${encodeURIComponent(conn.apiKey || "")}`;
}

export async function riotFetch(riotUrl, conn) {
  let res;
  try {
    res = await fetch(buildRiotRequestUrl(riotUrl, conn));
  } catch {
    const err = new Error("la requête n'a même pas atteint Riot (échec réseau/CORS)");
    err.kind = "network";
    throw err;
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.status?.message || body?.error || "";
    } catch {
      // corps non-JSON : on se contente du code HTTP
    }
    const err = new Error(`${res.status}${detail ? ` — ${detail}` : ""}`);
    err.kind = "http";
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Récupère les dernières games SoloQ non encore importées, plus le rang actuel.
 * `existingMatchIds` évite de re-télécharger les matchs déjà en base.
 */
export async function fetchRiotGames(conn, existingMatchIds) {
  const { gameName, tagLine, platform, continent, count } = conn;

  const account = await riotFetch(
    `https://${continent}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    conn
  );
  const puuid = account.puuid;

  const ids = await riotFetch(
    `https://${continent}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=${QUEUE_SOLO_RANKED}&start=0&count=${count}`,
    conn
  );
  const newIds = ids.filter((id) => !existingMatchIds.has(id));

  const games = [];
  for (const id of newIds) {
    // Séquentiel volontairement : le rate limit des clés de dev est très bas.
    const match = await riotFetch(
      `https://${continent}.api.riotgames.com/lol/match/v5/matches/${id}`,
      conn
    );
    const game = riotMatchToGame(match, puuid);
    if (game) games.push(game);
  }

  let rank = null;
  try {
    const entries = await riotFetch(
      `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
      conn
    );
    const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
    if (solo) {
      const tier = RIOT_TIER_TO_FR[solo.tier] || solo.tier;
      rank = { tier, div: APEX.includes(tier) ? null : solo.rank, lp: solo.leaguePoints };
    }
  } catch {
    // la resynchro du rang est optionnelle : un échec ici ne doit pas perdre les games
  }

  return { games, rank, totalFound: ids.length, newFound: newIds.length, puuid };
}

/** Message d'aide contextuel à afficher quand la récupération échoue. */
export function diagnoseRiotError(err, mode) {
  if (err.kind === "network") {
    return mode === "proxy"
      ? "→ Le navigateur n'a pas réussi à joindre ton proxy : vérifie que l'URL du Worker est correcte et qu'il est bien déployé."
      : "→ C'est un blocage CORS/réseau : le navigateur a refusé d'envoyer la réponse de Riot à cette page (attendu en mode direct — passe en mode Proxy).";
  }
  switch (err.status) {
    case 401:
      return "→ Erreur 401 : le token du proxy ne correspond pas à celui configuré côté Worker.";
    case 403:
      return "→ Erreur 403 : la clé Riot (configurée côté Worker en mode proxy, ou saisie ici en mode direct) est invalide, expirée (24h pour une clé de dev — régénère-la), ou n'a pas les droits.";
    case 404:
      return "→ Erreur 404 : ton Riot ID (nom#tag) ou ta région ne correspond à aucun compte — vérifie l'orthographe exacte et la région choisie.";
    case 429:
      return "→ Erreur 429 : trop de requêtes envoyées en peu de temps — attends une minute et réessaie.";
    default:
      return "→ Réponse inattendue — regarde la console du navigateur (F12) pour le détail complet.";
  }
}
