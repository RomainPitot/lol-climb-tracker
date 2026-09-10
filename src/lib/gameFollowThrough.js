import { computeAgg } from "./stats.js";
import { focusMetricValue, FOCUS_METRICS } from "./focus.js";
import { computeAlerts } from "./alerts.js";

function meetsTarget(value, invert, target) {
  return invert ? value <= target : value >= target;
}

/**
 * "As-tu suivi tes conseils ?" — pour UNE game précise (la dernière importée), vérifie si
 * elle a tenu le focus en cours et les correctifs actifs, et si les alertes du Dashboard
 * changent à cause d'elle. Toujours calculé depuis les vrais chiffres de cette seule game
 * (jamais une moyenne qui dilue) — un focus/correctif porte sur une tendance, donc "pas
 * encore" sur une game isolée n'est jamais un échec en soi, juste un chiffre à situer.
 */
export function buildFollowThroughReport(data, sorted, newGame) {
  const items = [];
  const agg = computeAgg([newGame]);

  const focusMetric = data.settings.focusMetric;
  if (focusMetric && data.settings.focusStartValue != null) {
    const def = FOCUS_METRICS.find((m) => m.id === focusMetric);
    if (def) {
      const value = focusMetricValue(agg, def.id);
      const startValue = Number(data.settings.focusStartValue);
      const ok = def.invert ? value <= startValue : value >= startValue;
      items.push({
        kind: "focus",
        ok,
        message: `Focus ${def.label} : ${value.toFixed(def.decimals)} sur cette game (départ ${startValue.toFixed(def.decimals)}) — ${ok ? "dans la bonne direction." : "pas encore, une game ne fait pas une tendance."}`,
      });
    }
  }

  for (const c of data.corrections || []) {
    if (c.status !== "in_progress") continue;
    const def = FOCUS_METRICS.find((m) => m.id === c.metric);
    if (!def) continue;
    const value = focusMetricValue(agg, def.id);
    const ok = meetsTarget(value, def.invert, c.targetValue);
    items.push({
      kind: "correction",
      ok,
      message: `Correctif "${c.title}" : ${value.toFixed(def.decimals)} sur cette game (cible ${def.invert ? "≤" : "≥"} ${c.targetValue}) — ${ok ? "cible tenue sur cette game." : "cible pas tenue sur cette game."}`,
    });
  }

  // Alertes qui changent à cause de cette game précise — comparaison avant/après plutôt
  // qu'une simple liste, pour dire honnêtement ce que CETTE game a changé, pas juste l'état
  // courant (déjà affiché ailleurs, voir AlertsPanel).
  const idx = sorted.findIndex((g) => g.id === newGame.id);
  const before = idx > 0 ? sorted.slice(0, idx) : [];
  const alertsBefore = new Set(computeAlerts(data, before).map((a) => a.id));
  const alertsAfter = computeAlerts(data, sorted);
  const newAlerts = alertsAfter.filter((a) => !alertsBefore.has(a.id)).map((a) => a.message);
  const resolvedAlerts = [...alertsBefore]
    .filter((id) => !alertsAfter.some((a) => a.id === id))
    .map((id) => id); // juste l'id : le message avant n'est plus recalculable après coup

  return {
    items,
    newAlerts,
    resolvedCount: resolvedAlerts.length,
    hasSignal: items.length > 0 || newAlerts.length > 0 || resolvedAlerts.length > 0,
  };
}
