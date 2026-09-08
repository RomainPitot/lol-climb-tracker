import { useEffect, useState } from "react";
import { ALL_TIERS, TIER_COLORS } from "../constants/ranks.js";
import RankEmblem from "./RankEmblem.jsx";

/**
 * Animation plein écran quand le palier (pas la division — voir plus bas) vient de monter
 * par rapport à la dernière fois où l'app a tourné — typique après une session jouée avec
 * l'auto-import actif, ou après avoir importé un lot de games : on revient sur l'app et le
 * rang a déjà changé sans qu'on l'ait vu passer, contrairement à l'écran de promotion du
 * client LoL, vu au moment même. Se déclenche sur le PALIER (Fer, Bronze... Diamant, Maître,
 * Grand Maître, Challenger), pas sur chaque division — l'évènement marquant façon client LoL.
 *
 * `settings.lastSeenTier` mémorise le dernier palier déjà fêté, pour ne jamais répéter la
 * même animation. Absent (première fois que ce code tourne, données déjà existantes) : on
 * l'initialise silencieusement sur le palier actuel plutôt que de fêter un rang atteint
 * depuis longtemps.
 */
export default function RankUpCelebration({ currentRank, settings, setSettings }) {
  const [celebrating, setCelebrating] = useState(null);

  useEffect(() => {
    const tier = currentRank?.tier;
    if (!tier) return;
    const tierIdx = ALL_TIERS.indexOf(tier);
    if (tierIdx < 0) return;

    const lastSeen = settings.lastSeenTier;
    if (!lastSeen) {
      setSettings({ lastSeenTier: tier });
      return;
    }

    const lastSeenIdx = ALL_TIERS.indexOf(lastSeen);
    if (tierIdx > lastSeenIdx) {
      setCelebrating(tier);
      setSettings({ lastSeenTier: tier });
    }
    // Ne réagit qu'à un vrai changement de palier (courant ou déjà fêté) — pas à chaque
    // nouvelle référence de `settings` recréée par ailleurs (autre réglage modifié).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRank?.tier, settings.lastSeenTier]);

  // Échap ferme l'animation, comme les autres fenêtres modales de l'app (EditGameModal).
  useEffect(() => {
    if (!celebrating) return;
    const onKey = (e) => {
      if (e.key === "Escape") setCelebrating(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [celebrating]);

  if (!celebrating) return null;
  const c = TIER_COLORS[celebrating] || "var(--gold)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Nouveau rang : ${celebrating}`}
      onClick={() => setCelebrating(null)}
      className="rankup-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: `radial-gradient(circle at 50% 42%, ${c}26, rgba(5,5,10,0.97) 65%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <div style={{ textAlign: "center", padding: 20 }}>
        <div
          style={{
            fontSize: 13,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: c,
            fontWeight: 700,
            marginBottom: 22,
          }}
        >
          Nouveau rang atteint
        </div>

        <div className="rankup-emblem" style={{ margin: "0 auto 24px", width: 180, height: 180 }}>
          <RankEmblem tier={celebrating} size={180} />
        </div>

        <div
          style={{
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: 46,
            color: "var(--text)",
            letterSpacing: 0.5,
          }}
        >
          {celebrating}
        </div>

        <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 20 }}>Clique n'importe où pour continuer</div>
      </div>
    </div>
  );
}
