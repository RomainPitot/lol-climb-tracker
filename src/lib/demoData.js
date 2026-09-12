import { applyLpChange } from "./rank.js";

/**
 * Données de démonstration pour un nouveau visiteur qui veut voir à quoi ressemble un
 * Dashboard rempli avant de s'engager (taper ses games à la main ou configurer l'import
 * Riot) — voir EmptyDashboardState.jsx. Construites à la main (pas de vraies games, pas
 * d'API) pour illustrer volontairement les signaux du Coach plutôt qu'un profil neutre qui
 * n'aurait rien à montrer : vision basse de façon uniforme (repérée seulement par le repère
 * de rang, jamais par le différentiel victoire/défaite — voir winLossDiff.js), et des morts
 * nettement plus fréquentes en défaite qu'en victoire (signal "chez toi" bien réel).
 *
 * Jamais mélangées aux vraies games de l'utilisateur : chargées uniquement depuis un état
 * à 0 game, marquées via settings.demoMode, et effacées proprement par resetStats()
 * (garde la config de connexion Riot/GameDetectorLol, contrairement à resetAll).
 */

const CHAMPIONS = ["Ahri", "Yone", "Zed"];

// Alternance délibérée plutôt qu'aléatoire : reproductible, et le motif "morts hautes en
// défaite" doit rester net sur un petit échantillon (24 games) pour que le signal
// win/loss (winLossDiff.js, MIN_GAMES_PER_GROUP=5) ait de quoi se déclencher clairement.
const PATTERN = [
  { win: true, deaths: 4 },
  { win: true, deaths: 6 },
  { win: false, deaths: 9 },
  { win: true, deaths: 5 },
  { win: false, deaths: 10 },
  { win: true, deaths: 3 },
];

export function buildDemoGames() {
  let rank = { tier: "Argent", div: "II", lp: 35 };
  const games = [];

  for (let i = 0; i < 24; i++) {
    const p = PATTERN[i % PATTERN.length];
    const champion = CHAMPIONS[i % CHAMPIONS.length];
    const duration = 26 + (i % 5); // 26-30 min, varié mais réaliste
    const kills = p.win ? 6 + (i % 4) : 3 + (i % 3);
    const assists = p.win ? 5 + (i % 3) : 3 + (i % 2);
    const cs = Math.round((5.6 + (i % 4) * 0.3) * duration); // ~5.6-6.5 cs/min, point fort
    const visionScore = Math.round(0.32 * duration); // ~0.32 vision/min, sous le repère, uniforme
    const lpChange = p.win ? 16 + (i % 5) : -(14 + (i % 4));

    const rankBefore = rank;
    rank = applyLpChange(rankBefore, lpChange);

    const daysAgo = 24 - i;
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);

    games.push({
      id: `demo-${i}`,
      champion,
      role: "Mid",
      matchup: "",
      win: p.win,
      duration,
      kills,
      deaths: p.deaths,
      assists,
      cs,
      visionScore,
      damage: Math.round((450 + (i % 5) * 60) * duration),
      gold: Math.round(280 * duration),
      lpChange,
      date,
      time: "19:30",
      rankBeforeTier: rankBefore.tier,
      rankBeforeDiv: rankBefore.div,
      lpBefore: rankBefore.lp,
      rankAfterTier: rank.tier,
      rankAfterDiv: rank.div,
      lpAfter: rank.lp,
      timelineSummary: null,
      deathTags: [],
      excluded: false,
    });
  }

  return games;
}
