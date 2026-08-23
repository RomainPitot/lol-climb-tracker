import { useState } from "react";
import { Target, Trash2 } from "lucide-react";
import { Card, Pill, Field, Input, Select, Btn, EmptyChart } from "../ui/primitives.jsx";
import { TIERS, APEX, DIVS } from "../../constants/ranks.js";
import { GOAL_TYPES } from "../../constants/game.js";
import { ROSTER } from "../../constants/roster.js";
import { computeGoalProgress } from "../../lib/goals.js";

const NEEDS_CHAMPION = ["wr_champion", "games_without_champion", "games_champion"];
const NEEDS_COUNT = ["games_without_champion", "games_champion"];

const THRESHOLD_LABEL = {
  wr_champion: "WR cible (%)",
  deaths_below: "Deaths max",
  csmin_above: "CS/min cible",
  kda_above: "KDA cible",
  kills_above: "Kills/game cible",
};

export default function GoalsSection({ data, sorted, addGoal, deleteGoal }) {
  const [type, setType] = useState("reach_rank");
  const [form, setForm] = useState({ tier: "Diamant", div: "IV", champion: "Yone", threshold: 55, count: 20 });

  const patch = (p) => setForm((prev) => ({ ...prev, ...p }));
  const thresholdLabel = THRESHOLD_LABEL[type];

  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 14 }}>
        Définis plusieurs objectifs concrets — ils apparaissent aussi dans les recaps Coach IA.
      </p>

      <Card className="p-5 mb-6">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          <Field label="Type d'objectif">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {GOAL_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </Select>
          </Field>

          {type === "reach_rank" && (
            <>
              <Field label="Tier">
                <Select value={form.tier} onChange={(e) => patch({ tier: e.target.value })}>
                  {[...TIERS, ...APEX].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              {!APEX.includes(form.tier) && (
                <Field label="Division">
                  <Select value={form.div} onChange={(e) => patch({ div: e.target.value })}>
                    {DIVS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </Field>
              )}
            </>
          )}

          {NEEDS_CHAMPION.includes(type) && (
            <Field label="Champion">
              <Select value={form.champion} onChange={(e) => patch({ champion: e.target.value })}>
                {ROSTER.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </Field>
          )}

          {thresholdLabel && (
            <Field label={thresholdLabel}>
              <Input
                type="number"
                value={form.threshold}
                onChange={(e) => patch({ threshold: Number(e.target.value) })}
              />
            </Field>
          )}

          {NEEDS_COUNT.includes(type) && (
            <Field label="Nombre de games">
              <Input type="number" value={form.count} onChange={(e) => patch({ count: Number(e.target.value) })} />
            </Field>
          )}

          <Btn variant="primary" onClick={() => addGoal({ type, ...form })}>
            <Target size={14} /> Ajouter l'objectif
          </Btn>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.goals.length === 0 && (
          <Card className="p-6">
            <EmptyChart label="Aucun objectif défini." />
          </Card>
        )}

        {data.goals.map((goal) => {
          const p = computeGoalProgress(goal, sorted);
          return (
            <Card key={goal.id} className="p-4">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--text)",
                  }}
                >
                  {GOAL_TYPES.find((t) => t.id === goal.type)?.label}
                  {p.met && <Pill tone="win">Atteint</Pill>}
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  aria-label="Supprimer l'objectif"
                  style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 6 }}>{p.label}</div>
              <div style={{ height: 6, background: "var(--bg-elevated)", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${p.pct}%`,
                    background: p.met ? "var(--win)" : "var(--gold)",
                  }}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
