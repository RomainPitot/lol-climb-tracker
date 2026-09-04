import { DDRAGON_VERSION } from "../constants/roster.js";

let cached = null;

/**
 * Liste complète des champions LoL (id Data Dragon + nom affiché), récupérée en direct
 * depuis Data Dragon plutôt que codée en dur — reste à jour tout seul aux sorties Riot,
 * sans qu'il faille toucher au code. Mise en cache en mémoire pour la session : la liste
 * ne change pas pendant qu'on l'utilise, pas besoin de la retélécharger à chaque page.
 */
export async function fetchChampionList() {
  if (cached) return cached;
  const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/fr_FR/champion.json`);
  if (!res.ok) throw new Error(`Data Dragon a répondu ${res.status}`);
  const body = await res.json();
  cached = Object.values(body.data)
    // `champKey` (numérique) est ce que le client attend pour pick/ban via son API locale
    // (ChampSelectPage) — différent de `id`, la clé Data Dragon textuelle utilisée pour les
    // images et le reste de l'app (ex: "MonkeyKing" vs 62).
    .map((c) => ({ id: c.id, name: c.name, champKey: Number(c.key) }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return cached;
}
