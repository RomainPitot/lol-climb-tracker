import { useState } from "react";
import { Bot, ChevronDown, Coffee, Microscope, Target } from "lucide-react";
import { Card, Eyebrow, Pill } from "../ui/primitives.jsx";
import { buildCoachBriefing } from "../../lib/coachBriefing.js";

/**
 * Briefing unique du haut de Dashboard — remplace cinq cartes empilées (coach automatique,
 * alertes, priorités, série négative, morts non classées) par une seule, hiérarchisée :
 * la dernière game en une ligne, puis au maximum trois choses à corriger, le reste replié.
 * Objectif de lisibilité : comprendre quoi corriger en quelques secondes plutôt que lire
 * quatre encadrés qui se répètent. Toujours mécanique, jamais une vraie IA (voir la note).
 */
export default function CoachBriefing({ data, sorted, currentRank, onSelectGame }) {
  const [openDetail, setOpenDetail] = useState(false);
  const briefing = buildCoachBriefing(data, sorted, currentRank);
  if (!briefing) return null;

  const { lastGame, toFix, strengths, focus, streak, untaggedGames, sampleSize } = briefing;
  const hasSecondary = strengths.length > 0 || streak || untaggedGames.length > 0 || focus;

  return (
    <Card className="p-5 mb-6">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <Eyebrow style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
          <Bot size={13} /> Coach
        </Eyebrow>
        {focus && (
          <Pill tone="gold" title={focus.note}>
            Focus : {focus.label} · {focus.gamesCount}g
          </Pill>
        )}
      </div>

      {/* Dernière game : le titre porte l'essentiel, le détail reste en gris dessous. */}
      <div style={{ marginBottom: toFix.length ? 18 : 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
          {lastGame.lines[0]}
        </div>
        {lastGame.lines.slice(1).map((line, i) => (
          <div key={i} style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.5 }}>
            {line}
          </div>
        ))}
      </div>

      {toFix.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--loss)", fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <Target size={12} /> À corriger — {sampleSize} dernières games
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {toFix.map((item, i) => (
              <li key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: item.tone === "loss" ? "rgba(255,92,92,0.14)" : "rgba(212,175,55,0.14)",
                    color: item.tone === "loss" ? "var(--loss)" : "var(--gold)",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.55 }}>{item.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {hasSecondary && (
        <>
          <button
            onClick={() => setOpenDetail((o) => !o)}
            aria-expanded={openDetail}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              padding: 0,
              marginTop: 16,
              cursor: "pointer",
              color: "var(--dim)",
              fontSize: 12,
            }}
          >
            {openDetail ? "Masquer le reste" : "Voir le reste"}
            <ChevronDown size={14} style={{ transform: openDetail ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          </button>

          {openDetail && (
            <div className="fade-in" style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {streak && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "var(--text)" }}>
                  <Coffee size={13} color="var(--gold)" style={{ marginTop: 2, flexShrink: 0 }} />
                  {streak.message}
                </div>
              )}

              {untaggedGames.length > 0 && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12.5, color: "var(--text)" }}>
                  <Microscope size={13} color="var(--gold)" style={{ flexShrink: 0 }} />
                  {untaggedGames.length} game{untaggedGames.length > 1 ? "s" : ""} avec des morts non classées :
                  {untaggedGames.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => onSelectGame?.(g.id)}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      aria-label={`Ouvrir l'analyse de la game du ${g.date}`}
                    >
                      <Pill tone="gold">{g.date}</Pill>
                    </button>
                  ))}
                </div>
              )}

              {strengths.length > 0 && (
                <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.6 }}>
                  Pas ton problème actuel : {strengths.map((s) => s.text).join(" ")}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <p style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 16, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        Synthèse automatique à partir de tes stats et des repères de ton rang — pas une vraie IA. Pour un avis
        rédigé, utilise "Bilan de compte" dans Coach IA.
      </p>
    </Card>
  );
}
