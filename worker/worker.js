/**
 * Proxy Cloudflare Worker pour l'API Riot + l'IA coach.
 *
 * Pourquoi : l'API Riot n'autorise pas les appels depuis un navigateur (pas de CORS),
 * et une clé API ne doit jamais être exposée dans du code client. Ce Worker relaie
 * les requêtes en injectant la clé côté serveur. Même principe pour l'IA (voir /ai) :
 * la clé Anthropic ne doit jamais transiter par le navigateur.
 *
 * Déploiement : voir docs/RIOT_PROXY.md
 * Secrets requis : RIOT_API_KEY (ta clé Riot), PROXY_TOKEN (une chaîne aléatoire).
 *
 * Secret optionnel, pour les fonctionnalités Coach IA (analyse de compte, bilan de fin
 * de game, conseils de champ select — voir docs/RIOT_PROXY.md#coach-ia) :
 *   ANTHROPIC_API_KEY — ta clé sur console.anthropic.com. Sans elle, le reste de l'app
 *                       fonctionne normalement : seul /ai répond une erreur claire.
 *
 * Secrets optionnels, pour le bouton "renouveler ma clé Riot" côté app (voir
 * docs/RIOT_PROXY.md#rotation-automatique-de-la-cle) :
 *   ADMIN_TOKEN   — chaîne aléatoire DIFFÉRENTE de PROXY_TOKEN (celui-ci circule dans
 *                   chaque requête d'import, l'admin token beaucoup plus rarement).
 *   CF_API_TOKEN  — jeton API Cloudflare, scope "Workers Scripts:Edit" uniquement.
 *   CF_ACCOUNT_ID — l'ID de compte Cloudflare (visible dans l'URL du dashboard).
 * Sans ces trois secrets, le Worker fonctionne normalement : seul /rotate-key est indisponible.
 */
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // Coach IA : le token est le même que pour l'import Riot (même Worker, même
    // protection) — pas de secret supplémentaire à configurer côté app.
    if (url.pathname === "/ai") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers: cors });
      }
      const aiToken = url.searchParams.get("token");
      if (!env.PROXY_TOKEN || aiToken !== env.PROXY_TOKEN) {
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
      }
      if (!env.ANTHROPIC_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Coach IA non configuré : secret ANTHROPIC_API_KEY manquant sur le Worker." }),
          { status: 500, headers: cors }
        );
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "corps de requête invalide" }), { status: 400, headers: cors });
      }
      const prompt = body?.prompt;
      if (!prompt || typeof prompt !== "string") {
        return new Response(JSON.stringify({ error: "champ prompt requis" }), { status: 400, headers: cors });
      }

      let aiRes;
      try {
        aiRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: ANTHROPIC_MODEL,
            max_tokens: Math.min(Number(body.maxTokens) || 700, 1500),
            system: typeof body.system === "string" ? body.system : undefined,
            messages: [{ role: "user", content: prompt }],
          }),
        });
      } catch {
        return new Response(JSON.stringify({ error: "échec réseau vers l'API Anthropic" }), {
          status: 502,
          headers: cors,
        });
      }

      const aiBody = await aiRes.json().catch(() => ({}));
      if (!aiRes.ok) {
        const detail = aiBody?.error?.message || "erreur inconnue";
        return new Response(JSON.stringify({ error: `Anthropic a répondu ${aiRes.status} : ${detail}` }), {
          status: aiRes.status,
          headers: cors,
        });
      }

      const text = aiBody?.content?.find((c) => c.type === "text")?.text || "";
      return new Response(JSON.stringify({ text }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
    }

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
