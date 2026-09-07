import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Target, X } from "lucide-react";
import { Card, Eyebrow, Btn, IconBtn, Field, Select, Input } from "../ui/primitives.jsx";
import { FOCUS_METRICS, computeFocus, buildFocusStart, clearFocus } from "../../lib/focus.js";

const TOOLTIP_STYLE = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text)",
};

/**
 * Point de focus persistant — voir lib/focus.js pour le "pourquoi" (une seule chose à
 * la fois plutôt qu'une liste de points faibles qui repart de zéro à chaque bilan).
 */
export default function FocusTracker({ data, sorted, setSettings }) {
  const focus = computeFocus(sorted, data.settings);
  const [metricId, setMetricId] = useState(FOCUS_METRICS[0].id);
  const [note, setNote] = useState("");

  if (!focus) {
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
              {FOCUS_METRICS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Note (optionnel)">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ex: moins de morts évitables en early"
              style={{ minWidth: 220 }}
            />
          </Field>
          <Btn variant="primary" onClick={() => setSettings(buildFocusStart(sorted, data.settings, metricId, note))}>
            <Target size={14} /> Démarrer ce focus
          </Btn>
        </div>
      </Card>
    );
  }

  const improving = focus.invert ? focus.delta <= 0 : focus.delta >= 0;
  const flat = Math.abs(focus.delta) < 0.05;
  const deltaColor = flat ? "var(--dim)" : improving ? "var(--win)" : "var(--loss)";
  const fmt = (v) => (v ?? 0).toFixed(focus.decimals);

  return (
    <Card className="p-5 mb-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
        <div>
          <Eyebrow color="var(--gold)" style={{ marginBottom: 4 }}>Point de focus — {focus.label}</Eyebrow>
          {focus.note && <p style={{ fontSize: 12, color: "var(--dim)" }}>{focus.note}</p>}
        </div>
        <IconBtn onClick={() => setSettings(clearFocus())} aria-label="Terminer ce focus" title="Terminer ce focus">
          <X size={14} />
        </IconBtn>
      </div>

      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--dim)" }}>Départ</div>
          <div className="tnum" style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, color: "var(--text)" }}>
            {fmt(focus.startValue)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--dim)" }}>Actuel ({focus.gamesCount} game{focus.gamesCount > 1 ? "s" : ""})</div>
          <div className="tnum" style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, color: "var(--text)" }}>
            {fmt(focus.currentValue)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--dim)" }}>Évolution</div>
          <div className="tnum" style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, color: deltaColor }}>
            {focus.delta >= 0 ? "+" : ""}
            {fmt(focus.delta)}
          </div>
        </div>
      </div>

      {focus.series.length > 1 ? (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={focus.series}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="i" stroke="var(--dim)" fontSize={10} tickLine={false} />
            <YAxis stroke="var(--dim)" fontSize={10} tickLine={false} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `Game #${v} depuis le début du focus`} />
            <Line type="monotone" dataKey="value" stroke="var(--gold)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ fontSize: 12, color: "var(--dim)" }}>Le graphe d'évolution apparaît après quelques games sur ce focus.</p>
      )}
    </Card>
  );
}
