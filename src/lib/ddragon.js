import { DDRAGON_VERSION } from "../constants/roster.js";

let cached = null;
let cachedRuneTree = null;
let cachedSpells = null;

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

/**
 * Arbre complet des runes (5 styles x 4 lignes), pour construire/modifier une page de
 * runes depuis le téléphone (voir RunesPanel dans ChampSelectPage) — les ids correspondent
 * 1:1 à ceux attendus par le LCU (GameDetectorLol notifier.py, /runes/update), Data Dragon
 * et le client utilisant la même numérotation Riot. Ne couvre PAS les statistiques bonus
 * (3e ligne de la page, "stat shards") : leur regroupement par ligne n'est pas exposé de
 * façon fiable par Data Dragon ni le LCU, donc l'app ne les propose pas à l'édition.
 */
export async function fetchRuneTree() {
  if (cachedRuneTree) return cachedRuneTree;
  const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/fr_FR/runesReforged.json`);
  if (!res.ok) throw new Error(`Data Dragon a répondu ${res.status}`);
  const body = await res.json();
  cachedRuneTree = body.map((style) => ({
    id: style.id,
    name: style.name,
    icon: `https://ddragon.leagueoflegends.com/cdn/img/${style.icon}`,
    slots: style.slots.map((slot) => ({
      runes: slot.runes.map((r) => ({
        id: r.id,
        name: r.name,
        icon: `https://ddragon.leagueoflegends.com/cdn/img/${r.icon}`,
        shortDesc: r.shortDesc,
      })),
    })),
  }));
  return cachedRuneTree;
}

/**
 * Sorts d'invocateur valides sur la Faille de l'invocateur (Rift classique — pas ARAM,
 * pas les modes spéciaux) : filtrés sur `modes.includes("CLASSIC")`, ce qui exclut par
 * exemple Clarté (ARAM uniquement). `id` correspond directement à spell1Id/spell2Id lus
 * dans la session de champ select (voir gameDetector.js).
 */
export async function fetchSummonerSpells() {
  if (cachedSpells) return cachedSpells;
  const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/fr_FR/summoner.json`);
  if (!res.ok) throw new Error(`Data Dragon a répondu ${res.status}`);
  const body = await res.json();
  cachedSpells = Object.values(body.data)
    .filter((s) => s.modes?.includes("CLASSIC"))
    .map((s) => ({
      id: Number(s.key),
      name: s.name,
      icon: `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/spell/${s.image.full}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return cachedSpells;
}
