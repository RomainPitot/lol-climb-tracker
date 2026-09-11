import { fetchChampionList } from "./ddragon.js";

/**
 * Correspondance nom affiché ↔ identifiant Data Dragon pour TOUS les champions du jeu —
 * remplace l'ancienne table ROSTER/CHAMP_DDRAGON/REVERSE_CHAMP codée en dur (14 entrées,
 * jamais à jour pour un champion sorti après leur ajout). Construite depuis
 * fetchChampionList (déjà utilisé pour ChampSelectPage), donc toujours aussi à jour que
 * la version Data Dragon résolue dynamiquement (voir lib/ddragonVersion.js).
 */

let index = { byName: new Map(), byId: new Map() };
let loadingPromise = null;
const listeners = new Set();

function buildIndex(list) {
  const byName = new Map();
  const byId = new Map();
  for (const c of list) {
    byName.set(c.name, c.id);
    byId.set(c.id, c.name);
  }
  return { byName, byId };
}

/** Index connu à l'instant T — vide tant que le fetch n'a pas résolu. */
export function getChampionIndex() {
  return index;
}

/** À utiliser dans un appel async (import Riot) : attend la résolution avant de traduire un nom. */
export async function ensureChampionIndex() {
  if (index.byName.size) return index;
  if (!loadingPromise) {
    loadingPromise = fetchChampionList()
      .then((list) => {
        index = buildIndex(list);
        listeners.forEach((cb) => cb(index));
        return index;
      })
      .catch(() => index); // hors ligne ou Data Dragon indisponible : reste vide, jamais bloquant.
  }
  return loadingPromise;
}

/** S'abonne au moment où l'index est résolu — pour un composant qui rend déjà avec
 * l'index vide et doit se mettre à jour une fois le fetch terminé (voir ChampAvatar). */
export function onChampionIndexReady(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Déclenché au chargement du module plutôt qu'au premier composant qui en a besoin —
// ChampAvatar est utilisé quasi partout, autant lancer le fetch le plus tôt possible.
ensureChampionIndex();
