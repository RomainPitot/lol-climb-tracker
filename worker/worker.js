/**
 * Proxy Cloudflare Worker pour l'API Riot.
 *
 * Pourquoi : l'API Riot n'autorise pas les appels depuis un navigateur (pas de CORS),
 * et une clé API ne doit jamais être exposée dans du code client. Ce Worker relaie
 * les requêtes en injectant la clé côté serveur.
 *
 * Déploiement : voir docs/RIOT_PROXY.md
 * Secrets requis : RIOT_API_KEY (ta clé Riot), PROXY_TOKEN (une chaîne aléatoire).
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

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
