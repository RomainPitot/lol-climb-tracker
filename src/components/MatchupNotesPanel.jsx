import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Card, Eyebrow, Btn, Input, IconBtn, Pill } from "./ui/primitives.jsx";
import { matchupNoteKey, emptyMatchupNote, matchupNotesFor } from "../lib/matchupNotes.js";

const FIELDS = [
  { key: "recommendedBuild", label: "Build recommandé", placeholder: "ex: Doran's Blade → Berserker's..." },
  { key: "recommendedRunes", label: "Runes recommandées", placeholder: "ex: Conqueror / Triomphe / ..." },
  { key: "firstBack", label: "Premiers achats (recall)", placeholder: "ex: Long Sword + potions si en avance" },
  { key: "allInConditions", label: "Conditions d'all-in / trade", placeholder: "ex: seulement si son E est en cooldown" },
  { key: "dangerousTimings", label: "Timings dangereux", placeholder: "ex: niveau 2 sous tourelle, à 6 (ultime)" },
  { key: "freezePushPlan", label: "Freeze / push", placeholder: "ex: freeze jusqu'au niveau 6, puis crash" },
  { key: "levelPlan", label: "Plan par tranche de niveau (1-3 / 3-6 / post-6)", placeholder: "ex: passif, harass, all-in", textarea: true },
];

/**
 * Plan de lane par matchup (voir GDD, lib/matchupNotes.js) — 100% manuel, rien de tout ça
 * n'est dérivable de Riot. Réutilisable avant chaque nouvelle game contre le même
 * adversaire : le plan se met à jour en place plutôt que d'être ressaisi.
 */
export default function MatchupNotesPanel({ champion, data, saveMatchupNote, deleteMatchupNote }) {
  const notes = matchupNotesFor(data.matchupNotes, champion);
  const [opponentInput, setOpponentInput] = useState("");
  const [editingOpponent, setEditingOpponent] = useState(null);
  const [form, setForm] = useState(null);

  const startEdit = (opponent) => {
    const key = matchupNoteKey(champion, opponent);
    const existing = data.matchupNotes[key];
    setForm(existing || emptyMatchupNote(champion, opponent));
    setEditingOpponent(opponent);
  };

  const save = () => {
    if (!form) return;
    saveMatchupNote(matchupNoteKey(champion, editingOpponent), form);
    setEditingOpponent(null);
    setForm(null);
    setOpponentInput("");
  };

  return (
    <Card variant="flat" className="p-4 my-5">
      <Eyebrow style={{ marginBottom: 10 }}>Notes de préparation par matchup (plan de lane)</Eyebrow>

      {!editingOpponent && (
        <>
          {notes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {notes.map((n) => (
                <div
                  key={n.opponent}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                  <Pill tone="gold">{n.opponent}</Pill>
                  <span style={{ fontSize: 11, color: "var(--dim)", flex: 1 }}>
                    {[n.recommendedBuild, n.allInConditions].filter(Boolean).join(" — ") || "Plan vide"}
                  </span>
                  <IconBtn onClick={() => startEdit(n.opponent)} aria-label="Modifier">
                    <Pencil size={13} />
                  </IconBtn>
                  <IconBtn onClick={() => deleteMatchupNote(matchupNoteKey(champion, n.opponent))} aria-label="Supprimer">
                    <Trash2 size={13} />
                  </IconBtn>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              value={opponentInput}
              onChange={(e) => setOpponentInput(e.target.value)}
              placeholder="Adversaire de lane (ex: Zed)"
            />
            <Btn variant="primary" onClick={() => startEdit(opponentInput.trim())} disabled={!opponentInput.trim()}>
              <Plus size={14} /> Nouveau plan
            </Btn>
          </div>
        </>
      )}

      {editingOpponent && form && (
        <div className="fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              {champion} vs {editingOpponent}
            </span>
            <IconBtn onClick={() => { setEditingOpponent(null); setForm(null); }} aria-label="Annuler">
              <X size={14} />
            </IconBtn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 3 }}>{f.label}</div>
                <Input
                  value={form[f.key] || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>
          <Btn variant="primary" onClick={save}>Enregistrer le plan</Btn>
        </div>
      )}
    </Card>
  );
}
