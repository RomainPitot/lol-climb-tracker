import { normalizeProxyUrl } from "./riotApi.js";

/**
 * Persona partagée par les trois fonctionnalités Coach IA (bilan de compte, bilan de
 * game, conseils de champ select) : un coach coréen exigeant, direct, qui priorise les
 * fondamentaux plutôt que le blabla générique — c'est le ton demandé, pas juste une
 * couche de style, ça change concrètement ce que l'IA met en avant dans ses réponses.
 */
export const KOREAN_COACH_SYSTEM = `Tu es un coach League of Legends professionnel, formé en Corée du Sud — réputé pour
son exigence, sa franchise et son sens du détail. Tu ne flattes jamais inutilement : si
un chiffre est mauvais, tu le dis, mais toujours accompagné d'une raison concrète et
d'une action précise pour corriger. Tu priorises systématiquement les fondamentaux (CS,
morts évitables, vision, macro, matchup, gestion de wave) avant les considérations de
mécanique ou de méta. Tu réponds en français, de façon concise, structurée (courtes
sections avec des tirets), sans blabla ni motivation creuse — chaque phrase doit être
actionnable. Base-toi uniquement sur les chiffres et faits fournis, n'invente rien.`;

const AI_PATH = "/ai";

/** Le Coach IA réutilise le même Worker/token que l'import Riot (voir "Ajouter une
 * game" → mode Via mon proxy) — rien de plus à configurer côté app. */
export const riotProxyConn = (settings) => ({
  proxyUrl: settings.riotProxyUrl || "",
  proxyToken: settings.riotProxyToken || "",
});

/** Erreur enrichie avec `.kind`/`.status`, sur le même modèle que riotApi.js. */
async function postToWorker(conn, payload) {
  const base = normalizeProxyUrl(conn.proxyUrl);
  let res;
  try {
    res = await fetch(`${base}${AI_PATH}?token=${encodeURIComponent(conn.proxyToken || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    const err = new Error(body?.error || `Erreur ${res.status}`);
    err.kind = "http";
    err.status = res.status;
    throw err;
  }

  return body.text || "";
}

/**
 * Envoie un prompt au Worker (voir worker/worker.js, endpoint /ai), qui relaie vers
 * Claude avec la clé Anthropic gardée côté serveur. Réutilise le même Worker et le même
 * token que l'import Riot (`conn = { proxyUrl, proxyToken }`) — rien de plus à configurer.
 */
export async function askCoach(conn, { prompt, system = KOREAN_COACH_SYSTEM, maxTokens } = {}) {
  return postToWorker(conn, { prompt, system, maxTokens });
}

/** Message d'aide contextuel à afficher quand un appel Coach IA échoue. */
export function diagnoseAiError(err) {
  if (err.kind === "network") {
    return "→ Le navigateur n'a pas réussi à joindre ton proxy : vérifie que l'URL du Worker est correcte et qu'il est bien déployé.";
  }
  switch (err.status) {
    case 401:
      return "→ Erreur 401 : le token du proxy ne correspond pas à celui configuré côté Worker (le même que pour l'import Riot).";
    case 404:
      return "→ Erreur 404 : le Worker déployé ne connaît pas encore /ai — redéploie le code du Worker mis à jour (voir docs/RIOT_PROXY.md#coach-ia).";
    case 500:
      return "→ Le secret ANTHROPIC_API_KEY n'est pas configuré sur le Worker (voir docs/RIOT_PROXY.md#coach-ia).";
    case 502:
      return "→ Le Worker n'a pas réussi à joindre l'API Anthropic — réessaie dans un instant.";
    default:
      return "→ Réponse inattendue de l'IA — regarde la console du navigateur (F12) pour le détail complet.";
  }
}
