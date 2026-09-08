/**
 * Bannière plein écran (haut) pour les alertes de jeu (voir useGameDetectorAlerts) — le
 * canal fiable qui ne dépend d'aucune permission navigateur, contrairement à Notification
 * (voir lib/notify.js), affiché en plus, best-effort. Se ferme seule après quelques
 * secondes ou au clic.
 */
export default function AlertBanner({ alert, onDismiss }) {
  if (!alert) return null;
  return (
    <div
      className="fade-in"
      onClick={onDismiss}
      style={{
        position: "fixed",
        top: 14,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 18px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--gold)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        cursor: "pointer",
        maxWidth: "90vw",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{alert.message}</span>
    </div>
  );
}
