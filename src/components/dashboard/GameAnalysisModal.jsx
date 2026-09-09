import { useEffect, useState } from "react";
import { X, Skull, Eye, Swords, ShoppingBag, Plus, Trash2, Video, ListChecks, Layers } from "lucide-react";
import { Btn, IconBtn, Select, Input, Eyebrow, Pill, Spinner, ToggleChip } from "../ui/primitives.jsx";
import {
  DEATH_TYPES,
  DEATH_CAUSES,
  TACTICAL_NOTE_TYPES,
  TACTICAL_NOTE_VALUES,
  FLASH_AVAILABILITY,
  BUILD_VS_PLAN_TAGS,
  DRAFT_WIN_CONDITIONS,
  DRAFT_OUTCOME_TAGS,
  COMP_FUNCTIONS,
} from "../../constants/coaching.js";
import { REVERSE_CHAMP } from "../../constants/roster.js";
import { fetchItemNames, fetchRuneTree } from "../../lib/ddragon.js";
import { getMatchupNote } from "../../lib/matchupNotes.js";
import { isBotLaneRole } from "../../lib/gameModel.js";
import { guessDeathTag } from "../../lib/deathGuess.js";

const champName = (raw) => (raw ? REVERSE_CHAMP[raw] || raw : "?");

const OBJECTIVE_LABEL = {
  DRAGON: "Dragon",
  RIFTHERALD: "Herald",
  BARON_NASHOR: "Baron",
  HORDE: "Grubs",
  TOWER_BUILDING: "Tourelle",
  INHIBITOR_BUILDING: "Inhibiteur",
};

const ZONE_LABEL = { lane: "Lane", river: "River", jungle: "Jungle", base: "Base" };
const PHASE_LABEL = { early: "Early", mid: "Mid", late: "Late" };

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
export default function GameAnalysisModal({ game, matchupNotes, onSave, onClose }) {
  const t = game.timelineSummary;

  // Pré-remplissage : pour toute mort pas déjà classée pour de vrai, une suggestion
  // automatique (voir lib/deathGuess.js) plutôt qu'un select vide — jamais présentée comme
  // définitive (badge "≈ suggestion" tant que l'utilisateur n'a pas touché la ligne, voir
  // guessedIndices ci-dessous). Enregistrer sans rien changer revient à confirmer la
  // suggestion, ce qui est le comportement demandé.
  const [deathTags, setDeathTags] = useState(() =>
    (t?.deaths || []).map((d, i) => {
      const saved = game.deathTags?.[i];
      if (saved?.type) return saved;
      const guess = guessDeathTag(d, t?.wardPositions);
      if (!guess) return saved || null;
      return { type: guess.type, cause: guess.cause || "", note: saved?.note || "", flashAvailable: saved?.flashAvailable || "" };
    })
  );
  const [guessedIndices, setGuessedIndices] = useState(() => {
    const set = new Set();
    (t?.deaths || []).forEach((d, i) => {
      if (!game.deathTags?.[i]?.type && guessDeathTag(d, t?.wardPositions)) set.add(i);
    });
    return set;
  });
  const [tacticalNotes, setTacticalNotes] = useState(game.tacticalNotes || []);
  const [vodUrl, setVodUrl] = useState(game.vodUrl || "");
  const [buildTag, setBuildTag] = useState(game.buildTag || "");
  const [draft, setDraft] = useState(
    game.draft || { allyBans: "", enemyBans: "", allyComp: "", enemyComp: "", winConditions: [], outcomeTag: "", myFunction: "" }
  );
  const toggleWinCondition = (wc) =>
    setDraft((prev) => ({
      ...prev,
      winConditions: prev.winConditions.includes(wc) ? prev.winConditions.filter((w) => w !== wc) : [...prev.winConditions, wc],
    }));

  // Adversaire de lane connu sur cette game (matchup/matchupAdc — le premier renseigné) —
  // même correspondance texte que le plan de matchup (voir lib/matchupNotes.js).
  const opponentName = isBotLaneRole(game.role) ? game.matchupAdc : game.matchup;
  const matchupNote = getMatchupNote(matchupNotes || {}, game.champion, opponentName);
  const [newNoteType, setNewNoteType] = useState(null);
  const [newNoteValue, setNewNoteValue] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

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
      next[i] = { ...(next[i] || { type: "", cause: "", note: "", flashAvailable: "" }), ...patch };
      return next;
    });
    setGuessedIndices((prev) => {
      if (!prev.has(i)) return prev;
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  };

  const addTacticalNote = () => {
    if (!newNoteType || !newNoteValue) return;
    setTacticalNotes((prev) => [...prev, { id: `${Date.now()}`, type: newNoteType, value: newNoteValue, note: newNoteText.trim() }]);
    setNewNoteType(null);
    setNewNoteValue("");
    setNewNoteText("");
  };

  const removeTacticalNote = (id) => setTacticalNotes((prev) => prev.filter((n) => n.id !== id));

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
                    {d.phase && (
                      <span style={{ marginLeft: 8, display: "inline-block" }}>
                        <Pill tone="gold">{PHASE_LABEL[d.phase]}</Pill>
                      </span>
                    )}
                    {d.zone && (
                      <span
                        style={{ marginLeft: 6, fontSize: 11, color: "var(--dim)" }}
                        title="Zone approximative — déduite de la position, pas une donnée Riot brute"
                      >
                        {ZONE_LABEL[d.zone] || d.zone} · {d.context === "teamfight" ? "teamfight ≈" : "solo ≈"}
                      </span>
                    )}
                    {guessedIndices.has(i) && (
                      <span style={{ marginLeft: 8, display: "inline-block" }}>
                        <Pill
                          tone="gold"
                          title="Type/cause pré-remplis à partir de la zone/du contexte — une supposition, pas un fait : confirme (n'y touche pas) ou modifie"
                        >
                          ≈ suggestion auto
                        </Pill>
                      </span>
                    )}
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
                  <Select
                    value={tag.flashAvailable || ""}
                    onChange={(e) => updateTag(i, { flashAvailable: e.target.value })}
                    title="Pas dans l'API Riot — un signal à vérifier toi-même, jamais une conclusion automatique"
                  >
                    <option value="">Flash au moment de la mort — non renseigné</option>
                    {FLASH_AVAILABILITY.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
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

        {!t && game.teamObjectivesFallback && (
          <>
            <Eyebrow style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Swords size={12} /> Objectifs d'équipe (totaux)
            </Eyebrow>
            <p style={{ fontSize: 11, color: "var(--dim)", marginBottom: 8 }}>
              Timeline indisponible pour cette game — totaux sans timestamp, filet de sécurité seulement.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 18, fontSize: 12.5 }}>
              {Object.entries({ dragon: "Dragons", baron: "Barons", herald: "Heralds", tower: "Tourelles", inhibitor: "Inhibiteurs" }).map(
                ([key, label]) => {
                  const o = game.teamObjectivesFallback[key];
                  return (
                    <div key={key} style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: "var(--text)", minWidth: 90 }}>{label}</span>
                      <span className="tnum" style={{ color: "var(--win)" }}>{o.mine} pris</span>
                      <span className="tnum" style={{ color: "var(--loss)" }}>{o.theirs} perdus</span>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}

        {game.build && (
          <>
            <Eyebrow style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <ShoppingBag size={12} /> Build & runes
            </Eyebrow>
            <BuildSection build={game.build} />
            {matchupNote?.recommendedBuild && (
              <p style={{ fontSize: 12, color: "var(--dim)", marginTop: -6, marginBottom: 10 }}>
                Plan enregistré vs {opponentName} : <span style={{ color: "var(--text)" }}>{matchupNote.recommendedBuild}</span>
              </p>
            )}
            <Select
              value={buildTag}
              onChange={(e) => setBuildTag(e.target.value)}
              style={{ marginBottom: 20, maxWidth: 260 }}
              title="Un jugement à toi — pas de comparaison automatique possible (le plan est du texte libre)"
            >
              <option value="">Build vs plan — non taggé</option>
              {BUILD_VS_PLAN_TAGS.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </Select>
          </>
        )}

        <Eyebrow style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Layers size={12} /> Draft
        </Eyebrow>
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginBottom: 10 }}>
          100% manuel — le match Riot ne dit rien de la logique de composition. Une défaite n'est jamais
          automatiquement une "draft diff" : ce jugement reste le tien.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginBottom: 10 }}>
          <Input value={draft.allyComp} onChange={(e) => setDraft((p) => ({ ...p, allyComp: e.target.value }))} placeholder="Picks alliés (séparés par des virgules)" />
          <Input value={draft.enemyComp} onChange={(e) => setDraft((p) => ({ ...p, enemyComp: e.target.value }))} placeholder="Picks ennemis (séparés par des virgules)" />
          <Input value={draft.allyBans} onChange={(e) => setDraft((p) => ({ ...p, allyBans: e.target.value }))} placeholder="Bans alliés" />
          <Input value={draft.enemyBans} onChange={(e) => setDraft((p) => ({ ...p, enemyBans: e.target.value }))} placeholder="Bans ennemis" />
        </div>
        <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 6 }}>Win conditions de la comp (plusieurs possibles)</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {DRAFT_WIN_CONDITIONS.map((wc) => (
            <ToggleChip key={wc} active={draft.winConditions.includes(wc)} onClick={() => toggleWinCondition(wc)}>
              {wc}
            </ToggleChip>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginBottom: 20 }}>
          <Select value={draft.myFunction} onChange={(e) => setDraft((p) => ({ ...p, myFunction: e.target.value }))} title="Peut différer du rôle officiel (ex: support engage vs support peel)">
            <option value="">Ma fonction réelle dans la comp — non renseignée</option>
            {COMP_FUNCTIONS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </Select>
          <Select value={draft.outcomeTag} onChange={(e) => setDraft((p) => ({ ...p, outcomeTag: e.target.value }))}>
            <option value="">Bilan de la draft — non renseigné</option>
            {DRAFT_OUTCOME_TAGS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </Select>
        </div>

        <Eyebrow style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <ListChecks size={12} /> Notes tactiques
        </Eyebrow>
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginBottom: 10 }}>
          Wave, recall, roam, teamfight — la Timeline Riot ne dit jamais rien là-dessus, tout est à toi de noter.
        </p>

        {tacticalNotes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {tacticalNotes.map((n) => {
              const typeLabel = TACTICAL_NOTE_TYPES.find((tt) => tt.id === n.type)?.label || n.type;
              return (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "6px 10px", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <Pill tone="gold">{typeLabel}</Pill>
                  <strong style={{ color: "var(--text)" }}>{n.value}</strong>
                  {n.note && <span style={{ color: "var(--dim)" }}>— {n.note}</span>}
                  <IconBtn onClick={() => removeTacticalNote(n.id)} aria-label="Supprimer la note" style={{ marginLeft: "auto" }}>
                    <Trash2 size={13} />
                  </IconBtn>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {TACTICAL_NOTE_TYPES.map((tt) => (
            <Btn
              key={tt.id}
              onClick={() => {
                setNewNoteType(tt.id);
                setNewNoteValue("");
              }}
              variant={newNoteType === tt.id ? "primary" : undefined}
            >
              {tt.label}
            </Btn>
          ))}
        </div>

        {newNoteType && (
          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 20 }}>
            <Select value={newNoteValue} onChange={(e) => setNewNoteValue(e.target.value)}>
              <option value="">Classification…</option>
              {TACTICAL_NOTE_VALUES[newNoteType].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>
            <Input value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} placeholder="Note (optionnel)" />
            <Btn variant="primary" onClick={addTacticalNote} disabled={!newNoteValue}>
              <Plus size={14} /> Ajouter
            </Btn>
          </div>
        )}

        <Eyebrow style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Video size={12} /> VOD
        </Eyebrow>
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginBottom: 8 }}>
          Riot ne fournit aucune vidéo — si tu as enregistré cette game (Twitch, YouTube...), colle le lien ici.
        </p>
        <Input
          value={vodUrl}
          onChange={(e) => setVodUrl(e.target.value)}
          placeholder="https://twitch.tv/videos/… ou https://youtube.com/…"
          style={{ marginBottom: 20 }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="primary" onClick={() => onSave({ deathTags, tacticalNotes, vodUrl: vodUrl.trim(), buildTag, draft })}>
            Enregistrer
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
