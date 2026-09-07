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
 * Hypothèse simplificatrice utilisée quand plusieurs games se sont jouées sans vérification
 * entre elles : les victoires rapportent un LP symétrique aux défaites (`+x` / `-x`). Avec V
 * victoires et D défaites, `total = x·(V − D)` se résout tant que V ≠ D. Si V = D, l'équation
 * à une inconnue n'a pas de solution : on retombe sur une magnitude par défaut, et l'écart
 * restant est absorbé par la game la plus récente pour que le total reste exact.
 *
 * Si le lot ne contient qu'UNE SEULE game, il n'y a rien à répartir — le delta mesuré
 * s'applique à elle seule sans aucune hypothèse : ce n'est alors plus une estimation mais la
 * vraie valeur. Voir `estimateLpChanges` plus bas pour comment `rankHistory` permet
 * d'atteindre ce cas idéal bien plus souvent qu'un simple avant/après sur tout le lot.
 */
const DEFAULT_LP_MAGNITUDE = 17;

function splitSegmentDelta(segment, totalDelta) {
  const wins = segment.filter((g) => g.win).length;
  const losses = segment.length - wins;

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

  let assigned = 0;
  return segment.map((g, i) => {
    const isLast = i === segment.length - 1;
    // La dernière game du segment absorbe l'arrondi (et, si V = D, tout l'écart non expliqué
    // par le modèle symétrique) pour que la somme colle exactement au delta mesuré par Riot.
    const delta = isLast ? Math.round(totalDelta - assigned) : Math.round(g.win ? perWin : perLoss);
    assigned += delta;
    return delta;
  });
}

/** Timestamp de fin (ms) d'une game — voir le champ `endTimestamp` ajouté par riotMatchToGame. */
function gameEndMs(g) {
  return g.endTimestamp || gameTime(g);
}

/**
 * Construit la liste ordonnée des rangs connus ("ancres") dans la fenêtre du lot de games à
 * traiter : l'historique persistant (`rankHistory`, alimenté à CHAQUE vérification Riot, pas
 * seulement quand une nouvelle game apparaît — voir useAutoRiotImport.js), complété par
 * `beforeRank` en secours si l'historique ne couvre pas encore le début du lot (premier
 * import, ou historique vidé par le nettoyage périodique dans fetchRiotGames).
 */
function buildAnchors(rankHistory, beforeRank, earliestGameMs) {
  const anchors = (rankHistory || [])
    .filter((s) => s && s.tier && Number.isFinite(s.ts))
    .map((s) => ({ ts: s.ts, score: rankScore(s.tier, s.div, s.lp) }))
    .sort((a, b) => a.ts - b.ts);

  if (!anchors.length || anchors[0].ts > earliestGameMs) {
    anchors.unshift({ ts: earliestGameMs - 1, score: rankScore(beforeRank.tier, beforeRank.div, beforeRank.lp) });
  }
  return anchors;
}

/**
 * Répartit le LP gagné/perdu sur un lot de games fraîchement importées, en s'appuyant sur
 * `rankHistory` pour retrouver, quand c'est possible, le rang exact entre deux games
 * consécutives plutôt qu'un seul avant/après sur tout le lot.
 *
 * Principe : chaque échantillon de `rankHistory` (un par vérification Riot, même sans
 * nouvelle game trouvée) délimite un segment de temps. Une game qui se termine dans un
 * segment où AUCUNE autre game ne se termine a un LP exact, calculé sans hypothèse : la
 * différence entre les deux échantillons qui l'entourent EST son gain/perte. Seules les
 * games regroupées dans un même segment (plusieurs games jouées entre deux vérifications)
 * retombent sur le modèle symétrique approximatif — et seulement pour ce sous-groupe, pas
 * pour tout le lot. Plus l'intervalle de vérification est court par rapport au temps entre
 * deux games, plus les segments contiennent une seule game, plus le LP devient exact.
 */
function estimateLpChanges(games, beforeRank, afterRank, rankHistory = []) {
  if (!games.length || !beforeRank || !afterRank) return;

  const chronological = [...games].sort((a, b) => gameEndMs(a) - gameEndMs(b));
  const anchors = buildAnchors(rankHistory, beforeRank, gameEndMs(chronological[0]));

  // Le rang tout juste resynchronisé est forcément postérieur à toutes les games de ce lot
  // (on vient de le récupérer après avoir vu leurs matchIds) : il ferme la dernière ancre.
  const lastKnownTs = anchors.at(-1).ts;
  anchors.push({
    ts: Math.max(Date.now(), lastKnownTs + 1),
    score: rankScore(afterRank.tier, afterRank.div, afterRank.lp),
  });

  // Regroupe les games par segment [anchors[k].ts, anchors[k+1].ts] où elles se terminent,
  // puis répartit le delta mesuré sur CE segment uniquement (voir splitSegmentDelta).
  const results = new Map();
  let k = 0;
  let segment = [];
  const flushSegment = () => {
    if (!segment.length) return;
    const totalDelta = Math.round(anchors[k + 1].score - anchors[k].score);
    const deltas = splitSegmentDelta(segment, totalDelta);
    segment.forEach((g, i) => results.set(g, { delta: deltas[i], estimated: segment.length > 1 }));
    segment = [];
  };

  for (const g of chronological) {
    const t = gameEndMs(g);
    while (k < anchors.length - 2 && t > anchors[k + 1].ts) {
      flushSegment();
      k++;
    }
    segment.push(g);
  }
  flushSegment();

  let cursor = beforeRank;
  chronological.forEach((g) => {
    const { delta, estimated } = results.get(g);
    const after = applyLpChange(cursor, delta);
    g.rankBeforeTier = cursor.tier;
    g.rankBeforeDiv = cursor.div;
    g.lpBefore = cursor.lp;
    g.lpChange = delta;
    g.rankAfterTier = after.tier;
    g.rankAfterDiv = after.div;
    g.lpAfter = after.lp;
    g.lpEstimated = estimated;
    cursor = after;
  });
}

const RANK_HISTORY_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 jours
const RANK_HISTORY_MAX_ENTRIES = 500;

/**
 * Purge l'historique de rang au fil du temps : au-delà de 14 jours, une game déjà importée a
 * forcément déjà eu son LP calculé (définitivement, pas recalculé rétroactivement) — garder
 * ces échantillons ne servirait plus qu'à faire grossir le localStorage indéfiniment pour un
 * usage prolongé de l'auto-import.
 */
function pruneRankHistory(history) {
  const cutoff = Date.now() - RANK_HISTORY_MAX_AGE_MS;
  const pruned = history.filter((s) => s.ts >= cutoff);
  return pruned.length > RANK_HISTORY_MAX_ENTRIES ? pruned.slice(pruned.length - RANK_HISTORY_MAX_ENTRIES) : pruned;
}

/**
 * Récupère les dernières games SoloQ non encore importées, plus le rang actuel.
 * `existingMatchIds` évite de re-télécharger les matchs déjà en base. `beforeRank` (le rang
 * courant de l'app avant l'import) et `rankHistory` (les vérifications précédentes) servent
 * à calculer le LP par game — voir estimateLpChanges. Le rang fraîchement récupéré ici est
 * ajouté à l'historique retourné (`rankHistory`), à persister par l'appelant : c'est ce qui
 * permet aux imports suivants d'être plus précis, même sans nouvelle game à chaque fois.
 */
export async function fetchRiotGames(conn, existingMatchIds, beforeRank, rankHistory = []) {
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
  if (beforeRank && rank) estimateLpChanges(games, beforeRank, rank, rankHistory);

  // Le rang qu'on vient de récupérer entre dans l'historique pour le PROCHAIN import — y
  // compris quand ce lot ne contenait aucune nouvelle game : c'est justement ce qui permet de
  // délimiter des segments d'une seule game plus tard (voir estimateLpChanges).
  const updatedHistory = rank
    ? pruneRankHistory([...(rankHistory || []), { ts: Date.now(), tier: rank.tier, div: rank.div, lp: rank.lp }])
    : rankHistory || [];

  return { games, rank, rankHistory: updatedHistory, totalFound: ids.length, newFound: newIds.length, puuid };
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
