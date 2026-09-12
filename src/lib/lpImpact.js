import { perGameValue } from "./focus.js";

/** Sous ce seuil par groupe, comparer deux moyennes de LP n'a aucun sens statistique —
 * même logique de garde-fou que winLossDiff.js/priorityScore.js : pas de chiffre inventé
 * sur un échantillon trop court. */
const MIN_GAMES_PER_GROUP = 5;

/** Écart minimum (en LP) pour valoir la peine d'être affiché — sinon c'est du bruit que le
 * joueur prendrait pour un vrai signal. */
const MIN_DIFF_LP = 0.5;

/**
 * Estimation d'impact LP par métrique — PAS une preuve de causalité, une corrélation
 * simple et honnête : sépare les games du joueur en deux groupes selon SA PROPRE médiane
 * sur cette métrique (au-dessus / en-dessous), compare le LP moyen gagné/perdu de chaque
 * groupe. Sert à transformer "ton CS/min est bas" en "ça te coûte ≈ X LP en moyenne" — plus
 * motivant qu'un simple écart de métrique, sans jamais prétendre à plus qu'une corrélation.
 */
export function computeLpImpact(games, metricId) {
  const withLp = games.filter((g) => typeof g.lpChange === "number");
  if (withLp.length < MIN_GAMES_PER_GROUP * 2) return null;

  const sortedValues = withLp.map((g) => perGameValue(g, metricId)).sort((a, b) => a - b);
  const median = sortedValues[Math.floor(sortedValues.length / 2)];

  const below = withLp.filter((g) => perGameValue(g, metricId) < median);
  const above = withLp.filter((g) => perGameValue(g, metricId) >= median);
  if (below.length < MIN_GAMES_PER_GROUP || above.length < MIN_GAMES_PER_GROUP) return null;

  const avgLp = (list) => list.reduce((a, g) => a + g.lpChange, 0) / list.length;
  return {
    belowAvg: avgLp(below),
    aboveAvg: avgLp(above),
    belowCount: below.length,
    aboveCount: above.length,
  };
}

/**
 * Phrase prête à afficher, ou `null` si l'écart est trop faible pour être parlant (voir
 * MIN_DIFF_LP) — jamais une phrase qui invente un lien là où les chiffres n'en montrent
 * quasiment pas. Toujours labellisée "≈" et "corrélation" pour ne jamais laisser croire à
 * une preuve de cause à effet (une seule métrique parmi beaucoup influence le LP).
 */
export function lpImpactPhrase(impact, metricLabel, invert) {
  if (!impact) return null;
  // Le "bon" groupe (au sens de cette métrique) est en dessous de la médiane pour une
  // métrique inversée (deaths : moins = mieux), au-dessus pour toutes les autres.
  const betterAvg = invert ? impact.belowAvg : impact.aboveAvg;
  const worseAvg = invert ? impact.aboveAvg : impact.belowAvg;
  const diff = betterAvg - worseAvg;
  if (diff < MIN_DIFF_LP) return null;

  const worseSide = invert ? "au-dessus de" : "sous";
  return `≈ Sur tes games où ${metricLabel} est ${worseSide} ta médiane, tu gagnes ${diff.toFixed(1)} LP de moins en moyenne (corrélation, pas une preuve de causalité).`;
}
