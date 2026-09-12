import { useState } from "react";
import { Bot, Check, ChevronDown, Coffee, Crosshair, Microscope, Target, GraduationCap } from "lucide-react";
import { Card, Eyebrow, Pill, Btn } from "../ui/primitives.jsx";
import { buildCoachBriefing } from "../../lib/coachBriefing.js";
import { newCorrection, startCorrection } from "../../lib/corrections.js";

/**
 * Briefing unique du haut de Dashboard — remplace cinq cartes empilées (coach automatique,
 * alertes, priorités, série négative, morts non classées) par une seule, hiérarchisée :
 * la dernière game en une ligne, puis au maximum trois choses à corriger, le reste replié.
 * Objectif de lisibilité : comprendre quoi corriger en quelques secondes plutôt que lire
 * quatre encadrés qui se répètent. Toujours mécanique, jamais une vraie IA (voir la note).
 */
export default function CoachBriefing({ data, sorted, currentRank, onSelectGame, addCorrection, openLearnArticle }) {
  const [openDetail, setOpenDetail] = useState(false);
  const [justTracked, setJustTracked] = useState(() => new Set());
  const briefing = buildCoachBriefing(data, sorted, currentRank);
  if (!briefing) return null;

  // Un point déjà suivi (correctif en cours sur la même métrique, créé avant ou pendant
  // cette session) n'affiche plus le bouton — jamais deux correctifs sur la même métrique.
  const trackedMetrics = new Set(
    (data.corrections || []).filter((c) => c.status === "in_progress").map((c) => c.metric)
  );

  const trackPoint = (item) => {
    const t = item.trackable;
    if (!t?.metricId || !addCorrection) return;
    const correction = startCorrection(
      newCorrection({ title: t.title, cause: t.cause, action: t.action, metricId: t.metricId, targetValue: t.targetValue, sorted, settings: data.settings }),
      sorted
    );
    addCorrection(correction);
    setJustTracked((prev) => new Set(prev).add(item.id));
  };

  const { lastGame, personalSignal, toFix, strengths, focus, streak, untaggedGames, sampleSize } = briefing;
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
      <div style={{ marginBottom: toFix.length ? "var(--sp-5)" : 0 }}>
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700, color: "var(--text)", marginBottom: "var(--sp-1)", lineHeight: "var(--lh-tight)" }}>
          {lastGame.lines[0]}
        </div>
        <div className="prose" style={{ fontSize: "var(--fs-sm)", color: "var(--dim)" }}>
          {lastGame.lines.slice(1).map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>

      {/* Signal "chez toi" (victoire vs défaite) — affiché séparément et AVANT la
          comparaison au rang ci-dessous : c'est le signal le plus personnel, jamais noyé
          dans la liste générique. Reste toujours en plus, jamais à la place de "À corriger"
          (voir winLossDiff.js — une métrique mauvaise dans les deux cas n'a pas d'écart ici). */}
      {personalSignal && (
        <div
          style={{
            display: "flex",
            gap: "var(--sp-3)",
            alignItems: "flex-start",
            padding: "var(--sp-3) var(--sp-4)",
            marginBottom: "var(--sp-5)",
            borderRadius: "var(--radius-md)",
            background: "rgba(212,175,55,0.08)",
            border: "1px solid rgba(212,175,55,0.3)",
          }}
        >
          <Crosshair size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="eyebrow" style={{ color: "var(--gold)", marginBottom: 3 }}>Ton signal n°1</div>
            <span className="prose" style={{ fontSize: "var(--fs-base)", color: "var(--text)", fontWeight: 600 }}>
              {personalSignal.text}
            </span>
          </div>
        </div>
      )}

      {toFix.length > 0 && (
        <div>
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--loss)", marginBottom: "var(--sp-3)" }}>
            <Target size={12} /> À corriger — {sampleSize} dernières games
          </div>
          {/* Le n°1 (score le plus haut, voir lib/priorityScore.js) se distingue vraiment du
              reste — encadré, texte plus grand — plutôt qu'une liste plate où les trois
              points ont l'air d'égale urgence alors que le score dit rarement ça. Le reste
              n'est là qu'en complément, en plus petit, en plus discret. */}
          <ToFixItem
            item={toFix[0]}
            primary
            tracked={justTracked.has(toFix[0].id) || trackedMetrics.has(toFix[0].trackable?.metricId)}
            onTrack={() => trackPoint(toFix[0])}
            openLearnArticle={openLearnArticle}
          />
          {toFix.length > 1 && (
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--sp-2)", marginTop: "var(--sp-3)" }}>
              {toFix.slice(1).map((item, i) => (
                <ToFixItem
                  key={item.id}
                  item={item}
                  rank={i + 2}
                  tracked={justTracked.has(item.id) || trackedMetrics.has(item.trackable?.metricId)}
                  onTrack={() => trackPoint(item)}
                  openLearnArticle={openLearnArticle}
                />
              ))}
            </ol>
          )}
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
              fontSize: "var(--fs-sm)",
            }}
          >
            {openDetail ? "Masquer le reste" : "Voir le reste"}
            <ChevronDown size={14} style={{ transform: openDetail ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          </button>

          {openDetail && (
            <div className="fade-in" style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {streak && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: "var(--fs-sm)", color: "var(--text)" }}>
                  <Coffee size={13} color="var(--gold)" style={{ marginTop: 2, flexShrink: 0 }} />
                  {streak.message}
                </div>
              )}

              {untaggedGames.length > 0 && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: "var(--fs-sm)", color: "var(--text)" }}>
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
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--dim)", lineHeight: 1.6 }}>
                  Pas ton problème actuel : {strengths.map((s) => s.text).join(" ")}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <p style={{ fontSize: "var(--fs-xs)", color: "var(--dim)", marginTop: 16, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        Synthèse automatique à partir de tes stats et des repères de ton rang — pas une vraie IA. Pour un avis
        rédigé, utilise "Bilan de compte" dans Coach IA.
      </p>
    </Card>
  );
}

/** Une ligne de "À corriger" — `primary` (le n°1, score le plus haut) reçoit un encadré et
 * un texte plus grand ; les autres restent une liste compacte et discrète. Même contenu
 * (verdict + bouton "Suivre ce point"), juste un poids visuel différent selon le rang. */
function ToFixItem({ item, rank, primary, tracked, onTrack, openLearnArticle }) {
  const toneColor = item.tone === "loss" ? "var(--loss)" : "var(--gold)";
  const badgeBg = item.tone === "loss" ? "rgba(255,92,92,0.14)" : "rgba(212,175,55,0.14)";
  const learnArticle = item.learnArticle;

  const track = (item.trackable?.metricId || learnArticle) && (
    <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
      {item.trackable?.metricId && (
        tracked ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--fs-xs)", color: "var(--win)" }}>
            <Check size={12} /> Suivi comme correctif
          </span>
        ) : (
          <Btn onClick={onTrack} style={{ padding: "4px 10px", fontSize: "var(--fs-xs)" }}>
            <Crosshair size={11} /> Suivre ce point
          </Btn>
        )
      )}
      {/* Vrai lien vers le tuto Learn correspondant (voir autoCoach.js) plutôt qu'un texte
          brut "voir Learn" que le joueur devait retrouver lui-même dans la section. */}
      {learnArticle && openLearnArticle && (
        <Btn onClick={() => openLearnArticle(learnArticle.id)} style={{ padding: "4px 10px", fontSize: "var(--fs-xs)" }}>
          <GraduationCap size={11} /> {learnArticle.title}
        </Btn>
      )}
    </div>
  );

  if (primary) {
    return (
      <div
        style={{
          display: "flex",
          gap: "var(--sp-3)",
          alignItems: "flex-start",
          padding: "var(--sp-3) var(--sp-4)",
          borderRadius: "var(--radius-md)",
          background: item.tone === "loss" ? "rgba(255,92,92,0.08)" : "rgba(212,175,55,0.08)",
          border: `1px solid ${item.tone === "loss" ? "rgba(255,92,92,0.3)" : "rgba(212,175,55,0.3)"}`,
        }}
      >
        <span
          className="tnum"
          style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: badgeBg,
            color: toneColor,
            fontSize: "var(--fs-sm)",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 1,
          }}
        >
          1
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="prose" style={{ fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)" }}>
            {item.text}
          </span>
          {track}
        </span>
      </div>
    );
  }

  return (
    <li style={{ display: "flex", gap: "var(--sp-3)", alignItems: "flex-start" }}>
      <span
        className="tnum"
        style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: badgeBg,
          color: toneColor,
          fontSize: "10px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {rank}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="prose" style={{ fontSize: "var(--fs-sm)", color: "var(--dim)" }}>
          {item.text}
        </span>
        {track}
      </span>
    </li>
  );
}
