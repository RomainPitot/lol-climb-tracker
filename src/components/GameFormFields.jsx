import { ChevronRight } from "lucide-react";
import { Card, Field, Input, Select, TextArea } from "./ui/primitives.jsx";
import { ROSTER, CHAMP_ROLE } from "../constants/roster.js";
import { ROLES, ROLE_STATUS, SIDES, DEATH_CAUSES } from "../constants/game.js";
import { isBotLaneRole } from "../lib/gameModel.js";

/** Champs partagés par « Ajouter une game » et la modale d'édition. */
export default function GameFormFields({ g, set, showOptional, setShowOptional }) {
  const botLane = isBotLaneRole(g.role);
  const csPerMin = g.duration > 0 ? (Number(g.cs) / Number(g.duration)).toFixed(1) : "0";

  // Changer de champion réaligne le rôle sur son rôle habituel.
  const onChampionChange = (name) => {
    set("champion", name);
    set("role", CHAMP_ROLE[name] || g.role);
  };

  return (
    <>
      <Card className="p-5 mb-4">
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", marginBottom: 12 }}>OBLIGATOIRE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <Field label="Date" required>
            <Input type="date" value={g.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label="Heure" required>
            <Input type="time" value={g.time} onChange={(e) => set("time", e.target.value)} />
          </Field>
          <Field label="Champion" required>
            <Select value={g.champion} onChange={(e) => onChampionChange(e.target.value)}>
              {ROSTER.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Rôle" required>
            <Select value={g.role} onChange={(e) => set("role", e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="Statut du rôle" required>
            <Select value={g.roleStatus} onChange={(e) => set("roleStatus", e.target.value)}>
              {ROLE_STATUS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="Side" required>
            <Select value={g.side} onChange={(e) => set("side", e.target.value)}>
              {SIDES.map((s) => (
                <option key={s.v} value={s.v}>{s.l}</option>
              ))}
            </Select>
          </Field>

          {botLane ? (
            <>
              <Field label="Adversaire ADC">
                <Input value={g.matchupAdc} onChange={(e) => set("matchupAdc", e.target.value)} placeholder="ex: Jinx" />
              </Field>
              <Field label="Adversaire Support">
                <Input value={g.matchupSupport} onChange={(e) => set("matchupSupport", e.target.value)} placeholder="ex: Nautilus" />
              </Field>
            </>
          ) : (
            <Field label="Matchup">
              <Input value={g.matchup} onChange={(e) => set("matchup", e.target.value)} placeholder="Champion adverse" />
            </Field>
          )}

          <Field label="Résultat" required>
            <Select value={g.win ? "W" : "L"} onChange={(e) => set("win", e.target.value === "W")}>
              <option value="W">Victoire</option>
              <option value="L">Défaite</option>
            </Select>
          </Field>
          <Field label="Durée (min)" required>
            <Input type="number" value={g.duration} onChange={(e) => set("duration", e.target.value)} />
          </Field>
          <Field label="Gain/perte LP" required>
            <Input type="number" value={g.lpChange} onChange={(e) => set("lpChange", e.target.value)} placeholder="+18 ou -15" />
          </Field>
          <Field label="Kills" required>
            <Input type="number" value={g.kills} onChange={(e) => set("kills", e.target.value)} />
          </Field>
          <Field label="Deaths" required>
            <Input type="number" value={g.deaths} onChange={(e) => set("deaths", e.target.value)} />
          </Field>
          <Field label="Assists" required>
            <Input type="number" value={g.assists} onChange={(e) => set("assists", e.target.value)} />
          </Field>
          <Field label="CS" required>
            <Input type="number" value={g.cs} onChange={(e) => set("cs", e.target.value)} />
          </Field>
          <Field label="CS/min (auto)">
            <Input value={csPerMin} disabled />
          </Field>
          <Field label="Dégâts infligés" required>
            <Input type="number" value={g.damage} onChange={(e) => set("damage", e.target.value)} />
          </Field>
          <Field label="Gold gagné" required>
            <Input type="number" value={g.gold} onChange={(e) => set("gold", e.target.value)} />
          </Field>
          <Field label="Score de vision" required>
            <Input type="number" value={g.visionScore} onChange={(e) => set("visionScore", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <Field label="Note rapide (optionnel)">
          <TextArea
            rows={2}
            value={g.comment}
            onChange={(e) => set("comment", e.target.value)}
            placeholder="Ce que tu veux garder en tête sur cette game…"
          />
        </Field>
      </Card>

      <Card className="p-5 mb-4">
        <button
          onClick={() => setShowOptional((s) => !s)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: "var(--text)",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
          }}
        >
          <ChevronRight
            size={14}
            style={{ transform: showOptional ? "rotate(90deg)" : "none", transition: "transform .15s" }}
          />
          AUTRES CHAMPS OPTIONNELS
        </button>

        {showOptional && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <Field label="Première mort ?">
              <Select value={g.firstDeath ? "1" : "0"} onChange={(e) => set("firstDeath", e.target.value === "1")}>
                <option value="0">Non</option>
                <option value="1">Oui</option>
              </Select>
            </Field>
            <Field label="First Blood ?">
              <Select value={g.firstBlood ? "1" : "0"} onChange={(e) => set("firstBlood", e.target.value === "1")}>
                <option value="0">Non</option>
                <option value="1">Oui</option>
              </Select>
            </Field>
            <Field label="Morts évitables (est.)">
              <Input type="number" value={g.avoidableDeaths} onChange={(e) => set("avoidableDeaths", e.target.value)} />
            </Field>
            <Field label="Cause principale des morts">
              <Select value={g.deathCause} onChange={(e) => set("deathCause", e.target.value)}>
                <option value="">—</option>
                {DEATH_CAUSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Feeling avant (1-5)">
              <Input type="number" min={1} max={5} value={g.feeling} onChange={(e) => set("feeling", e.target.value)} />
            </Field>
            <Field label="Concentration (1-5)">
              <Input type="number" min={1} max={5} value={g.focus} onChange={(e) => set("focus", e.target.value)} />
            </Field>
            <Field label="Tilt (1-5)">
              <Input type="number" min={1} max={5} value={g.tilt} onChange={(e) => set("tilt", e.target.value)} />
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Commentaire de la game">
                <TextArea rows={2} value={g.gameComment} onChange={(e) => set("gameComment", e.target.value)} />
              </Field>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
