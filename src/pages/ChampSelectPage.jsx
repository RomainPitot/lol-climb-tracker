import { useEffect, useMemo, useState } from "react";
import { Wifi, WifiOff, Settings2, Ban, Check } from "lucide-react";
import { Card, SectionTitle, Eyebrow, Field, Input, Btn, Pill, Spinner } from "../components/ui/primitives.jsx";
import ChampAvatar from "../components/ChampAvatar.jsx";
import { useChampionList } from "../hooks/useChampionList.js";
import { useChampSelect } from "../hooks/useChampSelect.js";
import {
  DEFAULT_HOST,
  sendChampSelectAction,
  findMyAction,
  unavailableChampionIds,
  fetchRunePages,
  activateRunePage,
} from "../lib/gameDetector.js";

const PHASE_LABEL = {
  PLANNING: "Bannissements",
  BAN_PICK: "Sélection des champions",
  FINALIZATION: "Derniers réglages",
};

export default function ChampSelectPage({ data, setSettings }) {
  const s = data.settings;
  const host = s.gameDetectorHost || DEFAULT_HOST;
  const token = s.gameDetectorToken || "";
  const configured = !!token;

  const [hostInput, setHostInput] = useState(host);
  const [tokenInput, setTokenInput] = useState(token);
  const [editingConfig, setEditingConfig] = useState(!configured);

  const { champions } = useChampionList();
  const byKey = useMemo(() => Object.fromEntries(champions.map((c) => [c.champKey, c])), [champions]);

  const { connected, phase, inChampSelect, session, sessionError } = useChampSelect(host, token);
  const myAction = findMyAction(session);
  const unavailable = useMemo(() => unavailableChampionIds(session), [session]);

  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState("");

  // Nouvelle action (nouveau tour, nouvelle phase) -> on oublie la sélection précédente.
  useEffect(() => {
    setHovered(null);
    setActionError("");
  }, [myAction?.id]);

  const saveConfig = () => {
    setSettings({ gameDetectorHost: hostInput.trim() || DEFAULT_HOST, gameDetectorToken: tokenInput.trim() });
    setEditingConfig(false);
  };

  const hoverChampion = async (champKey) => {
    setHovered(champKey);
    setActionError("");
    if (!myAction) return;
    try {
      await sendChampSelectAction(host, token, { actionId: myAction.id, championId: champKey, completed: false });
    } catch (e) {
      setActionError(e.message);
    }
  };

  const confirmChampion = async () => {
    if (!myAction || !hovered) return;
    setConfirming(true);
    setActionError("");
    try {
      await sendChampSelectAction(host, token, { actionId: myAction.id, championId: hovered, completed: true });
    } catch (e) {
      setActionError(e.message);
    } finally {
      setConfirming(false);
    }
  };

  const filteredChampions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return champions.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [champions, query]);

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle sub="Choisis ton champion, bannis, et change tes runes depuis ton téléphone pendant la sélection — tant qu'il reste sur le même Wi-Fi que le PC qui fait tourner GameDetectorLol.">
        Sélection de champion
      </SectionTitle>

      <Card className="p-5 mb-5">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {connected ? <Wifi size={16} color="var(--win)" /> : <WifiOff size={16} color="var(--dim)" />}
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {connected
                ? `Connecté — ${PHASE_LABEL[phase] || (inChampSelect ? "Sélection des champions" : "en attente")}`
                : "Script local non détecté"}
            </span>
          </div>
          {configured && (
            <button
              onClick={() => setEditingConfig((v) => !v)}
              className="icon-btn"
              aria-label="Modifier la connexion"
            >
              <Settings2 size={15} />
            </button>
          )}
        </div>

        {!connected && (
          <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 8 }}>
            Vérifie que GameDetectorLol tourne sur ton PC, que ton téléphone est sur le même Wi-Fi, et que
            l'adresse ci-dessous est correcte (elle s'affiche dans la fenêtre du script au démarrage).
          </p>
        )}

        {editingConfig && (
          <div
            className="fade-in"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 14 }}
          >
            <Field label="Adresse du PC (Wi-Fi)">
              <Input
                value={hostInput}
                onChange={(e) => setHostInput(e.target.value)}
                placeholder="192.168.1.42:37653"
              />
            </Field>
            <Field label="Token (affiché au démarrage du script)">
              <Input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="…" />
            </Field>
            <div style={{ display: "flex", alignItems: "end" }}>
              <Btn variant="primary" onClick={saveConfig}>
                <Check size={14} /> Enregistrer
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {connected && !inChampSelect && (
        <Card className="p-6">
          <div style={{ textAlign: "center", color: "var(--dim)", fontSize: 13, padding: "12px 0" }}>
            En attente d'une sélection de champion — reste sur cette page, elle se met à jour automatiquement dès
            qu'une game est trouvée et acceptée.
          </div>
        </Card>
      )}

      {inChampSelect && (
        <>
          {sessionError && (
            <Card className="p-4 mb-4" style={{ borderColor: "rgba(255,92,92,0.4)" }}>
              <span style={{ fontSize: 12.5, color: "var(--loss)" }}>{sessionError}</span>
            </Card>
          )}

          {session && (
            <>
              <TeamsAndBans session={session} byKey={byKey} />

              <Card className="p-5 mt-4">
                {myAction ? (
                  <>
                    <Eyebrow color={myAction.type === "ban" ? "var(--loss)" : "var(--gold)"} style={{ marginBottom: 10 }}>
                      {myAction.type === "ban" ? "À toi de bannir" : "À toi de choisir ton champion"}
                    </Eyebrow>

                    {hovered && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <ChampAvatar ddragonId={byKey[hovered]?.id} size={48} />
                        <div>
                          <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 18, color: "var(--text)" }}>
                            {byKey[hovered]?.name || hovered}
                          </div>
                          <Btn
                            variant="primary"
                            onClick={confirmChampion}
                            disabled={confirming}
                            style={{ marginTop: 6 }}
                          >
                            {confirming ? <Spinner /> : myAction.type === "ban" ? <Ban size={14} /> : <Check size={14} />}
                            {confirming ? "Confirmation…" : myAction.type === "ban" ? "Confirmer le ban" : "Confirmer le pick"}
                          </Btn>
                        </div>
                      </div>
                    )}

                    {actionError && (
                      <div style={{ fontSize: 12, color: "var(--loss)", marginBottom: 10 }}>{actionError}</div>
                    )}

                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Chercher un champion…"
                      style={{ marginBottom: 10 }}
                    />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
                        gap: 6,
                        maxHeight: 320,
                        overflowY: "auto",
                        padding: 2,
                      }}
                    >
                      {filteredChampions.map((c) => {
                        const isUnavailable = unavailable.has(c.champKey);
                        const isSelected = hovered === c.champKey;
                        return (
                          <button
                            key={c.champKey}
                            onClick={() => hoverChampion(c.champKey)}
                            disabled={isUnavailable}
                            title={c.name}
                            className="hoverable"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 4,
                              padding: 4,
                              borderRadius: "var(--radius-md)",
                              background: isSelected ? "rgba(212,175,55,0.14)" : "transparent",
                              border: `1px solid ${isSelected ? "var(--gold)" : "transparent"}`,
                              cursor: isUnavailable ? "not-allowed" : "pointer",
                              opacity: isUnavailable ? 0.3 : 1,
                            }}
                          >
                            <ChampAvatar ddragonId={c.id} size={40} />
                            <span
                              style={{
                                fontSize: 9.5,
                                color: "var(--dim)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 60,
                              }}
                            >
                              {c.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", color: "var(--dim)", fontSize: 13, padding: "8px 0" }}>
                    Ce n'est pas ton tour pour l'instant — la grille apparaît dès que tu peux agir.
                  </div>
                )}
              </Card>

              <RunesPanel host={host} token={token} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function TeamsAndBans({ session, byKey }) {
  const myBans = (session.bans?.myTeamBans || []).filter((id) => id);
  const theirBans = (session.bans?.theirTeamBans || []).filter((id) => id);
  const timer = session.timer;
  const secondsLeft = timer && !timer.isInfinite ? Math.max(0, Math.ceil(timer.adjustedTimeLeftInPhase / 1000)) : null;

  return (
    <Card className="p-5">
      {secondsLeft !== null && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Eyebrow>{PHASE_LABEL[timer.phase] || "Sélection en cours"}</Eyebrow>
          <span
            className="tnum"
            style={{
              fontFamily: "var(--display)",
              fontWeight: 700,
              fontSize: 20,
              color: secondsLeft <= 5 ? "var(--loss)" : "var(--gold)",
            }}
          >
            {secondsLeft}s
          </span>
        </div>
      )}

      {(myBans.length > 0 || theirBans.length > 0) && (
        <div style={{ display: "flex", gap: 24, marginBottom: 18, flexWrap: "wrap" }}>
          <BanRow label="Bans alliés" ids={myBans} byKey={byKey} />
          <BanRow label="Bans ennemis" ids={theirBans} byKey={byKey} />
        </div>
      )}

      <Eyebrow style={{ marginBottom: 8 }}>Ton équipe</Eyebrow>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {(session.myTeam || []).map((p) => (
          <PlayerSlot key={p.cellId} player={p} byKey={byKey} isMe={p.cellId === session.localPlayerCellId} />
        ))}
      </div>
    </Card>
  );
}

function BanRow({ label, ids, byKey }) {
  if (!ids.length) return null;
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {ids.map((id, i) => (
          <div key={`${id}-${i}`} style={{ position: "relative" }}>
            <ChampAvatar ddragonId={byKey[id]?.id} size={32} />
            <Ban
              size={16}
              color="var(--loss)"
              style={{ position: "absolute", top: -4, right: -4, background: "var(--card)", borderRadius: "50%" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerSlot({ player, byKey, isMe }) {
  const champ = byKey[player.championId];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: "var(--radius-md)",
        background: isMe ? "rgba(212,175,55,0.1)" : "var(--bg-elevated)",
        border: `1px solid ${isMe ? "var(--gold)" : "var(--border)"}`,
      }}
    >
      <ChampAvatar ddragonId={champ?.id} size={30} />
      <span style={{ fontSize: 12.5, fontWeight: isMe ? 700 : 500, color: isMe ? "var(--gold)" : "var(--text)" }}>
        {champ?.name || "?"}
      </span>
    </div>
  );
}

function RunesPanel({ host, token }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activatingId, setActivatingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRunePages(host, token)
      .then((p) => {
        if (!cancelled) {
          setPages(p);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [host, token]);

  const activate = async (pageId) => {
    setActivatingId(pageId);
    try {
      await activateRunePage(host, token, pageId);
      setPages((prev) => prev.map((p) => ({ ...p, current: p.id === pageId })));
    } catch (e) {
      setError(e.message);
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <Card className="p-5 mt-4">
      <Eyebrow style={{ marginBottom: 10 }}>Pages de runes</Eyebrow>
      {loading && (
        <div style={{ fontSize: 12.5, color: "var(--dim)", display: "flex", gap: 6, alignItems: "center" }}>
          <Spinner /> Chargement…
        </div>
      )}
      {error && <div style={{ fontSize: 12.5, color: "var(--loss)", marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pages.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "9px 12px",
              borderRadius: "var(--radius-md)",
              background: p.current ? "rgba(212,175,55,0.1)" : "var(--bg-elevated)",
              border: `1px solid ${p.current ? "var(--gold)" : "var(--border)"}`,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.name}</span>
            {p.current ? (
              <Pill tone="gold">Active</Pill>
            ) : (
              <Btn onClick={() => activate(p.id)} disabled={activatingId === p.id}>
                {activatingId === p.id ? <Spinner /> : null} Utiliser
              </Btn>
            )}
          </div>
        ))}
        {!loading && pages.length === 0 && !error && (
          <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Aucune page de runes trouvée.</div>
        )}
      </div>
    </Card>
  );
}
