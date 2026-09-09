/** Taille de la carte Summoner's Rift en unités Riot (voir lib/riotTimeline.js) — mêmes
 * repères, pour rester cohérent avec la classification de zone déjà en place. */
export const MAP_SIZE = 14820;

/** Convertit une position Riot (origine en bas à gauche, Y croissant vers le haut) en
 * coordonnées écran (Y croissant vers le bas) sur un carré de côté `size` — pour que le
 * point s'affiche à l'endroit visuellement attendu (base bleue en bas à gauche). */
export function toScreen(pos, size) {
  return {
    x: (pos.x / MAP_SIZE) * size,
    y: size - (pos.y / MAP_SIZE) * size,
  };
}

const TYPES = ["deaths", "wards", "objectives"];

/**
 * Rassemble les points à afficher sur la heatmap à partir des games représentatives,
 * filtrés par champion (optionnel) et par type(s) actif(s). Ne remonte que ce qui a
 * réellement une position enregistrée (timelineSummary — absent sur les games importées
 * avant son ajout, ou sur les games sans timeline récupérée) : jamais de point inventé.
 */
export function collectHeatmapPoints(games, { champion, types = TYPES } = {}) {
  const points = [];
  for (const g of games) {
    if (champion && g.champion !== champion) continue;
    const t = g.timelineSummary;
    if (!t) continue;

    if (types.includes("deaths")) {
      for (const d of t.deaths || []) {
        if (d.position) points.push({ type: "death", x: d.position.x, y: d.position.y, meta: d });
      }
    }
    if (types.includes("wards")) {
      for (const w of t.wardPositions || []) {
        points.push({ type: "ward", x: w.x, y: w.y, meta: {} });
      }
    }
    if (types.includes("objectives")) {
      for (const o of t.objectives || []) {
        if (o.position) points.push({ type: "objective", x: o.position.x, y: o.position.y, meta: o });
      }
    }
  }
  return points;
}
