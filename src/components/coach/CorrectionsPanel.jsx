import { useState } from "react";
import { Plus, Play, Trash2, AlertTriangle } from "lucide-react";
import { Card, Eyebrow, Field, Input, Select, TextArea, Btn, Pill, IconBtn } from "../ui/primitives.jsx";
import {
  CORRECTION_METRICS,
  CORRECTION_STATUS_LABEL,
  VALIDATION_WINDOW,
  newCorrection,
  startCorrection,
  evaluateCorrection,
} from "../../lib/corrections.js";

const STATUS_TONE = { todo: "gold", in_progress: "gold", corrected: "win", regression: "loss" };
// Régression et en cours d'abord — c'est ce qui demande une action, pas les deux états stables.
const STATUS_ORDER = { regression: 0, in_progress: 1, todo: 2, corrected: 3 };

function emptyForm() {
  return { title: "", cause: "", action: "", metricId: CORRECTION_METRICS[0].id, targetValue: "" };
}

/**
 * Correctifs (problème → objectif → suivi → régression) — voir lib/corrections.js. La
 * cible chiffrée est optionnelle : sans elle, c'est un suivi de tendance pur (l'ancien
 * "Point de focus", affiché en avant sur le Dashboard — voir primaryActiveCorrection) ;
 * avec elle, "corrigé"/"régression" deviennent calculables. On peut en avoir plusieurs en
 * même temps ; "corrigé" et "régression" ne se cochent jamais à la main, ils se calculent
 * depuis les games réellement jouées.
 */
export default function CorrectionsPanel({ data, sorted, addCorrection, updateCorrection, deleteCorrection }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const corrections = data.corrections || [];
  const evaluated = corrections
    .map((c) => evaluateCorrection(c, sorted, data.settings))
    .sort((a, b) => STATUS_ORDER[a.derivedStatus] - STATUS_ORDER[b.derivedStatus]);

  // Toujours partir de l'enregistrement brut (pas la version évaluée, qui porte des champs
  // dérivés comme currentValue/def) pour ne jamais persister autre chose que ce qu'on stocke.
  const handleStart = (id) => {
    const raw = corrections.find((c) => c.id === id);
    if (raw) updateCorrection(id, startCorrection(raw, sorted));
  };

  const submit = () => {
    if (!form.title.trim()) return;
    addCorrection(
      newCorrection({
        title: form.title.trim(),
        cause: form.cause.trim(),
        action: form.action.trim(),
        metricId: form.metricId,
        targetValue: form.targetValue,
        sorted,
        settings: data.settings,
      })
    );
    setForm(emptyForm());
    setShowForm(false);
  };

  return (
    <Card className="p-5 mb-5">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Eyebrow>Correctifs</Eyebrow>
        <Btn onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} /> {showForm ? "Annuler" : "Nouveau correctif"}
        </Btn>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--dim)", marginBottom: 14 }}>
        Un problème identifié, une cible chiffrée, et un suivi honnête : "corrigé" ne veut rien dire tant que ce n'est
        pas tenu sur {VALIDATION_WINDOW} games — et redevient "régression" si ça retombe après coup.
      </p>

      {showForm && (
        <div className="fade-in" style={{ marginBottom: 18, padding: 12, borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 10 }}>
            <Field label="Problème">
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: overextend sans vision" />
            </Field>
            <Field label="Métrique">
              <Select value={form.metricId} onChange={(e) => set("metricId", e.target.value)}>
                {CORRECTION_METRICS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Cible (optionnel)">
              <Input type="number" step="0.1" value={form.targetValue} onChange={(e) => set("targetValue", e.target.value)} placeholder="Laisse vide pour juste suivre la tendance" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 10 }}>
            <Field label="Cause (optionnel)">
              <TextArea rows={2} value={form.cause} onChange={(e) => set("cause", e.target.value)} placeholder="Ex: je push sans info jungle" />
            </Field>
            <Field label="Action demandée (optionnel)">
              <TextArea rows={2} value={form.action} onChange={(e) => set("action", e.target.value)} placeholder="Ex: ne pas prendre la wave sans ward river" />
            </Field>
          </div>
          <Btn variant="primary" onClick={submit} disabled={!form.title.trim()}>
            Créer le correctif
          </Btn>
        </div>
      )}

      {evaluated.length === 0 && !showForm && (
        <p style={{ fontSize: 12.5, color: "var(--dim)" }}>Aucun correctif pour l'instant.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {evaluated.map((c) => (
          <div
            key={c.id}
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-elevated)",
              border: `1px solid ${c.derivedStatus === "regression" ? "var(--loss)" : "var(--border)"}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  {c.derivedStatus === "regression" && <AlertTriangle size={13} color="var(--loss)" />}
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{c.title}</span>
                  <Pill tone={STATUS_TONE[c.derivedStatus]}>{CORRECTION_STATUS_LABEL[c.derivedStatus]}</Pill>
                </div>
                <div className="tnum" style={{ fontSize: 11.5, color: "var(--dim)" }}>
                  {c.def?.label}
                  {c.targetValue != null && ` — cible ${c.def?.invert ? "≤" : "≥"} ${c.targetValue}`}
                  {c.currentValue != null &&
                    ` · actuel ${c.currentValue.toFixed(c.def.decimals)} (${c.gamesCount} game${c.gamesCount > 1 ? "s" : ""}${c.targetValue != null && !c.windowFull ? ", fenêtre pas encore pleine" : ""})`}
                  {c.currentValue == null && c.status !== "todo" && " · pas encore de game depuis le départ"}
                </div>
                {c.cause && <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4 }}>Cause : {c.cause}</p>}
                {c.action && <p style={{ fontSize: 11.5, color: "var(--text)", marginTop: 2 }}>Action : {c.action}</p>}
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {c.status === "todo" && (
                  <Btn onClick={() => handleStart(c.id)}>
                    <Play size={13} /> Commencer
                  </Btn>
                )}
                <IconBtn onClick={() => deleteCorrection(c.id)} aria-label="Supprimer le correctif">
                  <Trash2 size={14} />
                </IconBtn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
