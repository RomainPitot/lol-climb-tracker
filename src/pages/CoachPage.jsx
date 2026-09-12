import { useState, useMemo } from "react";
import { Sparkles, Copy, Check, ClipboardCheck, Map } from "lucide-react";
import { Card, Pill, StatCard, SectionTitle, Btn, Trend, Eyebrow, ToggleChip, Collapsible, Tabs } from "../components/ui/primitives.jsx";
import AiBilanCard from "../components/AiBilanCard.jsx";
import CorrectionsPanel from "../components/coach/CorrectionsPanel.jsx";
import MapHeatmap from "../components/coach/MapHeatmap.jsx";
import { computeAgg } from "../lib/stats.js";
import { buildCoachRecap, MIN_COMPARISON_GAMES } from "../lib/coachRecap.js";
import { round1, round2 } from "../lib/format.js";

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
  const [tab, setTab] = useState("bilans");

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

  const activeCorrectionCount = (data.corrections || []).filter((c) => c.status === "in_progress").length;

  return (
    <div className="page-enter">
      <SectionTitle sub="Trois outils : générer un bilan à coller dans une IA, suivre tes correctifs, ou fouiller tes games.">
        Coach IA
      </SectionTitle>

      {/* Six outils distincts s'empilaient verticalement sur une seule page : il
          fallait scroller devant tout pour en atteindre un. Regroupés par intention. */}
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "bilans", label: "Bilans", icon: Sparkles },
          { id: "correctifs", label: "Correctifs", icon: ClipboardCheck, badge: activeCorrectionCount || null },
          { id: "analyse", label: "Analyse", icon: Map },
        ]}
      />

      {tab === "bilans" && (
      <div className="reveal">
      <AiBilanCard data={data} sorted={sorted} currentRank={currentRank} />
      </div>
      )}

      {tab === "correctifs" && (
        <div className="reveal">
          <CorrectionsPanel
            data={data}
            sorted={sorted}
            addCorrection={addCorrection}
            updateCorrection={updateCorrection}
            deleteCorrection={deleteCorrection}
          />
        </div>
      )}

      {tab === "analyse" && (
      <div className="reveal">
      <MapHeatmap data={data} sorted={sorted} />

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
      )}
    </div>
  );
}
