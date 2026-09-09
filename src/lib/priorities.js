import { computeAlerts } from "./alerts.js";
import { representativeGames } from "./gameModel.js";
import { computeAgg, mostFrequentRole } from "./stats.js";
import { roleBenchmark } from "../constants/ranks.js";

const RECENT_WINDOW = 10;
const MAX_PRIORITIES = 3;
/** Écart minimum (en % du repère) pour qu'une métrique compte comme un axe faible — sous
 * ce seuil, l'écart est dans le bruit normal d'un échantillon de 10 games. */
const MIN_GAP_PCT = 0.05;

function weakestMetricCandidates(repSorted, currentRank) {
  const recent = repSorted.slice(-RECENT_WINDOW);
  if (recent.length < 3) return [];
  const role = mostFrequentRole(recent) || "Mid";
  const bench = roleBenchmark(currentRank.tier, role);
  const agg = computeAgg(recent);

  const gaps = [
    { metric: "csmin", label: "CS/min", current: agg.csmin, target: bench.csmin, gapPct: bench.csmin ? (bench.csmin - agg.csmin) / bench.csmin : 0 },
    { metric: "visionmin", label: "Vision/min", current: agg.visionMin, target: bench.visionmin, gapPct: bench.visionmin ? (bench.visionmin - agg.visionMin) / bench.visionmin : 0 },
    { metric: "deaths", label: "Deaths/game", current: agg.deaths, target: bench.deaths, gapPct: bench.deaths ? (agg.deaths - bench.deaths) / bench.deaths : 0 },
    { metric: "kda", label: "KDA", current: agg.kda, target: bench.kda, gapPct: bench.kda ? (bench.kda - agg.kda) / bench.kda : 0 },
  ];

  return gaps.filter((g) => g.gapPct > MIN_GAP_PCT).sort((a, b) => b.gapPct - a.gapPct);
}

/**
 * "3 priorités de la semaine" (voir GDD coaching) — reprend le moteur des alertes
 * (lib/alerts.js) mais exclut ce qu'elles affichent déjà (AlertsPanel, juste au-dessus sur
 * le Dashboard) pour ne jamais montrer deux fois la même chose. Complète avec les
 * correctifs pas encore démarrés, puis la métrique la plus en retrait vs le repère du rôle
 * sur les 10 dernières games — un signal plus doux que les alertes, pour savoir sur quoi
 * travailler même quand rien n'est franchement alarmant.
 */
export function computePriorities(data, sorted, currentRank) {
  const alertIds = new Set(computeAlerts(data, sorted).map((a) => a.id));
  const priorities = [];

  for (const c of data.corrections || []) {
    if (c.status !== "todo") continue;
    const id = `correction-todo-${c.id}`;
    if (alertIds.has(id)) continue;
    priorities.push({ id, severity: 2, message: `Correctif "${c.title}" pas encore démarré.` });
  }

  if (priorities.length < MAX_PRIORITIES) {
    const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);
    for (const g of weakestMetricCandidates(repSorted, currentRank)) {
      if (priorities.length >= MAX_PRIORITIES) break;
      const id = `weak-${g.metric}`;
      if (alertIds.has(id)) continue;
      priorities.push({
        id,
        severity: 1,
        message: `${g.label} en retrait vs ton rôle sur les ${RECENT_WINDOW} dernières games (actuel ${g.current.toFixed(1)}, repère ${g.target.toFixed(1)}).`,
      });
    }
  }

  return priorities.sort((a, b) => b.severity - a.severity).slice(0, MAX_PRIORITIES);
}
