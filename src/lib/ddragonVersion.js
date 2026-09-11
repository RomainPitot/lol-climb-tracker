/**
 * Version Data Dragon utilisée pour tous les assets (icônes de champions, runes, sorts,
 * items). Récupérée dynamiquement depuis l'API Riot au chargement plutôt que codée en dur
 * dans une constante : sans ça, chaque nouveau patch/champion casse silencieusement les
 * icônes pour tout le monde, jusqu'à ce qu'on pense à mettre cette constante à jour à la
 * main. Le repli ci-dessous n'est utilisé que si le fetch échoue (hors ligne, API Riot
 * indisponible) — jamais bloquant.
 */
const FALLBACK_VERSION = "16.16.1";

let current = FALLBACK_VERSION;
const listeners = new Set();

const ready = (async () => {
  try {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    if (res.ok) {
      const versions = await res.json();
      if (Array.isArray(versions) && versions[0]) current = versions[0];
    }
  } catch {
    // Hors ligne ou API indisponible : on garde FALLBACK_VERSION, jamais de blocage.
  }
  listeners.forEach((cb) => cb(current));
  return current;
})();

/** Version connue à l'instant T — le repli codé en dur tant que le fetch n'a pas résolu. */
export function getDdragonVersion() {
  return current;
}

/** À utiliser dans un appel async (lib/ddragon.js) : attend la résolution avant de construire une URL. */
export async function ensureDdragonVersion() {
  await ready;
  return current;
}

/** S'abonne au moment où la vraie version est connue — pour un composant qui rend déjà
 * avec le repli et doit se mettre à jour une fois le fetch résolu (voir ChampAvatar). */
export function onDdragonVersionReady(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
