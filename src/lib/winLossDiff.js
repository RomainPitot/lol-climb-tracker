import { computeAgg } from "./stats.js";

/** Mêmes métriques que le Point de focus (lib/focus.js) — pas la peine d'en redéfinir un
 * second jeu. `invert` : pour deaths, moins = mieux, donc "moins bon en défaite" veut dire
 * PLUS de morts en défaite qu'en victoire, pas l'inverse. */
const METRICS = [
  { key: "csmin", label: "CS/min", invert: false, decimals: 1 },
  { key: "visionMin", label: "Score de vision/min", invert: false, decimals: 2 },
  { key: "kda", label: "KDA", invert: false, decimals: 2 },
  { key: "deaths", label: "Deaths/game", invert: true, decimals: 1 },
];

/** Sous ce nombre de games par groupe (victoires/défaites), une moyenne ne veut rien dire —
 * même logique que partout ailleurs dans l'app (MIN_GAMES). */
const MIN_GAMES_PER_GROUP = 5;
/** Écart minimum (relatif) pour compter comme un vrai signal plutôt que du bruit d'échantillon. */
const MIN_GAP_PCT = 0.1;

/**
 * Écart entre les games gagnées et perdues du joueur, par métrique — le signal le plus
 * personnel possible pour repérer ce qui fait vraiment basculer SES games, contrairement à
 * roleBenchmark (un repère générique par rang, qui ne connaît pas le style de joueur).
 *
 * Normalisation en % RELATIF (pas en différence brute) pour rester comparable entre styles
 * de jeu différents : un joueur agressif qui gagne à 6 morts et perd à 8 (écart ~29%) et un
 * joueur safe qui gagne à 1 mort et perd à 1.4 (écart ~29% aussi) ont le même signal relatif,
 * même si l'écart brut (2 vs 0.4) semble très différent. Sans cette normalisation, le style
 * agressif écraserait toujours le style safe dans un classement par différence brute.
 *
 * Garde-fou volontaire : calculé EN PLUS de la comparaison au rang (voir autoCoach.js),
 * JAMAIS à sa place. Une métrique mauvaise de façon uniforme en victoire ET en défaite (ex:
 * CS/min toujours bas, gagné ou perdu) aura un écart proche de zéro ici — ce n'est pas
 * "pas un problème", c'est un problème que CE calcul ne peut pas voir par construction ;
 * seule la comparaison au rang le révèle. Les deux signaux doivent toujours coexister.
 */
export function computeWinLossDiff(games) {
  const wins = games.filter((g) => g.win);
  const losses = games.filter((g) => !g.win);
  if (wins.length < MIN_GAMES_PER_GROUP || losses.length < MIN_GAMES_PER_GROUP) return [];

  const aggWin = computeAgg(wins);
  const aggLoss = computeAgg(losses);

  const diffs = METRICS.map((m) => {
    const winValue = aggWin[m.key];
    const lossValue = aggLoss[m.key];
    // > 0 veut toujours dire "moins bon en défaite qu'en victoire", peu importe le sens
    // naturel de la métrique (deaths inversé, les autres non).
    const raw = m.invert ? lossValue - winValue : winValue - lossValue;
    const ref = Math.max(Math.abs(winValue), Math.abs(lossValue), 0.01);
    return { ...m, winValue, lossValue, gapPct: raw / ref };
  });

  return diffs.filter((d) => d.gapPct >= MIN_GAP_PCT).sort((a, b) => b.gapPct - a.gapPct);
}

/** Phrase du signal n°1 — "chez toi", pas "vs ton rang" (voir compareToRole dans
 * autoCoach.js pour l'autre moitié, toujours affichée en parallèle, jamais remplacée). */
export function winLossDiffPhrase(diff) {
  if (!diff) return null;
  const win = diff.winValue.toFixed(diff.decimals);
  const loss = diff.lossValue.toFixed(diff.decimals);
  const pct = Math.round(diff.gapPct * 100);
  return `Chez toi : ${diff.label} à ${win} quand tu gagnes, ${loss} quand tu perds — un écart de ${pct}%, plus parlant qu'un repère générique.`;
}
