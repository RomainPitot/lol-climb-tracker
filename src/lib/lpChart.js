import { FULL_GAME_LADDER, TIER_COLORS, APEX } from "../constants/ranks.js";

// Un vrai gain/perte de LP sur UNE game ne dépasse jamais quelques dizaines de points, même
// avec l'estimation par lot (voir estimateLpChanges dans riotApi.js) qui peut absorber
// l'arrondi d'un import après une longue absence. Un saut plus grand que ça entre deux
// points consécutifs ne peut trahir qu'un rang jamais réglé/corrigé (valeur par défaut restée
// en place avant le tout premier vrai import/réglage) plutôt qu'une vraie partie jouée.
const IMPLAUSIBLE_JUMP = 500;

/**
 * Coupe le début d'une série de points { lp, ... } au dernier saut invraisemblable détecté
 * — tout ce qui précède n'est pas une vraie progression (voir IMPLAUSIBLE_JUMP), le garder
 * ferait démarrer le graphique bien avant le début réel du suivi et ajouterait plein de
 * paliers jamais vraiment joués. Sans saut détecté, renvoie la série entière inchangée.
 */
export function trimToRealStart(points) {
  let cut = 0;
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i].lp - points[i - 1].lp) > IMPLAUSIBLE_JUMP) cut = i;
  }
  return cut > 0 ? points.slice(cut) : points;
}

/**
 * Palier (tier/div) correspondant à un "score rang" arrondi à la centaine (voir
 * rankValue dans lib/rank.js : palier×100 + LP). Les paliers apex démarrent à 1000
 * (Maître), 1001 (Grand Maître), 1002 (Challenger) — grand vide numérique entre 28
 * (Diamant I) et 1000, qui ne représente aucun rang atteignable.
 */
function rankAtIdx(idx) {
  if (idx >= 1000 && idx <= 999 + APEX.length) return { tier: APEX[idx - 1000], div: null };
  if (idx >= 1 && idx <= FULL_GAME_LADDER.length) return FULL_GAME_LADDER[idx - 1];
  return null;
}

/**
 * Construit les repères d'un graphique de score rang façon u.gg : une ligne pointillée
 * par division, une bande de fond + une couleur de courbe par PALIER (pas par division —
 * les 4 divisions d'un même palier partagent sa couleur, comme sur u.gg).
 *
 * `min`/`max` sont les scores extrêmes réellement atteints sur la période affichée ; la
 * plage est élargie d'une marge pour ne pas coller la courbe aux bords du graphique.
 */
export function buildLpChartBands(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { lines: [], areas: [], gradientStops: [], domainMin: 0, domainMax: 100 };
  }

  const span = Math.max(1, max - min);
  const pad = Math.max(15, Math.round(span * 0.12));
  const domainMin = min - pad;
  const domainMax = max + pad;

  const idxLow = Math.floor(domainMin / 100);
  const idxHigh = Math.ceil(domainMax / 100);

  // N'énumère que les idx qui correspondent à un vrai palier — pas le vide numérique
  // entre le dernier palier normal (28, Diamant I) et le premier apex (1000, Maître).
  const idxs = [];
  for (let i = Math.max(1, idxLow); i <= Math.min(FULL_GAME_LADDER.length, idxHigh); i++) idxs.push(i);
  for (let i = Math.max(1000, idxLow); i <= Math.min(999 + APEX.length, idxHigh); i++) idxs.push(i);

  if (!idxs.length) {
    return { lines: [], areas: [], gradientStops: [], domainMin, domainMax };
  }

  const lines = idxs.map((idx) => {
    const r = rankAtIdx(idx);
    return {
      score: idx * 100,
      label: r.div ? `${r.tier[0]}${r.div}` : r.tier,
      color: TIER_COLORS[r.tier] || "var(--dim)",
    };
  });

  // Fusionne les divisions consécutives d'un même palier en une seule bande, plutôt
  // qu'une bande par division — même couleur, moins d'éléments à dessiner.
  const areas = [];
  for (let k = 0; k < idxs.length; ) {
    const tier = rankAtIdx(idxs[k]).tier;
    let j = k;
    while (j + 1 < idxs.length && idxs[j + 1] === idxs[j] + 1 && rankAtIdx(idxs[j + 1]).tier === tier) j++;
    areas.push({ y1: idxs[k] * 100, y2: (idxs[j] + 1) * 100, tier, color: TIER_COLORS[tier] || "var(--dim)" });
    k = j + 1;
  }

  // Dégradé vertical pour la courbe (haut = domainMax → offset 0%, bas = domainMin →
  // offset 100%) : deux arrêts à la même position à chaque frontière de palier créent
  // une transition nette plutôt qu'un fondu, pour que la courbe change de couleur en
  // franchissant un palier — recharts n'a pas de "ligne multicolore" native.
  const offsetOf = (score) => `${Math.min(100, Math.max(0, ((domainMax - score) / (domainMax - domainMin)) * 100))}%`;
  const gradientStops = [];
  for (const a of [...areas].sort((x, y) => y.y1 - x.y1)) {
    const top = Math.min(a.y2, domainMax);
    const bottom = Math.max(a.y1, domainMin);
    gradientStops.push({ offset: offsetOf(top), color: a.color });
    gradientStops.push({ offset: offsetOf(bottom), color: a.color });
  }

  return { lines, areas, gradientStops, domainMin, domainMax };
}
