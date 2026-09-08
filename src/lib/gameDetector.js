/**
 * Client HTTP pour l'API locale exposée par GameDetectorLol (voir ce projet, notifier.py) —
 * status (existant) + pilotage du champ select et des runes (nouveau), pensé pour être
 * appelé depuis le téléphone tant qu'il est sur le même Wi-Fi que le PC qui fait tourner
 * le script (l'API n'est jamais exposée au-delà du réseau local).
 */

export const DEFAULT_HOST = "127.0.0.1:37653";

const baseUrl = (host) => `http://${(host || DEFAULT_HOST).trim()}`;
const authHeaders = (token) => ({ Authorization: `Bearer ${token || ""}` });

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/** Statut de base (phase de jeu) — jamais protégé par token, ne renvoie aucune donnée
 * sensible. Lève une erreur si le script est injoignable (mauvaise IP, script arrêté,
 * pas sur le même Wi-Fi...). */
export async function fetchStatus(host) {
  const res = await fetch(`${baseUrl(host)}/status`);
  if (!res.ok) throw new Error(`Statut HTTP ${res.status}`);
  return parseJson(res);
}

/** Session de champ select en cours (null si on n'est pas/plus en champ select). */
export async function fetchChampSelectSession(host, token) {
  const res = await fetch(`${baseUrl(host)}/champselect`, { headers: authHeaders(token) });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return body.session || null;
}

/** Hover (completed=false) ou confirmation (completed=true) d'un pick/ban. */
export async function sendChampSelectAction(host, token, { actionId, championId, completed }) {
  const res = await fetch(`${baseUrl(host)}/champselect/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ actionId, championId, completed }),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return body;
}

/** Change tes deux sorts d'invocateur pendant la sélection. */
export async function setSummonerSpells(host, token, { spell1Id, spell2Id }) {
  const res = await fetch(`${baseUrl(host)}/champselect/spells`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ spell1Id, spell2Id }),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return body;
}

/** Pages de runes sauvegardées dans le client. */
export async function fetchRunePages(host, token) {
  const res = await fetch(`${baseUrl(host)}/runes`, { headers: authHeaders(token) });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return body.pages || [];
}

/** Active une page de runes existante (par son id) comme page courante. */
export async function activateRunePage(host, token, pageId) {
  const res = await fetch(`${baseUrl(host)}/runes/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ pageId }),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return body;
}

/** Modifie l'arbre primaire (4 perks, dont le keystone en 1er) et secondaire (2 perks) d'une
 * page existante, puis l'active — les statistiques bonus (3e ligne) restent celles de la
 * page (voir notifier.py, non éditables ici). */
export async function updateRunePage(host, token, { pageId, primaryStyleId, subStyleId, primaryPerkIds, secondaryPerkIds }) {
  const res = await fetch(`${baseUrl(host)}/runes/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ pageId, primaryStyleId, subStyleId, primaryPerkIds, secondaryPerkIds }),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return body;
}

/** Lance le Riot Client (League of Legends) si le client n'est pas encore ouvert. */
export async function launchRiotClient(host, token) {
  const res = await fetch(`${baseUrl(host)}/client/launch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return body;
}

/** Lobby courant (queue, préférences de rôle, recherche en cours) + queues supportant les
 * préférences de rôle (`roleQueues`, ex: {420: "Solo/Duo classée", ...}). */
export async function fetchLobbyStatus(host, token) {
  const res = await fetch(`${baseUrl(host)}/lobby`, { headers: authHeaders(token) });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return { lobby: body.lobby || null, roleQueues: body.roleQueues || {} };
}

/** Crée le lobby pour cette queue, règle les rôles (si la queue les supporte) puis lance
 * la recherche de partie. `firstPreference`/`secondPreference` : codes LCU (TOP, JUNGLE,
 * MIDDLE, BOTTOM, UTILITY) ou "FILL" — voir riotRoleToLcu dans constants/riot.js. */
export async function startQueue(host, token, { queueId, firstPreference, secondPreference }) {
  const res = await fetch(`${baseUrl(host)}/lobby/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ queueId, firstPreference, secondPreference }),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return body;
}

/** Annule la recherche de partie en cours. */
export async function cancelQueue(host, token) {
  const res = await fetch(`${baseUrl(host)}/lobby/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return body;
}

/** Accepte ou refuse la partie trouvée (ready check). */
export async function respondReadyCheck(host, token, accept) {
  const res = await fetch(`${baseUrl(host)}/readycheck/${accept ? "accept" : "decline"}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return body;
}

/** L'action pick/ban actionnable par le joueur local, si son tour est arrivé. */
export function findMyAction(session) {
  if (!session) return null;
  for (const group of session.actions || []) {
    for (const action of group) {
      if (action.actorCellId === session.localPlayerCellId && action.isInProgress && !action.completed) {
        return action;
      }
    }
  }
  return null;
}

/** Ton futur pick (même si ce n'est pas encore ton tour) — permet de présélectionner ton
 * champion pendant que les autres bannissent/pickent, comme dans le client officiel : le
 * LCU accepte de "survoler" (completed=false) une action pick qui t'appartient même si elle
 * n'est pas encore isInProgress. Contrairement aux bans, qui ne peuvent se survoler qu'à ton
 * tour (voir findMyAction) — pas de présélection de ban dans le client. */
export function findMyPendingPick(session) {
  if (!session) return null;
  for (const group of session.actions || []) {
    for (const action of group) {
      if (action.actorCellId === session.localPlayerCellId && action.type === "pick" && !action.completed) {
        return action;
      }
    }
  }
  return null;
}

/** Ids déjà bannis ou déjà verrouillés par quelqu'un — à griser dans la grille de choix. */
export function unavailableChampionIds(session) {
  if (!session) return new Set();
  const ids = new Set();
  for (const id of session.bans?.myTeamBans || []) ids.add(id);
  for (const id of session.bans?.theirTeamBans || []) ids.add(id);
  for (const group of session.actions || []) {
    for (const action of group) {
      if (action.type === "pick" && action.completed && action.championId) ids.add(action.championId);
    }
  }
  ids.delete(0);
  return ids;
}
