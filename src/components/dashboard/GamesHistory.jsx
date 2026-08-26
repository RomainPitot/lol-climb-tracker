import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Card, Pill, Btn, Collapsible } from "../ui/primitives.jsx";
import ChampAvatar from "../ChampAvatar.jsx";
import EditGameModal from "../EditGameModal.jsx";
import { rankLabel } from "../../lib/rank.js";
import { round1 } from "../../lib/format.js";

const COLUMNS = ["Date", "Champion", "Statut rôle", "Résultat", "Rang", "LP", "KDA", "CS/min", "Dégâts", "Vision", ""];
const cell = { padding: "9px 12px" };

export default function GamesHistory({ sorted, deleteGame, deleteGames, updateGame }) {
  const rows = [...sorted].reverse();
  const [checked, setChecked] = useState(() => new Set());
  const [confirmId, setConfirmId] = useState(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [editingGame, setEditingGame] = useState(null);

  const toggle = (id) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setChecked((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((g) => g.id))));

  const confirmRemoveOne = (id) => {
    deleteGame(id);
    setConfirmId(null);
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const confirmRemoveSelected = () => {
    deleteGames([...checked]);
    setChecked(new Set());
    setConfirmBulk(false);
  };

  return (
    <Collapsible title="Historique" sub={`${rows.length} games trackées`}>
      {checked.size > 0 && (
        <div style={{ marginBottom: 10 }}>
          {confirmBulk ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12.5, color: "var(--loss)" }}>Supprimer {checked.size} game(s) ?</span>
              <Btn variant="danger" onClick={confirmRemoveSelected}>Confirmer</Btn>
              <Btn onClick={() => setConfirmBulk(false)}>Annuler</Btn>
            </div>
          ) : (
            <Btn variant="danger" onClick={() => setConfirmBulk(true)}>
              <Trash2 size={14} /> Supprimer la sélection ({checked.size})
            </Btn>
          )}
        </div>
      )}

      <Card className="p-0" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, color: "var(--text)" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--dim)" }}>
              <th style={{ padding: "10px 12px" }}>
                <input
                  type="checkbox"
                  aria-label="Tout sélectionner"
                  checked={rows.length > 0 && checked.size === rows.length}
                  onChange={toggleAll}
                />
              </th>
              {COLUMNS.map((h, i) => (
                <th key={h || `col-${i}`} style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "var(--dim)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} style={{ padding: 24, textAlign: "center", color: "var(--dim)" }}>
                  Aucune game trackée pour l'instant.
                </td>
              </tr>
            )}
            {rows.map((g) => (
              <tr
                key={g.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: checked.has(g.id) ? "rgba(212,175,55,0.06)" : "transparent",
                }}
              >
                <td style={cell}>
                  <input
                    type="checkbox"
                    aria-label={`Sélectionner la game du ${g.date}`}
                    checked={checked.has(g.id)}
                    onChange={() => toggle(g.id)}
                  />
                </td>
                <td style={{ ...cell, color: "var(--dim)" }}>{g.date} {g.time}</td>
                <td style={{ ...cell, fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ChampAvatar name={g.champion} size={22} />
                    <span>
                      {g.champion} <span style={{ color: "var(--dim)", fontWeight: 400 }}>({g.role})</span>
                    </span>
                  </div>
                </td>
                <td style={{ ...cell, color: "var(--dim)" }}>{g.roleStatus || "—"}</td>
                <td style={cell}>
                  <Pill tone={g.win ? "win" : "loss"}>{g.win ? "Victoire" : "Défaite"}</Pill>
                </td>
                <td style={{ ...cell, color: "var(--dim)" }}>{rankLabel(g.rankAfterTier, g.rankAfterDiv)}</td>
                <td
                  style={{ ...cell, color: g.lpChange >= 0 ? "var(--win)" : "var(--loss)", fontWeight: 600 }}
                  title={g.lpEstimated ? "Estimation : l'API Riot ne fournit pas le LP par game" : undefined}
                >
                  {g.lpEstimated ? "≈" : ""}
                  {g.lpChange >= 0 ? "+" : ""}
                  {g.lpChange}
                </td>
                <td style={cell}>{g.kills}/{g.deaths}/{g.assists}</td>
                <td style={cell}>{g.duration ? round1(g.cs / g.duration) : 0}</td>
                <td style={cell}>{g.damage}</td>
                <td style={cell}>{g.visionScore}</td>
                <td style={cell}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      onClick={() => setEditingGame(g)}
                      aria-label="Modifier"
                      style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer" }}
                    >
                      <Pencil size={14} />
                    </button>
                    {confirmId === g.id ? (
                      <>
                        <button
                          onClick={() => confirmRemoveOne(g.id)}
                          style={{ background: "none", border: "none", color: "var(--loss)", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", fontSize: 11 }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmId(g.id)}
                        aria-label="Supprimer"
                        style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {editingGame && (
        <EditGameModal
          game={editingGame}
          onCancel={() => setEditingGame(null)}
          onSave={(patch) => {
            updateGame(editingGame.id, patch);
            setEditingGame(null);
          }}
        />
      )}
    </Collapsible>
  );
}
