import { riotFetch } from "./riotApi.js";

/**
 * Récupère et condense la Timeline Riot (Match-V5) d'un match — un snapshot de l'état du
 * jeu toutes les ~60s, plus tous les événements horodatés (morts, wards, objectifs,
 * achats...). Beaucoup plus riche que les stats finales seules (déjà utilisées ailleurs) :
 * c'est ce qui permet un bilan précis façon "coach qui a regardé la VOD minute par minute",
 * sans jamais avoir besoin d'une vraie vidéo (qui n'existe pas côté Riot pour une game
 * normale — voir la discussion produit qui a mené à ce fichier).
 *
 * Volontairement scopé à ce qui est FIABLEMENT dérivable de la timeline : diffs CS/or/XP
 * par intervalle, morts avec contexte, wards/control wards, objectifs (avec une
 * approximation de vision, explicitement marquée comme telle), items. PAS de détection de
 * recalls/roams/teamfights : la timeline ne les expose pas comme événements — les inférer
 * depuis les positions serait une estimation présentée à tort comme un fait (voir le
 * principe du GDD : jamais de valeur inventée à la place d'une donnée indisponible).
 */

const INTERVALS_MIN = [5, 10, 15, 20, 25];
/** Control Ward — id stable depuis des années, contrairement à d'autres items de vision. */
const CONTROL_WARD_ITEM_ID = 2055;
/** Rayon (unités de la carte, ~14820 de large) considéré "proche" d'un objectif pour
 * l'approximation de vision — la fosse d'un dragon/Baron fait environ ce diamètre. */
const OBJECTIVE_VISION_RADIUS = 2200;
/** Fenêtre avant un objectif dans laquelle une ward encore active compte comme "vision
 * posée pour cet objectif". */
const OBJECTIVE_VISION_WINDOW_MS = 3 * 60 * 1000;

export async function fetchMatchTimeline(matchId, continent, conn) {
  return riotFetch(`https://${continent}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`, conn);
}

function distance(a, b) {
  if (!a || !b || a.x == null || b.x == null) return Infinity;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Le dernier frame dont le timestamp ne dépasse pas `targetMs` — null si la game s'est
 * terminée avant cet intervalle (rien à comparer, pas une valeur à zéro). */
function frameAtOrBefore(frames, targetMs) {
  let best = null;
  for (const f of frames) {
    if (f.timestamp > targetMs) break;
    best = f;
  }
  return best;
}

/**
 * Condense une timeline brute en résumé exploitable côté app — voir le commentaire de
 * fichier pour le périmètre exact. Retourne null si le joueur n'apparaît pas dans le match
 * (ne devrait pas arriver ici puisqu'on l'a déjà filtré via riotMatchToGame, mais on reste
 * défensif plutôt que de planter sur une timeline malformée).
 */
export function buildTimelineSummary(timeline, match, puuid) {
  const participants = match?.info?.participants || [];
  const me = participants.find((p) => p.puuid === puuid);
  if (!me || !timeline?.info?.frames) return null;

  const myId = me.participantId;
  const myTeamId = me.teamId;
  const opponent = participants.find((p) => p.teamId !== myTeamId && p.teamPosition === me.teamPosition);
  const oppId = opponent?.participantId;

  const champById = {};
  const teamById = {};
  for (const p of participants) {
    champById[p.participantId] = p.championName;
    teamById[p.participantId] = p.teamId;
  }

  const frames = timeline.info.frames;

  const diffs = {};
  for (const min of INTERVALS_MIN) {
    const frame = frameAtOrBefore(frames, min * 60 * 1000);
    const mine = frame?.participantFrames?.[myId];
    if (!mine) continue; // game finie avant cet intervalle — pas une valeur à zéro, absente.
    const opp = oppId ? frame.participantFrames[oppId] : null;
    const myCs = mine.minionsKilled + mine.jungleMinionsKilled;
    const oppCs = opp ? opp.minionsKilled + opp.jungleMinionsKilled : null;
    diffs[min] = {
      cs: myCs,
      gold: mine.totalGold,
      xp: mine.xp,
      csDiff: opp ? myCs - oppCs : null,
      goldDiff: opp ? mine.totalGold - opp.totalGold : null,
      xpDiff: opp ? mine.xp - opp.xp : null,
    };
  }

  const deaths = [];
  const items = [];
  const myWards = []; // { ts, x, y } — actives tant qu'on ne sait pas qu'elles ont été détruites
  const objectives = [];
  let wardsPlaced = 0;
  let wardsDestroyed = 0;
  let controlWardsBought = 0;

  for (const frame of frames) {
    for (const ev of frame.events || []) {
      if (ev.type === "WARD_PLACED" && teamById[ev.creatorId] === myTeamId) {
        wardsPlaced++;
        if (ev.position) myWards.push({ ts: ev.timestamp, x: ev.position.x, y: ev.position.y });
      } else if (ev.type === "WARD_KILL" && teamById[ev.killerId] === myTeamId) {
        wardsDestroyed++;
      } else if (ev.type === "ITEM_PURCHASED" && ev.participantId === myId) {
        items.push({ timestamp: ev.timestamp, itemId: ev.itemId });
        if (ev.itemId === CONTROL_WARD_ITEM_ID) controlWardsBought++;
      } else if (ev.type === "CHAMPION_KILL" && ev.victimId === myId) {
        const mine = frame.participantFrames?.[myId];
        deaths.push({
          timestamp: ev.timestamp,
          position: ev.position || null,
          killer: champById[ev.killerId] || null,
          assists: (ev.assistingParticipantIds || []).map((id) => champById[id]).filter(Boolean),
          myGoldAtDeath: mine?.currentGold ?? null,
          myLevelAtDeath: mine?.level ?? null,
          myCsAtDeath: mine ? mine.minionsKilled + mine.jungleMinionsKilled : null,
          bounty: ev.bounty ?? null,
          // Non dérivable de la timeline (pas d'événement "sort lancé") : à taguer par le
          // coach s'il le sait (voir GameAnalysisModal), jamais deviné ici.
          flashAvailable: null,
        });
      } else if (ev.type === "ELITE_MONSTER_KILL") {
        const takenByMyTeam = teamById[ev.killerId] === myTeamId;
        objectives.push({
          timestamp: ev.timestamp,
          kind: ev.monsterType, // DRAGON | RIFTHERALD | BARON_NASHOR | HORDE (grubs)
          takenByMyTeam,
          // Approximation, jamais un fait certain : une ward de mon équipe active dans un
          // rayon proche des ~3 min précédentes. Ne couvre que les prises de MON équipe —
          // je n'ai pas la vision adverse pour juger ses prises.
          myTeamHadVisionApprox: takenByMyTeam
            ? myWards.some((w) => ev.timestamp - w.ts <= OBJECTIVE_VISION_WINDOW_MS && ev.timestamp - w.ts >= 0 && distance(w, ev.position) <= OBJECTIVE_VISION_RADIUS)
            : null,
        });
      } else if (ev.type === "BUILDING_KILL") {
        objectives.push({
          timestamp: ev.timestamp,
          kind: ev.buildingType, // TOWER_BUILDING | INHIBITOR_BUILDING
          laneType: ev.laneType || null,
          takenByMyTeam: teamById[ev.killerId] === myTeamId,
          myTeamHadVisionApprox: null, // pas calculé pour les structures — moins pertinent.
        });
      }
    }
  }

  return {
    role: me.teamPosition,
    opponentChampion: opponent ? champById[oppId] : null,
    diffs,
    deaths,
    objectives,
    items,
    wards: { placed: wardsPlaced, destroyed: wardsDestroyed, controlWardsBought },
  };
}
