/**
 * Proxy Cloudflare Worker pour l'API Riot.
 *
 * Pourquoi : l'API Riot n'autorise pas les appels depuis un navigateur (pas de CORS),
 * et une clé API ne doit jamais être exposée dans du code client. Ce Worker relaie
 * les requêtes en injectant la clé côté serveur.
 *
 * Déploiement : voir docs/RIOT_PROXY.md
 * Secrets requis : RIOT_API_KEY (ta clé Riot), PROXY_TOKEN (une chaîne aléatoire).
 *
 * Secrets optionnels, pour le bouton "renouveler ma clé Riot" côté app (voir
 * docs/RIOT_PROXY.md#rotation-automatique-de-la-cle) :
 *   ADMIN_TOKEN   — chaîne aléatoire DIFFÉRENTE de PROXY_TOKEN (celui-ci circule dans
 *                   chaque requête d'import, l'admin token beaucoup plus rarement).
 *   CF_API_TOKEN  — jeton API Cloudflare, scope "Workers Scripts:Edit" uniquement.
 *   CF_ACCOUNT_ID — l'ID de compte Cloudflare (visible dans l'URL du dashboard).
 * Sans ces trois secrets, le Worker fonctionne normalement : seul /rotate-key est indisponible.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // Endpoint distinct de la relève générique : permet à l'app de pousser une nouvelle
    // clé Riot directement dans les secrets du Worker, sans jamais faire transiter le
    // jeton Cloudflare (CF_API_TOKEN) par le navigateur.
    if (url.pathname === "/rotate-key") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers: cors });
      }
      const adminToken = request.headers.get("X-Admin-Token") || "";
      if (!env.ADMIN_TOKEN || adminToken !== env.ADMIN_TOKEN) {
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
      }
      if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
        return new Response(
          JSON.stringify({ error: "rotation non configurée : CF_API_TOKEN ou CF_ACCOUNT_ID manquant" }),
          { status: 500, headers: cors }
        );
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "corps de requête invalide" }), { status: 400, headers: cors });
      }
      const newKey = body?.riotApiKey;
      if (!newKey || typeof newKey !== "string" || !newKey.startsWith("RGAPI-")) {
        return new Response(JSON.stringify({ error: "clé Riot invalide (doit commencer par RGAPI-)" }), {
          status: 400,
          headers: cors,
        });
      }

      const scriptName = env.CF_SCRIPT_NAME || "lol-proxy";
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${scriptName}/secrets`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${env.CF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "RIOT_API_KEY", text: newKey, type: "secret_text" }),
        }
      );
      const cfBody = await cfRes.text();
      return new Response(cfBody, { status: cfRes.status, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Sans ce token, n'importe qui pourrait consommer ton quota Riot.
    const token = url.searchParams.get("token");
    if (!env.PROXY_TOKEN || token !== env.PROXY_TOKEN) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
    }

    // Le Worker ne doit relayer que vers les domaines officiels de l'API Riot.
    const target = url.searchParams.get("url");
    if (!target || !/^https:\/\/[a-z0-9-]+\.api\.riotgames\.com\//.test(target)) {
      return new Response(JSON.stringify({ error: "invalid target" }), { status: 400, headers: cors });
    }

    const riotUrl = new URL(target);
    riotUrl.searchParams.set("api_key", env.RIOT_API_KEY);

    const riotRes = await fetch(riotUrl.toString());
    const body = await riotRes.text();

    return new Response(body, {
      status: riotRes.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
