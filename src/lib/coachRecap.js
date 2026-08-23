import { GOAL_TYPES } from "../constants/game.js";
import { rankLabel } from "./rank.js";
import { computeAgg, groupByChampion } from "./stats.js";
import { detectSessions } from "./sessions.js";
import { computeGoalProgress } from "./goals.js";
import { isBotLaneRole } from "./gameModel.js";
import { round1, round2 } from "./format.js";

/** Nombre minimum de games hors sélection pour que la comparaison ait un sens. */
export const MIN_COMPARISON_GAMES = 3;

/** Une game condensée en une ligne lisible par une IA. */
export function gameLine(g) {
  const matchup = isBotLaneRole(g.role)
    ? `Adversaires: ${g.matchupAdc || "?"} / ${g.matchupSupport || "?"}`
    : g.matchup
      ? `Matchup: ${g.matchup}`
      : "";

  const bits = [
    g.date,
    g.champion,
    `${g.role}${g.roleStatus ? ` (${g.roleStatus})` : ""}`,
    g.win ? "Victoire" : "Défaite",
    `KDA ${g.kills}/${g.deaths}/${g.assists}`,
    `CS/min ${g.duration ? round1(g.cs / g.duration) : 0}`,
    `Dmg ${g.damage}`,
    `${g.lpChange >= 0 ? "+" : ""}${g.lpChange} LP`,
    g.side ? `Side: ${g.side === "Blue" ? "Bleu" : "Rouge"}` : "",
    matchup,
    g.deathCause ? `Cause morts: ${g.deathCause}` : "",
    g.comment ? `Note: ${g.comment}` : "",
    g.gameComment ? `Game: ${g.gameComment}` : "",
  ];

  return `- ${bits.filter(Boolean).join(" — ")}`;
}

function buildAlerts({ selAgg, restAgg, selectedGames, enoughRest, sessions, champs }) {
  const alerts = [];
  const lastSession = sessions[0];
  const weakChamp = champs.find((c) => c.games >= 10 && c.wr < 45);

  if (selAgg.deaths >= 8.5) {
    alerts.push(`Deaths trop élevées sur la sélection (${round1(selAgg.deaths)}/game).`);
  }
  if (enoughRest && selAgg.csmin < restAgg.csmin - 0.4) {
    alerts.push(
      `CS/min plus bas sur la sélection que sur le reste du profil (${round1(restAgg.csmin)} → ${round1(selAgg.csmin)}).`
    );
  }
  if (lastSession && lastSession.games >= 8) {
    alerts.push(
      `Dernière session longue (${lastSession.games} games consécutives) — risque de fatigue/tilt.`
    );
  }
  if (weakChamp) {
    alerts.push(
      `${weakChamp.champion} a un winrate faible (${round1(weakChamp.wr)}% sur ${weakChamp.games} games).`
    );
  }
  if (selectedGames.length) {
    const tiltAvg = selectedGames.reduce((a, g) => a + (Number(g.tilt) || 0), 0) / selectedGames.length;
    if (tiltAvg >= 4) alerts.push(`Tilt moyen élevé sur la sélection (${round1(tiltAvg)}/5).`);
  }
  if (enoughRest && selAgg.wr - restAgg.wr >= 10) {
    alerts.push(
      `Winrate nettement meilleur sur la sélection que sur le reste du profil (+${round1(selAgg.wr - restAgg.wr)} pts).`
    );
  }

  return alerts;
}

function buildTrends({ selAgg, restAgg, enoughRest }) {
  const positives = [];
  const negatives = [];

  if (enoughRest) {
    const compare = (better, good, bad) => (better ? positives : negatives).push(better ? good : bad);

    compare(
      selAgg.wr >= restAgg.wr,
      `Winrate supérieur au reste du profil : ${round1(restAgg.wr)}% → ${round1(selAgg.wr)}%.`,
      `Winrate inférieur au reste du profil : ${round1(restAgg.wr)}% → ${round1(selAgg.wr)}%.`
    );
    compare(
      selAgg.csmin >= restAgg.csmin,
      `CS/min en progrès vs reste du profil : ${round1(restAgg.csmin)} → ${round1(selAgg.csmin)}.`,
      `CS/min en retrait vs reste du profil : ${round1(restAgg.csmin)} → ${round1(selAgg.csmin)}.`
    );
    compare(
      selAgg.deaths <= restAgg.deaths,
      `Moins de morts en moyenne : ${round1(restAgg.deaths)} → ${round1(selAgg.deaths)}.`,
      `Plus de morts en moyenne : ${round1(restAgg.deaths)} → ${round1(selAgg.deaths)}.`
    );
  }

  // Le format attendu par le prompt est fixe : trois lignes de chaque côté.
  while (positives.length < 3) positives.push("—");
  while (negatives.length < 3) negatives.push("—");

  return { positives, negatives };
}

/**
 * Produit le récapitulatif texte à coller dans une IA coach.
 * Compare la sélection au *reste* du profil (pas au profil entier) pour éviter
 * de comparer un lot de games avec un ensemble qui le contient déjà.
 */
export function buildCoachRecap({ data, sorted, selectedIds }) {
  const selectedGames = sorted.filter((g) => selectedIds.has(g.id));
  const restGames = sorted.filter((g) => !selectedIds.has(g.id));

  const selAgg = computeAgg(selectedGames);
  const restAgg = computeAgg(restGames);
  const global = computeAgg(sorted);
  const enoughRest = restGames.length >= MIN_COMPARISON_GAMES;

  const yoneAgg = computeAgg(sorted.filter((g) => g.champion === "Yone"));
  const tahmAgg = computeAgg(sorted.filter((g) => g.champion === "Tahm Kench"));
  const yoneSel = computeAgg(selectedGames.filter((g) => g.champion === "Yone"));
  const yoneShare = selectedGames.length ? (yoneSel.games / selectedGames.length) * 100 : 0;

  const alerts = buildAlerts({
    selAgg,
    restAgg,
    selectedGames,
    enoughRest,
    sessions: detectSessions(data.games),
    champs: groupByChampion(sorted),
  });
  const { positives, negatives } = buildTrends({ selAgg, restAgg, enoughRest });

  const goalsText = data.goals.length
    ? data.goals
        .map((goal) => {
          const p = computeGoalProgress(goal, sorted);
          const label = GOAL_TYPES.find((t) => t.id === goal.type)?.label;
          return `- ${label} : ${p.label}${p.met ? " (atteint)" : ""}`;
        })
        .join("\n")
    : "Aucun objectif défini.";

  const last = sorted.at(-1);
  const curTier = last?.rankAfterTier || data.historical.global.tier;
  const curDiv = last?.rankAfterDiv || data.historical.global.div;
  const curLp = last?.lpAfter ?? data.historical.global.lp;

  return `=== SITUATION ACTUELLE ===
Rang : ${rankLabel(curTier, curDiv)} — ${curLp} LP
Winrate (profil complet) : ${round1(global.wr)}% (${global.wins}W / ${global.losses}L sur ${global.games} games)

=== GAMES SÉLECTIONNÉES (${selectedGames.length}) ===
${selectedGames.length ? selectedGames.map(gameLine).join("\n") : "Aucune game sélectionnée."}

Résumé de la sélection : ${selAgg.wins}W / ${selAgg.losses}L — ${round1(selAgg.wr)}% WR — KDA ${round2(selAgg.kda)} — CS/min ${round1(selAgg.csmin)} — Dégâts/game ${Math.round(selAgg.damageGame)} — LP total ${selAgg.lpSum >= 0 ? "+" : ""}${round1(selAgg.lpSum)}

=== YONE (vue d'ensemble du profil) ===
${yoneAgg.games} games — ${round1(yoneAgg.wr)}% WR — KDA ${round2(yoneAgg.kda)} — CS/min ${round1(yoneAgg.csmin)}
Dans la sélection : ${yoneSel.games} games Yone — ${round1(yoneSel.wr)}% WR

=== TAHM KENCH (vue d'ensemble du profil) ===
${tahmAgg.games} games — ${round1(tahmAgg.wr)}% WR — KDA ${round2(tahmAgg.kda)} — CS/min ${round1(tahmAgg.csmin)}

=== OBJECTIFS ===
${goalsText}

=== TENDANCES (sélection vs reste du profil) ===
Points positifs :
1. ${positives[0]}
2. ${positives[1]}
3. ${positives[2]}
Points faibles :
1. ${negatives[0]}
2. ${negatives[1]}
3. ${negatives[2]}
Part Yone dans la sélection : ${round1(yoneShare)}%

=== ALERTES ===
${alerts.length ? alerts.map((a) => `- ${a}`).join("\n") : "- Aucune alerte particulière détectée."}

=== QUESTION AU COACH IA ===
Analyse ma progression et donne-moi mes 3 priorités d'entraînement pour les prochaines games.`;
}
