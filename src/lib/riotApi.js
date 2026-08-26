import { APEX } from "../constants/ranks.js";
import { RIOT_TIER_TO_FR } from "../constants/riot.js";
import { riotMatchToGame } from "./importers.js";
import { applyLpChange, rankScore } from "./rank.js";
import { gameTime } from "./format.js";

/** Queue ID de la SoloQ classée. */
const QUEUE_SOLO_RANKED = 420;

/**
 * Une URL de Worker collée sans son schéma (ex: "lol-proxy.x.workers.dev") devient une
 * URL RELATIVE pour `fetch` : le navigateur l'interprète alors comme un chemin de la page
 * en cours. Piège vécu : ça retourne le 404 du site (GitHub Pages), pas celui de Riot —
 * message trompeur ("compte introuvable") pour un problème qui n'a rien à voir. On corrige
 * ici en amont plutôt que de compter sur une saisie toujours parfaite.
 */
export function normalizeProxyUrl(proxyUrl) {
  const withScheme = /^https?:\/\//i.test(proxyUrl) ? proxyUrl : `https://${proxyUrl}`;
  return withScheme.replace(/\/$/, "");
}

/**
 * En mode proxy, la clé Riot vit côté Worker : on ne transmet que le token du proxy.
 * En mode direct, la clé part depuis le navigateur (bloqué par CORS dans la majorité des cas).
 */
export function buildRiotRequestUrl(riotUrl, conn) {
  if (conn.mode === "proxy") {
    const base = normalizeProxyUrl(conn.proxyUrl);
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
 * L'API Riot ne donne jamais le LP gagné/perdu par game — seulement le résultat (win/loss)
 * et, séparément, un instantané du rang *actuel*. On peut quand même approcher un LP par
 * game : on connaît le rang juste avant ce lot de games (`beforeRank`, le rang courant de
 * l'app avant l'import) et le rang juste après (`afterRank`, resynchronisé depuis Riot) — la
 * différence entre les deux est la vérité mesurée, il ne reste qu'à la répartir sur les games.
 *
 * Hypothèse simplificatrice : les victoires rapportent un LP symétrique aux défaites (`+x`
 * / `-x`). Avec V victoires et D défaites, `total = x·(V − D)` se résout tant que V ≠ D. Si
 * V = D, l'équation à une inconnue n'a pas de solution (un delta non nul avec autant de
 * victoires que de défaites ne peut s'expliquer que par une asymétrie qu'on ne peut pas
 * connaître) : on retombe sur une magnitude par défaut, et l'écart restant est absorbé par
 * la game la plus récente pour que le total reste exact.
 *
 * Cas particulier important : si le lot ne contient qu'UNE SEULE game, il n'y a rien à
 * répartir — le delta mesuré s'applique à elle seule sans aucune hypothèse. Ce n'est alors
 * plus une estimation mais la vraie valeur (d'où l'intérêt d'importer souvent : plus les
 * lots sont petits, plus le calcul se rapproche de l'exact). Dès que le lot contient
 * plusieurs games, le modèle symétrique (V ≠ D) ou par défaut (V = D) entre en jeu, et promos,
 * séries de rétrogradation ou bonus de première victoire du jour restent invisibles ici.
 * `lpEstimated` reflète cette distinction : `false` pour un lot d'une game, `true` sinon.
 */
const DEFAULT_LP_MAGNITUDE = 17;

function estimateLpChanges(games, beforeRank, afterRank) {
  if (!games.length || !beforeRank || !afterRank) return;

  const chronological = [...games].sort((a, b) => gameTime(a) - gameTime(b));
  const totalDelta = rankScore(afterRank.tier, afterRank.div, afterRank.lp) - rankScore(beforeRank.tier, beforeRank.div, beforeRank.lp);
  const wins = chronological.filter((g) => g.win).length;
  const losses = chronological.length - wins;

  let perWin;
  let perLoss;
  if (wins !== losses) {
    const magnitude = totalDelta / (wins - losses);
    perWin = magnitude;
    perLoss = -magnitude;
  } else {
    perWin = DEFAULT_LP_MAGNITUDE;
    perLoss = -DEFAULT_LP_MAGNITUDE;
  }

  let cursor = beforeRank;
  let assigned = 0;
  chronological.forEach((g, i) => {
    const isLast = i === chronological.length - 1;
    // La dernière game absorbe l'arrondi (et, si V = D, tout l'écart non expliqué par le
    // modèle symétrique) pour que la somme colle exactement au delta mesuré par Riot.
    const delta = isLast ? Math.round(totalDelta - assigned) : Math.round(g.win ? perWin : perLoss);
    assigned += delta;

    const after = applyLpChange(cursor, delta);
    g.rankBeforeTier = cursor.tier;
    g.rankBeforeDiv = cursor.div;
    g.lpBefore = cursor.lp;
    g.lpChange = delta;
    g.rankAfterTier = after.tier;
    g.rankAfterDiv = after.div;
    g.lpAfter = after.lp;
    // Une seule game dans le lot : aucune répartition à faire, la valeur est exacte.
    g.lpEstimated = chronological.length > 1;
    cursor = after;
  });
}

/**
 * Récupère les dernières games SoloQ non encore importées, plus le rang actuel.
 * `existingMatchIds` évite de re-télécharger les matchs déjà en base. `beforeRank` (le rang
 * courant de l'app avant l'import) sert à estimer un LP par game — voir estimateLpChanges.
 */
export async function fetchRiotGames(conn, existingMatchIds, beforeRank) {
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

  // Sans rang de départ ou d'arrivée, impossible d'estimer quoi que ce soit — les games
  // gardent alors lpChange: 0 comme avant (comportement inchangé dans ce cas).
  if (beforeRank && rank) estimateLpChanges(games, beforeRank, rank);

  return { games, rank, totalFound: ids.length, newFound: newIds.length, puuid };
}

/**
 * Pousse une nouvelle clé Riot directement dans les secrets du Worker, via son endpoint
 * /rotate-key. Le jeton Cloudflare (CF_API_TOKEN) qui autorise cette écriture ne quitte
 * jamais le Worker — seuls l'admin token et la nouvelle clé transitent par le navigateur.
 */
export async function rotateRiotKey({ proxyUrl, adminToken }, newKey) {
  const base = normalizeProxyUrl(proxyUrl);
  let res;
  try {
    res = await fetch(`${base}/rotate-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": adminToken || "" },
      body: JSON.stringify({ riotApiKey: newKey }),
    });
  } catch {
    const err = new Error("la requête n'a même pas atteint le Worker (échec réseau/CORS)");
    err.kind = "network";
    throw err;
  }

  let body = {};
  try {
    body = await res.json();
  } catch {
    // réponse non-JSON : on se contente du code HTTP
  }

  if (!res.ok) {
    const detail = body?.error || body?.errors?.[0]?.message || "";
    const err = new Error(`${res.status}${detail ? ` — ${detail}` : ""}`);
    err.kind = "http";
    err.status = res.status;
    throw err;
  }

  return body;
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

/** Message d'aide contextuel pour un échec de rotation de clé (endpoint /rotate-key). */
export function diagnoseRotateError(err) {
  if (err.kind === "network") {
    return "→ Le navigateur n'a pas réussi à joindre ton proxy : vérifie l'URL du Worker.";
  }
  switch (err.status) {
    case 401:
      return "→ Erreur 401 : l'admin token ne correspond pas au secret ADMIN_TOKEN configuré côté Worker.";
    case 400:
      return "→ Erreur 400 : la clé collée n'a pas le format attendu (elle doit commencer par RGAPI-).";
    case 404:
      return "→ Erreur 404 : le Worker déployé ne connaît pas encore /rotate-key — redéploie le code du Worker mis à jour.";
    case 500:
      return "→ La rotation n'est pas configurée sur ce Worker : il manque le secret CF_API_TOKEN ou CF_ACCOUNT_ID.";
    default:
      return "→ Cloudflare a refusé la mise à jour — vérifie que le jeton CF_API_TOKEN a bien le scope \"Workers Scripts: Edit\" et n'a pas expiré.";
  }
}
