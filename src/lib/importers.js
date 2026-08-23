import { uid } from "./format.js";
import { isBotLaneRole } from "./gameModel.js";
import { REVERSE_CHAMP } from "../constants/roster.js";
import { RIOT_ROLE_MAP } from "../constants/riot.js";

/** Parse un tableau collé (TSV depuis un tableur, ou CSV) en objets clés-en-minuscules. */
export function parsePastedTable(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (!lines.length) return [];

  const sep = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const cells = line.split(sep);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]?.trim()]));
  });
}

export function csvToGames(text) {
  return parsePastedTable(text).map((r) => ({
    id: uid(),
    date: r.date || new Date().toISOString().slice(0, 10),
    time: r.time || "20:00",
    rankBeforeTier: r.rankbeforetier || "Émeraude",
    rankBeforeDiv: r.rankbeforediv || "III",
    lpBefore: Number(r.lpbefore) || 0,
    champion: r.champion || "Yone",
    role: r.role || "Mid",
    roleStatus: r.rolestatus || "Rôle principal",
    win: /^(1|true|victoire|win|w)$/i.test(r.win || r.result || ""),
    rankAfterTier: r.rankaftertier || r.rankbeforetier || "Émeraude",
    rankAfterDiv: r.rankafterdiv || r.rankbeforediv || "III",
    lpAfter: Number(r.lpafter) || 0,
    lpChange: Number(r.lpchange) || 0,
    kills: Number(r.kills) || 0,
    deaths: Number(r.deaths) || 0,
    assists: Number(r.assists) || 0,
    cs: Number(r.cs) || 0,
    duration: Number(r.duration) || 25,
    damage: Number(r.damage) || 0,
    gold: Number(r.gold) || 0,
    visionScore: Number(r.vision) || 0,
    matchup: r.matchup || "",
    matchupAdc: r.matchupadc || "",
    matchupSupport: r.matchupsupport || "",
    side: r.side || "Blue",
  }));
}

/**
 * Convertit un match Riot (Match-V5) en game du tracker, du point de vue du joueur `puuid`.
 * Renvoie null si le puuid n'apparaît pas dans le match.
 * Note : l'API ne fournit pas le gain/perte de LP — il reste à 0 et se corrige à la main.
 */
export function riotMatchToGame(match, puuid) {
  const info = match?.info;
  const me = info?.participants?.find((p) => p.puuid === puuid);
  if (!me) return null;

  const role = RIOT_ROLE_MAP[me.teamPosition] || "Mid";
  const botLane = isBotLaneRole(role);
  const enemy = (pos) =>
    info.participants.find((p) => p.teamId !== me.teamId && p.teamPosition === pos);

  const opp = enemy(me.teamPosition);
  const oppAdc = enemy("BOTTOM");
  const oppSup = enemy("UTILITY");
  const named = (p) => (p ? REVERSE_CHAMP[p.championName] || p.championName : "");

  const start = new Date(info.gameStartTimestamp || info.gameCreation);

  return {
    id: uid(),
    matchId: match.metadata?.matchId,
    date: start.toISOString().slice(0, 10),
    time: start.toTimeString().slice(0, 5),
    champion: REVERSE_CHAMP[me.championName] || me.championName,
    role,
    roleStatus: "Rôle principal",
    win: !!me.win,
    lpChange: 0,
    kills: me.kills || 0,
    deaths: me.deaths || 0,
    assists: me.assists || 0,
    cs: (me.totalMinionsKilled || 0) + (me.neutralMinionsKilled || 0),
    duration: Math.max(1, Math.round((info.gameDuration || 0) / 60)),
    damage: me.totalDamageDealtToChampions || 0,
    gold: me.goldEarned || 0,
    visionScore: me.visionScore || 0,
    matchup: !botLane ? named(opp) : "",
    matchupAdc: botLane ? named(oppAdc) : "",
    matchupSupport: botLane ? named(oppSup) : "",
    side: me.teamId === 100 ? "Blue" : "Red",
    firstDeath: false,
    firstBlood: !!me.firstBloodKill,
    avoidableDeaths: 0,
    deathCause: "",
    comment: "",
    gameComment: "",
    feeling: 3,
    focus: 3,
    tilt: 1,
  };
}
