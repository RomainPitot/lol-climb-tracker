/**
 * Notification navigateur + vibration pour les alertes de jeu (voir useGameDetectorAlerts) —
 * best-effort : aucune des deux n'est garantie (permission refusée, pas de vibration sur
 * desktop, onglet pas au premier plan sur certains navigateurs...), donc toujours doublé
 * d'une bannière in-app (voir AlertBanner) qui elle ne dépend d'aucune permission.
 */
export function notifyGameEvent(message) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("CLIMB.EUW", { body: message, tag: "gamedetector" });
    }
  } catch {
    // Silencieux — la bannière in-app reste le canal fiable.
  }
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    // Idem.
  }
}

/** true si on peut encore demander la permission (jamais demandé ou refusé et pas bloqué). */
export function canRequestNotifPermission() {
  return typeof Notification !== "undefined" && Notification.permission !== "granted";
}

export function requestNotifPermission() {
  if (typeof Notification === "undefined") return Promise.resolve("unsupported");
  return Notification.requestPermission();
}
