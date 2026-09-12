import { TIERS, roleBenchmark } from "../constants/ranks.js";

/**
 * À quel palier (Fer→Diamant), isolément, cette métrique situerait le joueur — en trouvant
 * le tier le plus élevé dont le repère (roleBenchmark) est atteint. Les repères sont
 * strictement croissants en difficulté d'un tier au suivant (voir BENCHMARKS dans
 * constants/ranks.js), donc le premier échec rencontré en parcourant Fer→Diamant dans
 * l'ordre signifie que tous les tiers suivants échoueraient aussi — pas besoin de les
 * tester un par un.
 * Renvoie `null` si même Fer n'est pas atteint — honnête plutôt que de forcer un palier
 * plancher qui ne reflète pas la réalité.
 */
export function tierLevelForMetric(value, role, benchKey, invert) {
  let matched = null;
  for (const tier of TIERS) {
    const target = roleBenchmark(tier, role)[benchKey];
    if (target == null) break;
    const passes = invert ? value <= target : value >= target;
    if (!passes) break;
    matched = tier;
  }
  return matched;
}
