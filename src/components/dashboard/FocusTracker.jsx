import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Target, X } from "lucide-react";
import { Card, Eyebrow, Btn, IconBtn, Field, Select, Input, Pill } from "../ui/primitives.jsx";
import {
  CORRECTION_METRICS,
  CORRECTION_STATUS_LABEL,
  newCorrection,
  startCorrection,
  correctionSeries,
  primaryActiveCorrection,
} from "../../lib/corrections.js";

const TOOLTIP_STYLE = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: "var(--fs-sm)",
  color: "var(--text)",
};

const STATUS_TONE = { in_progress: "gold", corrected: "win", regression: "loss" };

/**
 * Point de focus persistant — la vue "une seule chose à la fois" du Dashboard, mise en
 * avant parmi les correctifs actifs (voir lib/corrections.js primaryActiveCorrection).
 * Ancien système séparé (settings.focusMetric) fusionné avec les Correctifs : ce widget
 * crée maintenant un vrai correctif (sans cible chiffrée par défaut — juste "Cible" en
 * option, pour qui veut un objectif précis dès le départ) au lieu d'écrire dans settings —
 * un seul système, visible ici ET dans Coach IA > Correctifs.
 */
export default function FocusTracker({ data, sorted, addCorrection, deleteCorrection }) {
  const active = primaryActiveCorrection(data, sorted);
  const [metricId, setMetricId] = useState(CORRECTION_METRICS[0].id);
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("");

  if (!active) {
    return (
      <Card className="p-5 mb-6">
        <Eyebrow style={{ marginBottom: 6 }}>Point de focus</Eyebrow>
        <p style={{ fontSize: 12.5, color: "var(--dim)", marginBottom: 14 }}>
          Choisis une seule chose à corriger et travaille-la sur 10-15 games jusqu'à ce que ce soit automatique,
          plutôt que de courir après plusieurs points à la fois.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
          <Field label="Métrique à travailler">
            <Select value={metricId} onChange={(e) => setMetricId(e.target.value)} style={{ minWidth: 160 }}>
              {CORRECTION_METRICS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Cible (optionnel)">
            <Input
              type="number"
              step="0.1"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Laisse vide pour juste suivre"
              style={{ minWidth: 140 }}
            />
          </Field>
          <Field label="Note (optionnel)">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ex: moins de morts évitables en early"
              style={{ minWidth: 220 }}
            />
          </Field>
          <Btn
            variant="primary"
            onClick={() => {
              const def = CORRECTION_METRICS.find((m) => m.id === metricId);
              addCorrection(
                startCorrection(
                  newCorrection({ title: `${def.label} — focus`, cause: note, action: "", metricId, targetValue: target, sorted, settings: data.settings }),
                  sorted
                )
              );
            }}
          >
            <Target size={14} /> Démarrer ce focus
          </Btn>
        </div>
      </Card>
    );
  }

  const def = active.def;
  const series = correctionSeries(active, sorted, data.settings);
  const hasTarget = active.targetValue != null;
  const improving = def.invert ? active.currentValue <= active.initialValue : active.currentValue >= active.initialValue;
  const flat = active.currentValue == null || Math.abs(active.currentValue - active.initialValue) < 0.05;
  const deltaColor = flat ? "var(--dim)" : improving ? "var(--win)" : "var(--loss)";
  const fmt = (v) => (v ?? 0).toFixed(def.decimals);

  return (
    <Card className="p-5 mb-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Eyebrow color="var(--gold)" style={{ marginBottom: 0 }}>Point de focus — {def.label}</Eyebrow>
            {hasTarget && <Pill tone={STATUS_TONE[active.derivedStatus]}>{CORRECTION_STATUS_LABEL[active.derivedStatus]}</Pill>}
          </div>
          {active.cause && <p style={{ fontSize: "var(--fs-sm)", color: "var(--dim)" }}>{active.cause}</p>}
        </div>
        <IconBtn onClick={() => deleteCorrection(active.id)} aria-label="Terminer ce focus" title="Terminer ce focus">
          <X size={14} />
        </IconBtn>
      </div>

      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--dim)" }}>Départ</div>
          <div className="tnum" style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, color: "var(--text)" }}>
            {fmt(active.initialValue)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--dim)" }}>Actuel ({active.gamesCount} game{active.gamesCount > 1 ? "s" : ""})</div>
          <div className="tnum" style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, color: "var(--text)" }}>
            {fmt(active.currentValue)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--dim)" }}>Évolution</div>
          <div className="tnum" style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, color: deltaColor }}>
            {active.currentValue != null && active.currentValue - active.initialValue >= 0 ? "+" : ""}
            {active.currentValue != null ? fmt(active.currentValue - active.initialValue) : "—"}
          </div>
        </div>
        {hasTarget && (
          <div>
            <div style={{ fontSize: 11, color: "var(--dim)" }}>Cible</div>
            <div className="tnum" style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, color: "var(--gold)" }}>
              {def.invert ? "≤" : "≥"} {active.targetValue}
            </div>
          </div>
        )}
      </div>

      {series.length > 1 ? (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={series}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="i" stroke="var(--dim)" fontSize={10} tickLine={false} />
            <YAxis stroke="var(--dim)" fontSize={10} tickLine={false} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `Game #${v} depuis le début du focus`} />
            <Line type="monotone" dataKey="value" stroke="var(--gold)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--dim)" }}>Le graphe d'évolution apparaît après quelques games sur ce focus.</p>
      )}
    </Card>
  );
}
