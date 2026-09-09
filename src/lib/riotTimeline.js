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

// Repères approximatifs de la carte Summoner's Rift (unités Riot, carte ~14820 de large) —
// juste assez précis pour classer une position en zone grossière, jamais présenté comme
// une donnée Riot brute (voir classifyDeathZone). Coordonnées communément admises par les
// outils communautaires (bases, fosses des objectifs neutres).
const BLUE_BASE = { x: 1500, y: 1500 };
const RED_BASE = { x: 13300, y: 13300 };
const DRAGON_PIT = { x: 9800, y: 4400 };
const BARON_PIT = { x: 4900, y: 10900 };
const MAP_SIZE = 14820;
const NEAR_BASE_RADIUS = 3000;
const NEAR_PIT_RADIUS = 2500;
const LANE_BAND = 1800;

/** Nombre de participants (l'un ou l'autre camp, victime exclue) dont la position connue
 * au snapshot de cette minute est proche du point de mort — approximatif : la position
 * réelle au moment exact de la mort peut avoir jusqu'à ~1 min d'écart avec ce snapshot. */
const NEARBY_RADIUS = 2000;
/** Combattants (killer + assists, ou monde proche) à partir duquel une mort compte comme
 * un teamfight plutôt qu'un duel — 3 = la victime + au moins deux autres impliqués. */
const TEAMFIGHT_THRESHOLD = 3;

const PHASE_BOUNDARIES_MIN = { early: 14, mid: 25 };

function phaseOf(timestampMs) {
  const min = timestampMs / 60000;
  if (min < PHASE_BOUNDARIES_MIN.early) return "early";
  if (min < PHASE_BOUNDARIES_MIN.mid) return "mid";
  return "late";
}

/**
 * Zone approximative d'une position (lane/river/jungle/base) — une heuristique de
 * distance aux repères de la carte ci-dessus, PAS une donnée Riot : à annoncer comme telle
 * partout où c'est affiché (voir GameAnalysisModal).
 */
function classifyDeathZone(pos) {
  if (!pos || pos.x == null) return null;
  if (distance(pos, BLUE_BASE) < NEAR_BASE_RADIUS || distance(pos, RED_BASE) < NEAR_BASE_RADIUS) return "base";
  if (distance(pos, DRAGON_PIT) < NEAR_PIT_RADIUS || distance(pos, BARON_PIT) < NEAR_PIT_RADIUS) return "river";

  const distToMidLane = Math.abs(pos.x - pos.y) / Math.SQRT2;
  const distToTopLane = Math.min(pos.x, MAP_SIZE - pos.y);
  const distToBotLane = Math.min(pos.y, MAP_SIZE - pos.x);
  if (Math.min(distToMidLane, distToTopLane, distToBotLane) < LANE_BAND) return "lane";
  return "jungle";
}

/** Solo kill vs teamfight — combine le nombre de combattants directement crédités
 * (killer + assists) et la présence d'autres participants à proximité au même snapshot
 * (voir NEARBY_RADIUS) : une estimation, pas un fait (la position exacte au moment de la
 * mort peut différer du dernier snapshot minute par minute). */
function classifyDeathContext(frame, position, victimId, creditedCombatants) {
  if (creditedCombatants >= TEAMFIGHT_THRESHOLD) return "teamfight";
  if (!position) return creditedCombatants >= 2 ? "teamfight" : "solo";
  let nearby = 0;
  for (const pf of Object.values(frame.participantFrames || {})) {
    if (pf.participantId === victimId) continue;
    if (distance(pf.position, position) <= NEARBY_RADIUS) nearby++;
  }
  return Math.max(creditedCombatants, nearby) >= TEAMFIGHT_THRESHOLD ? "teamfight" : "solo";
}

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
        const assists = (ev.assistingParticipantIds || []).map((id) => champById[id]).filter(Boolean);
        deaths.push({
          timestamp: ev.timestamp,
          phase: phaseOf(ev.timestamp),
          position: ev.position || null,
          // Approximations, jamais des faits Riot bruts — voir classifyDeathZone/Context.
          zone: classifyDeathZone(ev.position),
          context: classifyDeathContext(frame, ev.position, myId, 1 + assists.length),
          killer: champById[ev.killerId] || null,
          assists,
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
          phase: phaseOf(ev.timestamp),
          kind: ev.monsterType, // DRAGON | RIFTHERALD | BARON_NASHOR | HORDE (grubs)
          takenByMyTeam,
          position: ev.position || null,
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
          phase: phaseOf(ev.timestamp),
          kind: ev.buildingType, // TOWER_BUILDING | INHIBITOR_BUILDING
          laneType: ev.laneType || null,
          takenByMyTeam: teamById[ev.killerId] === myTeamId,
          position: ev.position || null,
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
    // Positions (+ timestamp) des wards posées — pour la heatmap (voir lib/heatmap.js, qui
    // ignore `ts`) et pour approximer "avait-on de la vision proche avant cette mort"
    // (voir lib/deathGuess.js). Pas conservées avant cet ajout, donc absentes sur les games
    // importées plus tôt (pas d'estimation de remplacement).
    wardPositions: myWards.map((w) => ({ x: w.x, y: w.y, ts: w.ts })),
  };
}
