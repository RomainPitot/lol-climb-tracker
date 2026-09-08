export const RIOT_REGIONS = [
  { platform: "euw1", continent: "europe", label: "EUW" },
  { platform: "eun1", continent: "europe", label: "EUNE" },
  { platform: "tr1", continent: "europe", label: "TR" },
  { platform: "ru", continent: "europe", label: "RU" },
  { platform: "na1", continent: "americas", label: "NA" },
  { platform: "br1", continent: "americas", label: "BR" },
  { platform: "la1", continent: "americas", label: "LAN" },
  { platform: "la2", continent: "americas", label: "LAS" },
  { platform: "kr", continent: "asia", label: "KR" },
  { platform: "jp1", continent: "asia", label: "JP" },
  { platform: "oc1", continent: "sea", label: "OCE" },
];

export const RIOT_TIER_TO_FR = {
  IRON: "Fer",
  BRONZE: "Bronze",
  SILVER: "Argent",
  GOLD: "Or",
  PLATINUM: "Platine",
  EMERALD: "Émeraude",
  DIAMOND: "Diamant",
  MASTER: "Maître",
  GRANDMASTER: "Grand Maître",
  CHALLENGER: "Challenger",
};

export const RIOT_ROLE_MAP = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

/**
 * Code du Cloudflare Worker à déployer côté utilisateur.
 * La clé Riot vit dans les secrets du Worker et ne transite jamais par le navigateur.
 * Affiché tel quel dans les Paramètres — reste synchronisé à la main avec worker/worker.js
 * dans le repo (pas d'import possible : ce fichier est bundlé côté navigateur).
 */
export const WORKER_CODE = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    if (!target || !/^https:\\/\\/[a-z0-9-]+\\.api\\.riotgames\\.com\\//.test(target)) {
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
};`;
