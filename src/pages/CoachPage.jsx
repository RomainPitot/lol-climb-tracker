import { useState, useMemo } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { Card, Pill, StatCard, SectionTitle, Btn, Trend, Eyebrow, ToggleChip, Collapsible } from "../components/ui/primitives.jsx";
import AiCoachPanel from "../components/AiCoachPanel.jsx";
import GameRecapCard from "../components/GameRecapCard.jsx";
import CorrectionsPanel from "../components/coach/CorrectionsPanel.jsx";
import { computeAgg } from "../lib/stats.js";
import { buildCoachRecap, MIN_COMPARISON_GAMES } from "../lib/coachRecap.js";
import { representativeGames } from "../lib/gameModel.js";
import { computeFocus } from "../lib/focus.js";
import { evaluateCorrection, CORRECTION_STATUS_LABEL } from "../lib/corrections.js";
import { rankLabel } from "../lib/rank.js";
import { round1, round2 } from "../lib/format.js";

const ACCOUNT_ANALYSIS_WINDOW = 20;

const PRESETS = [
  { label: "Dernière game", take: 1 },
  { label: "3 dernières", take: 3 },
  { label: "5 dernières", take: 5 },
  { label: "10 dernières", take: 10 },
  { label: "20 dernières", take: 20 },
  { label: "50 dernières", take: 50 },
  { label: "Tout le profil", take: Infinity },
  { label: "Aucune", take: 0 },
];

export default function CoachPage({ data, sorted, currentRank, addCorrection, updateCorrection, deleteCorrection }) {
  const [selected, setSelected] = useState(() => new Set(sorted.slice(-20).map((g) => g.id)));
  const [recap, setRecap] = useState("");
  const [copied, setCopied] = useState(false);

  /** Le bilan de compte compare toujours les N dernières games au reste du profil —
   * indépendant de la sélection manuelle ci-dessous, qui sert au recap à coller/copier.
   * Games marquées non représentatives (remake, int, smurf adverse) écartées des deux
   * côtés de la comparaison par défaut — voir Paramètres > Statistiques. */
  const buildAccountPrompt = () => {
    const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);
    const recentIds = new Set(repSorted.slice(-ACCOUNT_ANALYSIS_WINDOW).map((g) => g.id));
    const base = buildCoachRecap({ data, sorted: repSorted, selectedIds: recentIds }).split("=== QUESTION AU COACH IA ===")[0];

    const focus = computeFocus(sorted, data.settings);
    const focusBlock = focus
      ? `\n=== FOCUS EN COURS ===\nJe travaille sur ${focus.label} depuis ${focus.gamesCount} game(s) (valeur de départ : ${focus.startValue.toFixed(focus.decimals)}, valeur actuelle : ${focus.currentValue.toFixed(focus.decimals)}).${focus.note ? ` Note : ${focus.note}.` : ""}\n`
      : "";

    const activeCorrections = (data.corrections || [])
      .map((c) => evaluateCorrection(c, sorted, data.settings))
      .filter((c) => c.status !== "todo");
    const correctionsBlock = activeCorrections.length
      ? `\n=== CORRECTIFS SUIVIS ===\n${activeCorrections
          .map(
            (c) =>
              `- ${c.title} (${c.def?.label}, cible ${c.def?.invert ? "≤" : "≥"} ${c.targetValue}) : ${CORRECTION_STATUS_LABEL[c.derivedStatus]}${c.currentValue != null ? ` — actuel ${c.currentValue.toFixed(c.def.decimals)} sur ${c.gamesCount} game(s)` : ""}${c.derivedStatus === "regression" ? " — ATTENTION, retombé après avoir été corrigé" : ""}`
          )
          .join("\n")}\n`
      : "";

    const demande = focus
      ? `Commente en priorité ma progression sur ce focus précis (${focus.label}) — est-ce que ça s'améliore vraiment, qu'est-ce qui coince encore, faut-il continuer dessus ou en changer. Complète avec 2 points forts et 1 autre point faible si pertinent, mais le focus passe avant.`
      : `Fais un bilan complet de mon compte, pas juste de la sélection ci-dessus : 3 points forts, les 3 points faibles qui me coûtent le plus de LP en ce moment (par ordre de priorité), et une seule action concrète à appliquer dès ma prochaine game.`;
    const correctionsNote = activeCorrections.some((c) => c.derivedStatus === "regression")
      ? " Signale en premier toute régression listée ci-dessus — c'est plus urgent qu'un nouveau point faible."
      : "";

    return `${base}${focusBlock}${correctionsBlock}\n=== DEMANDE ===\n${demande}${correctionsNote} Rang actuel : ${rankLabel(currentRank.tier, currentRank.div)} — objectif : progresser le plus vite possible.`;
  };

  const selectedGames = useMemo(() => sorted.filter((g) => selected.has(g.id)), [sorted, selected]);
  const restGames = useMemo(() => sorted.filter((g) => !selected.has(g.id)), [sorted, selected]);

  const selAgg = computeAgg(selectedGames);
  const restAgg = computeAgg(restGames);
  const enoughRest = restGames.length >= MIN_COMPARISON_GAMES;

  const yoneShare = selectedGames.length
    ? (selectedGames.filter((g) => g.champion === "Yone").length / selectedGames.length) * 100
    : 0;

  const applyPreset = (take) => {
    const slice = take === 0 ? [] : take === Infinity ? sorted : sorted.slice(-take);
    setSelected(new Set(slice.map((g) => g.id)));
  };

  const toggleGame = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(recap);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard refusé (contexte non sécurisé / permission) : le texte reste sélectionnable
    }
  };

  return (
    <div>
      <SectionTitle sub="Sélectionne les games à inclure dans le recap, puis génère un récapitulatif structuré pour une IA coach.">
        Coach IA
      </SectionTitle>

      <GameRecapCard data={data} sorted={sorted} />

      <CorrectionsPanel
        data={data}
        sorted={sorted}
        addCorrection={addCorrection}
        updateCorrection={updateCorrection}
        deleteCorrection={deleteCorrection}
      />

      <Card className="p-5 mb-5">
        <Eyebrow style={{ marginBottom: 6 }}>Bilan de compte</Eyebrow>
        <p style={{ fontSize: 12.5, color: "var(--dim)", marginBottom: 14 }}>
          Génère un prompt façon coach coréen — direct, sans complaisance — sur tes {ACCOUNT_ANALYSIS_WINDOW} dernières
          games vs le reste de ton profil : 3 points forts, 3 points faibles priorisés, une action concrète. Colle-le
          ensuite dans Claude, ChatGPT ou l'IA de ton choix.
        </p>
        <AiCoachPanel
          buildPrompt={buildAccountPrompt}
          buttonLabel="Générer mon bilan de compte"
          resultTitle="Prompt du bilan de compte"
          disabled={sorted.length < 3}
          disabledReason="Ajoute au moins 3 games trackées pour un bilan qui a du sens."
        />
      </Card>

      <Collapsible title="Raccourcis de sélection" sub={`${selectedGames.length} game(s) sélectionnée(s)`}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {PRESETS.map((p) => (
            <ToggleChip key={p.label} onClick={() => applyPreset(p.take)}>
              {p.label}
            </ToggleChip>
          ))}
        </div>

        <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
          {[...sorted].reverse().map((g) => (
            <label
              key={g.id}
              className={selected.has(g.id) ? "" : "row-hover"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 10px",
                fontSize: 12.5,
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                color: "var(--text)",
                background: selected.has(g.id) ? "rgba(212,175,55,0.08)" : "transparent",
              }}
            >
              <input type="checkbox" checked={selected.has(g.id)} onChange={() => toggleGame(g.id)} />
              <span style={{ color: "var(--dim)", minWidth: 90 }}>{g.date}</span>
              <span style={{ fontWeight: 600, minWidth: 90 }}>{g.champion}</span>
              <Pill tone={g.win ? "win" : "loss"}>{g.win ? "V" : "D"}</Pill>
              {g.excluded && (
                <Pill tone="loss" title={g.excludedReason || "Marquée non représentative"}>
                  Exclue
                </Pill>
              )}
              <span style={{ color: "var(--dim)" }}>{g.kills}/{g.deaths}/{g.assists}</span>
              <span className="tnum" style={{ color: g.lpChange >= 0 ? "var(--win)" : "var(--loss)", marginLeft: "auto", fontWeight: 600 }}>
                {g.lpChange >= 0 ? "+" : ""}
                {g.lpChange} LP
              </span>
            </label>
          ))}
          {sorted.length === 0 && (
            <div style={{ padding: 16, textAlign: "center", color: "var(--dim)", fontSize: 13 }}>
              Aucune game trackée pour l'instant.
            </div>
          )}
        </div>
      </Collapsible>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="Winrate (sélection)"
          value={`${round1(selAgg.wr)}%`}
          sub={enoughRest ? <Trend value={selAgg.wr - restAgg.wr} suffix=" pts" /> : "reste du profil insuffisant"}
        />
        <StatCard
          label="CS/min"
          value={round1(selAgg.csmin)}
          sub={enoughRest ? <Trend value={selAgg.csmin - restAgg.csmin} /> : "—"}
        />
        <StatCard
          label="Deaths/game"
          value={round1(selAgg.deaths)}
          sub={enoughRest ? <Trend value={selAgg.deaths - restAgg.deaths} invert /> : "—"}
        />
        <StatCard
          label="KDA"
          value={round2(selAgg.kda)}
          sub={enoughRest ? <Trend value={selAgg.kda - restAgg.kda} decimals={2} /> : "—"}
        />
        <StatCard label="Part Yone" value={`${round1(yoneShare)}%`} />
      </div>

      <Btn
        variant="primary"
        onClick={() => setRecap(buildCoachRecap({ data, sorted, selectedIds: selected }))}
        style={{ marginBottom: 14 }}
        disabled={!selectedGames.length}
      >
        <Sparkles size={14} /> Générer mon recap IA
      </Btn>

      {recap && (
        <Card className="p-4 fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Eyebrow color="var(--gold)">Recap généré</Eyebrow>
            <Btn onClick={copy}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copié" : "Copier"}
            </Btn>
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "var(--body)",
              fontSize: 12.5,
              color: "var(--text)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {recap}
          </pre>
        </Card>
      )}
    </div>
  );
}
