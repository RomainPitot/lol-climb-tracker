import { useEffect, useState } from "react";
import { X, Bot, Check, AlertTriangle } from "lucide-react";
import { buildGameSection } from "../lib/autoCoach.js";
import { buildFollowThroughReport } from "../lib/gameFollowThrough.js";
import { representativeGames } from "../lib/gameModel.js";

/**
 * Détection de fin de game (voir useGameDetectorAlerts.js pour le toast immédiat "partie
 * terminée") + récap automatique dès que cette game apparaît dans le tracker (import Riot,
 * généralement 1-2 min après la fin réelle — Riot ne publie pas les stats plus vite).
 * `settings.lastSeenGameId` mémorise la dernière game déjà montrée, même logique que
 * RankUpCelebration : silencieux au premier chargement, jamais répété pour la même game.
 * PAS une vraie IA — même moteur mécanique que le Coach automatique du Dashboard (voir
 * lib/autoCoach.js), avec en plus "as-tu suivi tes conseils" sur cette game précise.
 */
export default function NewGameRecapModal({ data, sorted, currentRank, setSettings }) {
  const [recapGame, setRecapGame] = useState(null);

  useEffect(() => {
    const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);
    const last = repSorted[repSorted.length - 1];
    if (!last) return;

    const lastSeen = data.settings.lastSeenGameId;
    if (!lastSeen) {
      setSettings({ lastSeenGameId: last.id });
      return;
    }
    if (last.id !== lastSeen) {
      setRecapGame(last);
      setSettings({ lastSeenGameId: last.id });
    }
    // Ne réagit qu'à l'apparition d'une game différente, pas à chaque re-render (autre
    // réglage modifié en parallèle) — même garde que RankUpCelebration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, data.settings.lastSeenGameId, data.settings.includeExcludedGames]);

  useEffect(() => {
    if (!recapGame) return;
    const onKey = (e) => {
      if (e.key === "Escape") setRecapGame(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recapGame]);

  if (!recapGame) return null;

  const gameSection = buildGameSection(recapGame, currentRank);
  const followThrough = buildFollowThroughReport(data, sorted, recapGame);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Récap automatique de la dernière game"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setRecapGame(null);
      }}
      className="fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 150,
      }}
    >
      <div style={{ width: "100%", maxWidth: 520, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--display)", fontWeight: 700, fontSize: 17, color: "var(--text)" }}>
            <Bot size={16} color="var(--gold)" /> Game terminée — récap
          </div>
          <button
            onClick={() => setRecapGame(null)}
            aria-label="Fermer"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 7, cursor: "pointer", color: "var(--dim)" }}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {gameSection.lines.map((line, i) => (
            <div key={i} style={{ fontSize: 13, color: i === 0 ? "var(--text)" : "var(--dim)", fontWeight: i === 0 ? 600 : 400, lineHeight: 1.5 }}>
              {line}
            </div>
          ))}
        </div>

        {followThrough.hasSignal && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              As-tu suivi tes conseils ?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {followThrough.items.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12.5, color: "var(--text)", lineHeight: 1.5 }}>
                  {it.ok ? <Check size={13} color="var(--win)" style={{ marginTop: 2, flexShrink: 0 }} /> : <X size={13} color="var(--loss)" style={{ marginTop: 2, flexShrink: 0 }} />}
                  {it.message}
                </div>
              ))}
              {followThrough.newAlerts.map((msg, i) => (
                <div key={`new-${i}`} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12.5, color: "var(--loss)", lineHeight: 1.5 }}>
                  <AlertTriangle size={13} style={{ marginTop: 2, flexShrink: 0 }} />
                  Nouvelle alerte à cause de cette game : {msg}
                </div>
              ))}
              {followThrough.resolvedCount > 0 && (
                <div style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12.5, color: "var(--win)", lineHeight: 1.5 }}>
                  <Check size={13} style={{ marginTop: 2, flexShrink: 0 }} />
                  {followThrough.resolvedCount} alerte(s) résolue(s) grâce à cette game.
                </div>
              )}
            </div>
          </div>
        )}

        <p style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 16, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          Récap mécanique, pas une vraie IA — le détail complet reste sur le Dashboard et Coach IA.
        </p>
      </div>
    </div>
  );
}
