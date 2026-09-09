import { useEffect, useState } from "react";
import { X, Skull, Eye, Swords, ShoppingBag } from "lucide-react";
import { Btn, IconBtn, Select, Input, Eyebrow, Pill, Spinner } from "../ui/primitives.jsx";
import { DEATH_TYPES, DEATH_CAUSES } from "../../constants/coaching.js";
import { REVERSE_CHAMP } from "../../constants/roster.js";
import { fetchItemNames, fetchRuneTree } from "../../lib/ddragon.js";

const champName = (raw) => (raw ? REVERSE_CHAMP[raw] || raw : "?");

const OBJECTIVE_LABEL = {
  DRAGON: "Dragon",
  RIFTHERALD: "Herald",
  BARON_NASHOR: "Baron",
  HORDE: "Grubs",
  TOWER_BUILDING: "Tourelle",
  INHIBITOR_BUILDING: "Inhibiteur",
};

function msToClock(ms) {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function DiffCell({ value, suffix = "" }) {
  if (value == null) return <span style={{ color: "var(--dim)" }}>—</span>;
  const tone = value > 0 ? "var(--win)" : value < 0 ? "var(--loss)" : "var(--dim)";
  return (
    <span className="tnum" style={{ color: tone, fontWeight: 600 }}>
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

/**
 * Détail minute par minute d'une game importée depuis Riot (voir lib/riotTimeline.js) —
 * diffs CS/or/XP vs l'adversaire de rôle, chaque mort avec son contexte automatique
 * (position, gold, killer...), objectifs, wards. Les morts peuvent être classées à la main
 * (type + cause, listes fermées — voir constants/coaching.js) : c'est la seule partie que
 * la Timeline Riot ne peut jamais dire elle-même (le "pourquoi").
 */
export default function GameAnalysisModal({ game, onSave, onClose }) {
  const t = game.timelineSummary;
  const [deathTags, setDeathTags] = useState(game.deathTags?.length ? game.deathTags : (t?.deaths || []).map(() => null));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const updateTag = (i, patch) => {
    setDeathTags((prev) => {
      const next = [...prev];
      next[i] = { ...(next[i] || { type: "", cause: "", note: "" }), ...patch };
      return next;
    });
  };

  if (!t && !game.build) return null; // ne devrait pas être ouvert sans l'un des deux — voir GamesHistory

  const intervals = t
    ? Object.keys(t.diffs)
        .map(Number)
        .sort((a, b) => a - b)
    : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 20px",
        overflowY: "auto",
        zIndex: 50,
      }}
    >
      <div style={{ width: "100%", maxWidth: 880, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
            Analyse détaillée — {game.champion}{t ? ` (${t.role})` : ""}
          </div>
          <IconBtn
            onClick={onClose}
            aria-label="Fermer"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 8 }}
          >
            <X size={16} />
          </IconBtn>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginBottom: 18 }}>
          {game.date}
          {t && <> — vs {champName(t.opponentChampion)}. Généré automatiquement depuis la Timeline Riot — les morts restent à classer toi-même (la Timeline ne dit jamais "pourquoi").</>}
        </p>

        {t && intervals.length > 0 && (
          <>
            <Eyebrow style={{ marginBottom: 8 }}>Diffs vs adversaire de rôle</Eyebrow>
            <div style={{ overflowX: "auto", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--dim)" }}>
                    <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 10.5 }}> </th>
                    {intervals.map((min) => (
                      <th key={min} style={{ textAlign: "left", padding: "6px 10px", fontSize: 10.5 }}>
                        @{min}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 10px", color: "var(--text)", fontWeight: 600 }}>CS diff</td>
                    {intervals.map((min) => (
                      <td key={min} style={{ padding: "6px 10px" }}>
                        <DiffCell value={t.diffs[min].csDiff} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 10px", color: "var(--text)", fontWeight: 600 }}>Gold diff</td>
                    {intervals.map((min) => (
                      <td key={min} style={{ padding: "6px 10px" }}>
                        <DiffCell value={t.diffs[min].goldDiff} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 10px", color: "var(--text)", fontWeight: 600 }}>XP diff</td>
                    {intervals.map((min) => (
                      <td key={min} style={{ padding: "6px 10px" }}>
                        <DiffCell value={t.diffs[min].xpDiff} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {t && (
        <>
        <Eyebrow style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Skull size={12} /> Morts ({t.deaths.length})
        </Eyebrow>
        {t.deaths.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 18 }}>Aucune mort cette game.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {t.deaths.map((d, i) => {
            const tag = deathTags[i] || {};
            return (
              <div key={i} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 12.5, color: "var(--text)" }}>
                    <span className="tnum" style={{ fontWeight: 700, color: "var(--loss)" }}>{msToClock(d.timestamp)}</span>{" "}
                    tué par <strong>{champName(d.killer)}</strong>
                    {d.assists.length > 0 && <> (+ {d.assists.map(champName).join(", ")})</>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)" }} className="tnum">
                    {d.myLevelAtDeath != null && `Niv. ${d.myLevelAtDeath} · `}
                    {d.myGoldAtDeath != null && `${d.myGoldAtDeath} or · `}
                    {d.myCsAtDeath != null && `${d.myCsAtDeath} CS`}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
                  <Select value={tag.type || ""} onChange={(e) => updateTag(i, { type: e.target.value })}>
                    <option value="">Type — non classée</option>
                    {DEATH_TYPES.map((t2) => (
                      <option key={t2.id} value={t2.id}>{t2.label}</option>
                    ))}
                  </Select>
                  <Select value={tag.cause || ""} onChange={(e) => updateTag(i, { cause: e.target.value })}>
                    <option value="">Cause — non classée</option>
                    {DEATH_CAUSES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </Select>
                  <Input
                    value={tag.note || ""}
                    onChange={(e) => updateTag(i, { note: e.target.value })}
                    placeholder="Note (optionnel)"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Eyebrow style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Swords size={12} /> Objectifs
        </Eyebrow>
        {t.objectives.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 18 }}>Aucun objectif enregistré.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 18 }}>
            {t.objectives.map((o, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--text)", display: "flex", gap: 8, alignItems: "center" }}>
                <span className="tnum" style={{ color: "var(--dim)", minWidth: 44 }}>{msToClock(o.timestamp)}</span>
                <span>{OBJECTIVE_LABEL[o.kind] || o.kind}{o.laneType ? ` (${o.laneType})` : ""}</span>
                <Pill tone={o.takenByMyTeam ? "win" : "loss"}>{o.takenByMyTeam ? "Pris" : "Perdu"}</Pill>
                {o.myTeamHadVisionApprox != null && (
                  <span style={{ fontSize: 11, color: "var(--dim)" }} title="Approximation — ward active à proximité dans les 3 min précédentes, pas une certitude">
                    {o.myTeamHadVisionApprox ? "vision ≈ oui" : "vision ≈ non"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <Eyebrow style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Eye size={12} /> Vision
        </Eyebrow>
        <p style={{ fontSize: 12.5, color: "var(--text)", marginBottom: 18 }}>
          {t.wards.placed} wards posées · {t.wards.destroyed} détruites · {t.wards.controlWardsBought} control ward(s) achetée(s)
        </p>
        </>
        )}

        {game.build && (
          <>
            <Eyebrow style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <ShoppingBag size={12} /> Build & runes
            </Eyebrow>
            <BuildSection build={game.build} />
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <Btn variant="primary" onClick={() => onSave(deathTags)}>
            Enregistrer les tags
          </Btn>
          <Btn onClick={onClose}>Fermer</Btn>
        </div>
      </div>
    </div>
  );
}

/** Build final (items0-6) + runes (perks.styles) — déjà dans la réponse Match-V5 (voir
 * lib/importers.js), juste jamais affiché avant. Icônes chargées à l'ouverture seulement
 * (pas de fetch tant que cette section n'est pas montée). */
function BuildSection({ build }) {
  const [itemNames, setItemNames] = useState(null);
  const [runeIcons, setRuneIcons] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [items, tree] = await Promise.all([fetchItemNames(), fetchRuneTree()]);
        if (cancelled) return;
        setItemNames(items);
        const icons = new Map();
        for (const style of tree) {
          icons.set(style.id, { name: style.name, icon: style.icon });
          for (const slot of style.slots) {
            for (const rune of slot.runes) icons.set(rune.id, { name: rune.name, icon: rune.icon });
          }
        }
        setRuneIcons(icons);
      } catch (e) {
        if (!cancelled) setError(e.message || "Impossible de charger les icônes.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p style={{ fontSize: 12, color: "var(--loss)", marginBottom: 18 }}>{error}</p>;
  if (!itemNames || !runeIcons) {
    return (
      <div style={{ fontSize: 12.5, color: "var(--dim)", display: "flex", gap: 6, alignItems: "center", marginBottom: 18 }}>
        <Spinner /> Chargement…
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {build.items.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {build.items.map((id, i) => {
            const item = itemNames.get(id);
            return (
              <img
                key={i}
                src={item?.icon}
                alt={item?.name || `Item ${id}`}
                title={item?.name || `Item ${id}`}
                width={32}
                height={32}
                style={{ borderRadius: 6, border: "1px solid var(--border)" }}
              />
            );
          })}
        </div>
      )}
      {build.perkIds.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {build.perkIds.map((id, i) => {
            const rune = runeIcons.get(id);
            return (
              <img
                key={i}
                src={rune?.icon}
                alt={rune?.name || `Rune ${id}`}
                title={rune?.name || `Rune ${id}`}
                width={i === 0 ? 32 : 24}
                height={i === 0 ? 32 : 24}
                style={{ borderRadius: "50%" }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
