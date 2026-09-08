import { useEffect, useMemo, useRef, useState } from "react";
import { Wifi, WifiOff, Settings2, Ban, Check, Rocket, Search, X, Star, Play, QrCode } from "lucide-react";
import { Card, SectionTitle, Eyebrow, Field, Input, Select, Btn, Pill, Spinner, ToggleChip } from "../components/ui/primitives.jsx";
import ChampAvatar from "../components/ChampAvatar.jsx";
import AiCoachPanel from "../components/AiCoachPanel.jsx";
import QrModal from "../components/QrModal.jsx";
import { useChampionList } from "../hooks/useChampionList.js";
import { useChampSelect } from "../hooks/useChampSelect.js";
import { usePairingLink } from "../hooks/usePairingLink.js";
import { rankLabel } from "../lib/rank.js";
import { representativeGames } from "../lib/gameModel.js";
import { gamePhaseLabel } from "../constants/gameDetector.js";
import { ROLES } from "../constants/game.js";
import { FR_ROLE_TO_LCU } from "../constants/riot.js";
import {
  DEFAULT_HOST,
  sendChampSelectAction,
  findMyAction,
  findMyPendingPick,
  unavailableChampionIds,
  fetchRunePages,
  activateRunePage,
  updateRunePage,
  launchRiotClient,
  fetchLobbyStatus,
  startQueue,
  cancelQueue,
  respondReadyCheck,
  setSummonerSpells,
} from "../lib/gameDetector.js";
import { fetchRuneTree, fetchSummonerSpells } from "../lib/ddragon.js";

// Sous-phase INTERNE au champ select (timer.phase de la session) — différent de la phase
// globale du client (None/Lobby/ChampSelect/InProgress...) affichée en haut de page via
// gamePhaseLabel (constants/gameDetector.js), qui remplace la notification Discord.
const CHAMPSELECT_SUBPHASE_LABEL = {
  PLANNING: "Bannissements",
  BAN_PICK: "Sélection des champions",
  FINALIZATION: "Derniers réglages",
};

const POSITION_LABEL = { top: "Top", jungle: "Jungle", middle: "Mid", bottom: "ADC", utility: "Support" };

export default function ChampSelectPage({ data, sorted, currentRank, setSettings }) {
  const s = data.settings;
  const host = s.gameDetectorHost || DEFAULT_HOST;
  const token = s.gameDetectorToken || "";
  const configured = !!token;

  const [hostInput, setHostInput] = useState(host);
  const [tokenInput, setTokenInput] = useState(token);
  const [editingConfig, setEditingConfig] = useState(!configured);

  const { champions } = useChampionList();
  const byKey = useMemo(() => Object.fromEntries(champions.map((c) => [c.champKey, c])), [champions]);

  const { connected, phase, gameLoaded, remoteConnected, inChampSelect, session, sessionError } = useChampSelect(host, token);

  // "Lancer GameDetectorLol" -> dès qu'il devient détecté juste après ce clic, propose
  // directement le QR en grand (pas la peine de rechercher le bouton "Afficher en grand"
  // dans Paramètres) ; il se referme seul dès qu'un appareil distant (le téléphone) se met
  // à interroger le script (voir remoteConnected, notifier.py) — signe qu'il a bien scanné.
  const [awaitingLaunch, setAwaitingLaunch] = useState(false);
  const [showLaunchQr, setShowLaunchQr] = useState(false);
  const wasConnected = useRef(connected);
  useEffect(() => {
    if (awaitingLaunch && !wasConnected.current && connected) {
      setShowLaunchQr(true);
      setAwaitingLaunch(false);
    }
    wasConnected.current = connected;
  }, [connected, awaitingLaunch]);
  useEffect(() => {
    if (remoteConnected) setShowLaunchQr(false);
  }, [remoteConnected]);
  const { qrDataUrl: launchQrDataUrl, error: launchQrError } = usePairingLink(showLaunchQr);

  const myAction = findMyAction(session);
  // Ton pick à venir, même si ce n'est pas encore ton tour (voir findMyPendingPick) — permet
  // de présélectionner ton champion pendant les bans adverses, comme dans le client officiel.
  // Les bans, eux, ne se présélectionnent pas : myAction reste la seule source pour un ban.
  const myPendingPick = findMyPendingPick(session);
  const activeAction = myAction || myPendingPick;
  const unavailable = useMemo(() => unavailableChampionIds(session), [session]);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [hovered, setHovered] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState("");

  const favorites = useMemo(() => new Set(s.favoriteChampionIds || []), [s.favoriteChampionIds]);
  const recurringBans = useMemo(() => new Set(s.recurringBanIds || []), [s.recurringBanIds]);
  const toggleFavorite = (champKey) => {
    const next = new Set(favorites);
    next.has(champKey) ? next.delete(champKey) : next.add(champKey);
    setSettings({ favoriteChampionIds: [...next] });
  };
  const toggleRecurringBan = (champKey) => {
    const next = new Set(recurringBans);
    next.has(champKey) ? next.delete(champKey) : next.add(champKey);
    setSettings({ recurringBanIds: [...next] });
  };

  // Nouvelle action (nouveau tour, nouvelle phase) -> on oublie la sélection précédente.
  useEffect(() => {
    setHovered(null);
    setActionError("");
  }, [activeAction?.id]);

  const saveConfig = () => {
    setSettings({ gameDetectorHost: hostInput.trim() || DEFAULT_HOST, gameDetectorToken: tokenInput.trim() });
    setEditingConfig(false);
  };

  const hoverChampion = async (champKey) => {
    setHovered(champKey);
    setActionError("");
    if (!activeAction) return;
    try {
      await sendChampSelectAction(host, token, { actionId: activeAction.id, championId: champKey, completed: false });
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
    let list = champions.filter((c) => !q || c.name.toLowerCase().includes(q));
    if (roleFilter !== "all") {
      const pool = new Set(data.championPool?.[roleFilter] || []);
      list = list.filter((c) => pool.has(c.id));
    }
    return [...list].sort((a, b) => {
      const favA = favorites.has(a.champKey) ? 0 : 1;
      const favB = favorites.has(b.champKey) ? 0 : 1;
      return favA !== favB ? favA - favB : a.name.localeCompare(b.name, "fr");
    });
  }, [champions, query, roleFilter, data.championPool, favorites]);

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
              {connected ? `Connecté — ${gamePhaseLabel(phase, gameLoaded)}` : "Script local non détecté"}
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
          <>
            <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 8, marginBottom: 10 }}>
              Vérifie que GameDetectorLol tourne sur ton PC, que ton téléphone est sur le même Wi-Fi, et que
              l'adresse ci-dessous est correcte (elle s'affiche dans la fenêtre du script au démarrage). Si tu es
              sur ce PC, tu peux aussi le lancer directement :
            </p>
            <a
              href="gamedetectorlol://lancer"
              style={{ textDecoration: "none" }}
              onClick={() => setAwaitingLaunch(true)}
            >
              <Btn type="button">
                <Play size={14} /> Lancer GameDetectorLol
              </Btn>
            </a>
          </>
        )}

        {connected && !remoteConnected && !showLaunchQr && (
          <Btn onClick={() => setShowLaunchQr(true)} style={{ marginTop: 8 }}>
            <QrCode size={14} /> Connecter mon téléphone
          </Btn>
        )}

        {showLaunchQr && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--dim)" }}>
            {launchQrError ? (
              <span style={{ color: "var(--loss)" }}>{launchQrError}</span>
            ) : launchQrDataUrl ? (
              "En attente du scan… le QR se referme automatiquement une fois ton téléphone connecté."
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Spinner /> Génération du QR code…
              </span>
            )}
          </div>
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

      {connected && !inChampSelect && phase === "ReadyCheck" && <ReadyCheckPanel host={host} token={token} />}
      {connected && !inChampSelect && phase !== "ReadyCheck" && <QueuePanel host={host} token={token} phase={phase} />}

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
                {activeAction ? (
                  <>
                    <Eyebrow color={myAction?.type === "ban" ? "var(--loss)" : "var(--gold)"} style={{ marginBottom: 10 }}>
                      {myAction
                        ? myAction.type === "ban"
                          ? "À toi de bannir"
                          : "À toi de choisir ton champion"
                        : "Présélectionne ton champion (pas encore ton tour)"}
                    </Eyebrow>

                    {hovered && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                        <ChampAvatar ddragonId={byKey[hovered]?.id} size={48} />
                        <div>
                          <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 18, color: "var(--text)" }}>
                            {byKey[hovered]?.name || hovered}
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                            {myAction ? (
                              <Btn variant="primary" onClick={confirmChampion} disabled={confirming}>
                                {confirming ? <Spinner /> : myAction.type === "ban" ? <Ban size={14} /> : <Check size={14} />}
                                {confirming ? "Confirmation…" : myAction.type === "ban" ? "Confirmer le ban" : "Confirmer le pick"}
                              </Btn>
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--dim)" }}>
                                Présélectionné — tu pourras confirmer dès que ce sera ton tour.
                              </span>
                            )}
                            <Btn onClick={() => toggleFavorite(hovered)} title="Favori">
                              <Star size={14} fill={favorites.has(hovered) ? "var(--gold)" : "none"} color="var(--gold)" />
                              {favorites.has(hovered) ? "Favori" : "Ajouter aux favoris"}
                            </Btn>
                            {myAction?.type === "ban" && (
                              <Btn onClick={() => toggleRecurringBan(hovered)} title="Ban habituel">
                                <Ban size={14} color={recurringBans.has(hovered) ? "var(--loss)" : "var(--dim)"} />
                                {recurringBans.has(hovered) ? "Retirer des bans habituels" : "Ajouter aux bans habituels"}
                              </Btn>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {actionError && (
                      <div style={{ fontSize: 12, color: "var(--loss)", marginBottom: 10 }}>{actionError}</div>
                    )}

                    {myAction?.type === "ban" && recurringBans.size > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 6 }}>Bans habituels</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {[...recurringBans].map((key) => {
                            const c = byKey[key];
                            if (!c || unavailable.has(key)) return null;
                            return (
                              <button
                                key={key}
                                onClick={() => hoverChampion(key)}
                                title={c.name}
                                className="hoverable"
                                style={{
                                  padding: 3,
                                  borderRadius: "var(--radius-md)",
                                  background: hovered === key ? "rgba(212,175,55,0.14)" : "transparent",
                                  border: `1px solid ${hovered === key ? "var(--gold)" : "var(--border)"}`,
                                }}
                              >
                                <ChampAvatar ddragonId={c.id} size={32} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                      {["all", ...ROLES].map((r) => (
                        <ToggleChip key={r} active={roleFilter === r} onClick={() => setRoleFilter(r)}>
                          {r === "all" ? "Tous" : r}
                        </ToggleChip>
                      ))}
                    </div>

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
                              position: "relative",
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
                            {favorites.has(c.champKey) && (
                              <Star
                                size={11}
                                fill="var(--gold)"
                                color="var(--gold)"
                                style={{ position: "absolute", top: 1, right: 1 }}
                              />
                            )}
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

              <SpellsPanel host={host} token={token} session={session} />

              <RunesPanel host={host} token={token} />

              <MatchupAnalysis
                session={session}
                byKey={byKey}
                sorted={representativeGames(sorted, !!s.includeExcludedGames)}
                currentRank={currentRank}
              />
            </>
          )}
        </>
      )}

      {showLaunchQr && launchQrDataUrl && (
        <QrModal
          dataUrl={launchQrDataUrl}
          onClose={() => setShowLaunchQr(false)}
          title="Scanne pour connecter ton téléphone"
        />
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
          <Eyebrow>{CHAMPSELECT_SUBPHASE_LABEL[timer.phase] || "Sélection en cours"}</Eyebrow>
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

      {/* La LCU ne révèle un champion adverse qu'une fois son pick verrouillé — session.theirTeam
          reflète déjà cette règle (championId à 0 tant que non révélé, géré par PlayerSlot). */}
      {(session.theirTeam || []).length > 0 && (
        <>
          <Eyebrow style={{ marginTop: 18, marginBottom: 8 }}>Équipe ennemie</Eyebrow>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {session.theirTeam.map((p) => (
              <PlayerSlot key={p.cellId} player={p} byKey={byKey} isMe={false} />
            ))}
          </div>
        </>
      )}
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

/** Une ligne "Rôle : Champion" pour le prompt — "?" pour un rôle non assigné (ARAM,
 * blind pick) ou un pick pas encore verrouillé, jamais une case vide ambiguë. */
function teamLines(team, byKey, meCellId) {
  return team.map((p) => {
    const role = POSITION_LABEL[p.assignedPosition] || "?";
    const champ = byKey[p.championId]?.name || (p.championId ? `#${p.championId}` : "pas encore choisi");
    return `- ${role} : ${champ}${p.cellId === meCellId ? " (moi)" : ""}`;
  });
}

/** Historique perso sur un champion — simple correspondance de nom, best-effort (les
 * games trackées stockent un nom affiché, pas l'id Data Dragon) : s'il n'y a pas de
 * correspondance, on omet la ligne plutôt que d'inventer un chiffre. */
function personalHistoryLine(sorted, championName) {
  if (!championName) return "";
  const games = sorted.filter((g) => g.champion?.toLowerCase() === championName.toLowerCase());
  if (!games.length) return "";
  const wins = games.filter((g) => g.win).length;
  return `Mon historique sur ${championName} : ${games.length} game(s), ${Math.round((wins / games.length) * 100)}% WR.`;
}

/**
 * Prompt de conseils de bans/matchups/priorités à partir de la composition en cours —
 * à coller dans Claude/ChatGPT sur le téléphone. Généré au clic (jamais automatiquement)
 * pour rester utilisable à n'importe quel moment de la sélection (bans ou picks).
 */
function MatchupAnalysis({ session, byKey, sorted, currentRank }) {
  const buildPrompt = () => {
    const myBans = (session.bans?.myTeamBans || []).filter(Boolean).map((id) => byKey[id]?.name || `#${id}`);
    const theirBans = (session.bans?.theirTeamBans || []).filter(Boolean).map((id) => byKey[id]?.name || `#${id}`);
    const me = session.myTeam.find((p) => p.cellId === session.localPlayerCellId);
    const myChamp = byKey[me?.championId]?.name;

    return `=== SÉLECTION DE CHAMPION EN COURS (League of Legends) ===
Rang du joueur : ${rankLabel(currentRank.tier, currentRank.div)}
Mon rôle : ${POSITION_LABEL[me?.assignedPosition] || "inconnu"}
Mon champion : ${myChamp || "pas encore choisi/verrouillé"}
${personalHistoryLine(sorted, myChamp)}

=== MON ÉQUIPE ===
${teamLines(session.myTeam, byKey, session.localPlayerCellId).join("\n")}

=== ÉQUIPE ENNEMIE (picks connus jusqu'ici) ===
${teamLines(session.theirTeam, byKey, -1).join("\n") || "- Aucun pick ennemi visible pour l'instant."}

=== BANS ===
Bans alliés : ${myBans.join(", ") || "aucun pour l'instant"}
Bans ennemis : ${theirBans.join(", ") || "aucun pour l'instant"}

=== DEMANDE ===
Dans l'ordre de priorité pour gagner cette game, et seulement à partir des informations
ci-dessus (ignore ce qui n'est pas encore connu plutôt que de le deviner) :
1. S'il reste des bans à faire côté allié : quel champion bannir en priorité et pourquoi.
2. Matchups déjà connus (lane par lane) : qui a l'avantage et pourquoi, en une phrase par lane.
3. Sur quel allié concentrer les ressources (invades, ganks, roams) et pourquoi.
4. Un piège ou risque spécifique à cette composition ennemie à surveiller.
Réponse concise, à puces, sans blabla.`;
  };

  return (
    <Card className="p-5 mt-4">
      <Eyebrow style={{ marginBottom: 6 }}>Conseils de bans &amp; matchups</Eyebrow>
      <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 12 }}>
        Génère un prompt sur la composition actuelle des deux équipes, à coller dans Claude ou ChatGPT — régénère-le
        si les picks changent.
      </p>
      <AiCoachPanel buildPrompt={buildPrompt} buttonLabel="Générer le prompt d'analyse" resultTitle="Prompt d'analyse" />
    </Card>
  );
}

/** Accepter/refuser la partie trouvée — le seul moment où il y a vraiment urgence (le
 * ready check expire en quelques secondes), donc les deux boutons occupent tout l'espace. */
function ReadyCheckPanel({ host, token }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const respond = async (accept) => {
    setBusy(true);
    setError("");
    try {
      await respondReadyCheck(host, token, accept);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 18, color: "var(--gold)", marginBottom: 14 }}>
          Partie trouvée !
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="primary" onClick={() => respond(true)} disabled={busy}>
            {busy ? <Spinner /> : <Check size={14} />} Accepter
          </Btn>
          <Btn onClick={() => respond(false)} disabled={busy}>
            <X size={14} /> Refuser
          </Btn>
        </div>
        {error && <div style={{ fontSize: 12, color: "var(--loss)", marginTop: 10 }}>{error}</div>}
      </div>
    </Card>
  );
}

const LOBBY_POLL_MS = 3000;
// Queues où League autorise le choix d'un rôle préféré (ARAM, blind pick... n'en ont pas) —
// tenu en phase avec ROLE_QUEUES côté notifier.py, mais un fallback local suffit tant que
// GameDetectorLol n'a pas encore répondu une première fois (roleQueues vient de /lobby).
const FALLBACK_ROLE_QUEUES = { 420: "Solo/Duo classée", 440: "Flexible classée", 400: "Normale (Draft)" };

/**
 * Lancer le client LoL (s'il est fermé) et/ou lancer une recherche de partie avec ses
 * rôles préférés, depuis le téléphone — remplace le fait d'attendre passivement d'être
 * en champ select. `phase` vient du /status de GameDetectorLol : null = client pas ouvert
 * du tout, "None"/"Lobby"/"Matchmaking" = client ouvert et pilotable ici, tout autre valeur
 * (ReadyCheck, en fin de partie...) = rien à faire ici, juste attendre.
 */
function QueuePanel({ host, token, phase }) {
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState("");

  const pilotable = phase === "None" || phase === "Lobby" || phase === "Matchmaking";

  const [lobby, setLobby] = useState(null);
  const [roleQueues, setRoleQueues] = useState(FALLBACK_ROLE_QUEUES);
  const [queueId, setQueueId] = useState(420);
  const [firstRole, setFirstRole] = useState(ROLES[0]);
  const [secondRole, setSecondRole] = useState(ROLES[1]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pilotable) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const body = await fetchLobbyStatus(host, token);
        if (cancelled) return;
        setLobby(body.lobby);
        if (body.roleQueues && Object.keys(body.roleQueues).length) setRoleQueues(body.roleQueues);
      } catch {
        // Silencieux — /status (déjà affiché plus haut) suffit à signaler un vrai souci de connexion.
      }
    };
    poll();
    const id = setInterval(poll, LOBBY_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pilotable, host, token]);

  const launch = async () => {
    setLaunching(true);
    setLaunchError("");
    try {
      await launchRiotClient(host, token);
    } catch (e) {
      setLaunchError(e.message);
    } finally {
      setLaunching(false);
    }
  };

  const roleAware = Object.keys(roleQueues).map(Number).includes(queueId);

  const search = async () => {
    setBusy(true);
    setError("");
    try {
      await startQueue(host, token, {
        queueId,
        firstPreference: roleAware ? FR_ROLE_TO_LCU[firstRole] : undefined,
        secondPreference: roleAware ? FR_ROLE_TO_LCU[secondRole] : undefined,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    setError("");
    try {
      await cancelQueue(host, token);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (phase === null) {
    return (
      <Card className="p-6">
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <p style={{ fontSize: 13, color: "var(--dim)", marginBottom: 14 }}>
            Le client League of Legends n'est pas ouvert sur ton PC.
          </p>
          <Btn variant="primary" onClick={launch} disabled={launching}>
            {launching ? <Spinner /> : <Rocket size={14} />} {launching ? "Lancement…" : "Lancer LoL"}
          </Btn>
          {launchError && <div style={{ fontSize: 12, color: "var(--loss)", marginTop: 10 }}>{launchError}</div>}
        </div>
      </Card>
    );
  }

  if (!pilotable) {
    return (
      <Card className="p-6">
        <div style={{ textAlign: "center", color: "var(--dim)", fontSize: 13, padding: "12px 0" }}>
          En attente d'une sélection de champion — reste sur cette page, elle se met à jour automatiquement dès
          qu'une game est trouvée et acceptée.
        </div>
      </Card>
    );
  }

  const searching = phase === "Matchmaking" || !!lobby?.searching;

  return (
    <Card className="p-5">
      <Eyebrow style={{ marginBottom: 10 }}>Rechercher une partie</Eyebrow>

      {searching ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
            <Spinner /> <span style={{ fontSize: 13, color: "var(--text)" }}>Recherche de partie en cours…</span>
          </div>
          <Btn onClick={cancel} disabled={busy}>
            <X size={14} /> Annuler
          </Btn>
        </div>
      ) : (
        <>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 14 }}
          >
            <Field label="Queue">
              <Select value={queueId} onChange={(e) => setQueueId(Number(e.target.value))}>
                {Object.entries(roleQueues).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            {roleAware && (
              <>
                <Field label="Rôle principal">
                  <Select value={firstRole} onChange={(e) => setFirstRole(e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Rôle secondaire">
                  <Select value={secondRole} onChange={(e) => setSecondRole(e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}
          </div>
          {error && <div style={{ fontSize: 12, color: "var(--loss)", marginBottom: 10 }}>{error}</div>}
          <Btn variant="primary" onClick={search} disabled={busy}>
            {busy ? <Spinner /> : <Search size={14} />} {busy ? "…" : "Rechercher une partie"}
          </Btn>
        </>
      )}
    </Card>
  );
}

/** Change tes deux sorts d'invocateur pendant la sélection — les valeurs actuelles sont
 * déjà dans la session (myTeam[].spell1Id/spell2Id), pas besoin d'un appel séparé pour
 * savoir ce qui est équipé. */
function SpellsPanel({ host, token, session }) {
  const me = session.myTeam?.find((p) => p.cellId === session.localPlayerCellId);
  const [spells, setSpells] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(null); // "spell1" | "spell2" | null
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchSummonerSpells()
      .then((list) => {
        if (!cancelled) setSpells(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const choose = async (slot, spellId) => {
    if (!me) return;
    const spell1Id = slot === "spell1" ? spellId : me.spell1Id;
    const spell2Id = slot === "spell2" ? spellId : me.spell2Id;
    setSaving(slot);
    setSaveError("");
    try {
      await setSummonerSpells(host, token, { spell1Id, spell2Id });
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(null);
    }
  };

  if (!me) return null;

  return (
    <Card className="p-5 mt-4">
      <Eyebrow style={{ marginBottom: 10 }}>Sorts d'invocateur</Eyebrow>
      {error && <div style={{ fontSize: 12.5, color: "var(--loss)", marginBottom: 8 }}>{error}</div>}
      {!spells && !error && (
        <div style={{ fontSize: 12.5, color: "var(--dim)", display: "flex", gap: 6, alignItems: "center" }}>
          <Spinner /> Chargement…
        </div>
      )}
      {saveError && <div style={{ fontSize: 12.5, color: "var(--loss)", marginBottom: 8 }}>{saveError}</div>}
      {spells && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {["spell1", "spell2"].map((slot) => {
            const currentId = slot === "spell1" ? me.spell1Id : me.spell2Id;
            return (
              <div key={slot}>
                <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 6 }}>
                  {slot === "spell1" ? "Touche D" : "Touche F"}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {spells.map((sp) => {
                    const isSelected = currentId === sp.id;
                    return (
                      <button
                        key={sp.id}
                        onClick={() => choose(slot, sp.id)}
                        disabled={saving === slot}
                        title={sp.name}
                        className="hoverable"
                        style={{
                          padding: 3,
                          borderRadius: "var(--radius-md)",
                          border: `1.5px solid ${isSelected ? "var(--gold)" : "var(--border)"}`,
                          background: isSelected ? "rgba(212,175,55,0.14)" : "transparent",
                          opacity: saving === slot && !isSelected ? 0.5 : 1,
                        }}
                      >
                        <img src={sp.icon} alt={sp.name} width={32} height={32} style={{ borderRadius: 6 }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function RunesPanel({ host, token }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activatingId, setActivatingId] = useState(null);
  const [editingPageId, setEditingPageId] = useState(null);
  const [tree, setTree] = useState(null);
  const [treeError, setTreeError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const reload = () =>
    fetchRunePages(host, token)
      .then((p) => {
        setPages(p);
        setError("");
      })
      .catch((e) => setError(e.message));

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

  const startEditing = async (pageId) => {
    setEditingPageId(pageId);
    setSaveError("");
    if (tree) return;
    try {
      setTree(await fetchRuneTree());
    } catch (e) {
      setTreeError(e.message);
    }
  };

  const saveEdit = async (pageId, patch) => {
    setSaving(true);
    setSaveError("");
    try {
      await updateRunePage(host, token, { pageId, ...patch });
      await reload();
      setEditingPageId(null);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
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
          <div key={p.id}>
            <div
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
              <div style={{ display: "flex", gap: 6 }}>
                {p.isEditable && (
                  <Btn onClick={() => (editingPageId === p.id ? setEditingPageId(null) : startEditing(p.id))}>
                    <Settings2 size={14} /> {editingPageId === p.id ? "Fermer" : "Modifier"}
                  </Btn>
                )}
                {p.current ? (
                  <Pill tone="gold">Active</Pill>
                ) : (
                  <Btn onClick={() => activate(p.id)} disabled={activatingId === p.id}>
                    {activatingId === p.id ? <Spinner /> : null} Utiliser
                  </Btn>
                )}
              </div>
            </div>

            {editingPageId === p.id && (
              <>
                {!tree && !treeError && (
                  <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
                    <Spinner /> Chargement de l'arbre des runes…
                  </div>
                )}
                {treeError && <div style={{ fontSize: 12, color: "var(--loss)", marginTop: 8 }}>{treeError}</div>}
                {tree && (
                  <RuneEditor
                    page={p}
                    tree={tree}
                    saving={saving}
                    error={saveError}
                    onCancel={() => setEditingPageId(null)}
                    onSave={(patch) => saveEdit(p.id, patch)}
                  />
                )}
              </>
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

/** Édition de l'arbre primaire (keystone + 3 runes) et secondaire (2 runes, sur 2 lignes
 * différentes) d'une page — les statistiques bonus (3e ligne) ne sont pas modifiables ici
 * (voir updateRunePage). Change de style primaire réinitialise ses picks aux valeurs par
 * défaut du nouvel arbre ; change de style secondaire vide ses picks (les runes d'un autre
 * arbre n'ont pas de correspondance évidente). */
function RuneEditor({ page, tree, saving, error, onCancel, onSave }) {
  const styleById = (id) => tree.find((s) => s.id === id);

  const [primaryStyleId, setPrimaryStyleId] = useState(page.primaryStyleId);
  const [subStyleId, setSubStyleId] = useState(page.subStyleId);
  const [primaryPicks, setPrimaryPicks] = useState(() => (page.selectedPerkIds || []).slice(0, 4));
  const [secondaryPicks, setSecondaryPicks] = useState(() => {
    const picks = {};
    const secStyle = styleById(page.subStyleId);
    const ids = (page.selectedPerkIds || []).slice(4, 6);
    secStyle?.slots.forEach((slot, i) => {
      if (i === 0) return;
      const found = ids.find((id) => slot.runes.some((r) => r.id === id));
      if (found) picks[i] = found;
    });
    return picks;
  });

  const primaryStyle = styleById(primaryStyleId);
  const secondaryStyle = styleById(subStyleId);

  const choosePrimaryStyle = (id) => {
    setPrimaryStyleId(id);
    setPrimaryPicks(styleById(id).slots.slice(0, 4).map((slot) => slot.runes[0].id));
    if (subStyleId === id) {
      setSubStyleId(tree.find((s) => s.id !== id).id);
      setSecondaryPicks({});
    }
  };

  const chooseSubStyle = (id) => {
    setSubStyleId(id);
    setSecondaryPicks({});
  };

  const pickPrimary = (slotIndex, runeId) => {
    setPrimaryPicks((prev) => prev.map((id, i) => (i === slotIndex ? runeId : id)));
  };

  const toggleSecondary = (slotIndex, runeId) => {
    setSecondaryPicks((prev) => {
      if (prev[slotIndex] === runeId) {
        const next = { ...prev };
        delete next[slotIndex];
        return next;
      }
      const rows = Object.keys(prev).map(Number);
      if (!rows.includes(slotIndex) && rows.length >= 2) return prev; // 2 lignes max — désélectionne-en une d'abord.
      return { ...prev, [slotIndex]: runeId };
    });
  };

  const secondaryIds = Object.values(secondaryPicks);
  const canSave = primaryPicks.length === 4 && primaryPicks.every(Boolean) && secondaryIds.length === 2;

  return (
    <div
      style={{
        marginTop: 8,
        padding: 12,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "var(--bg-elevated)",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 6 }}>Arbre primaire</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {tree.map((st) => (
          <button
            key={st.id}
            onClick={() => choosePrimaryStyle(st.id)}
            title={st.name}
            className="hoverable"
            style={{
              padding: 4,
              borderRadius: "var(--radius-md)",
              border: `1px solid ${primaryStyleId === st.id ? "var(--gold)" : "var(--border)"}`,
              background: primaryStyleId === st.id ? "rgba(212,175,55,0.14)" : "transparent",
            }}
          >
            <img src={st.icon} alt={st.name} width={28} height={28} />
          </button>
        ))}
      </div>

      {primaryStyle?.slots.map((slot, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {slot.runes.map((r) => (
            <button
              key={r.id}
              onClick={() => pickPrimary(i, r.id)}
              title={r.name}
              className="hoverable"
              style={{
                padding: 3,
                borderRadius: "50%",
                border: `2px solid ${primaryPicks[i] === r.id ? "var(--gold)" : "transparent"}`,
                opacity: primaryPicks[i] === r.id ? 1 : 0.5,
              }}
            >
              <img src={r.icon} alt={r.name} width={i === 0 ? 34 : 26} height={i === 0 ? 34 : 26} />
            </button>
          ))}
        </div>
      ))}

      <div style={{ fontSize: 11, color: "var(--dim)", margin: "12px 0 6px" }}>
        Arbre secondaire — 2 runes, sur 2 lignes différentes
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {tree
          .filter((st) => st.id !== primaryStyleId)
          .map((st) => (
            <button
              key={st.id}
              onClick={() => chooseSubStyle(st.id)}
              title={st.name}
              className="hoverable"
              style={{
                padding: 4,
                borderRadius: "var(--radius-md)",
                border: `1px solid ${subStyleId === st.id ? "var(--gold)" : "var(--border)"}`,
                background: subStyleId === st.id ? "rgba(212,175,55,0.14)" : "transparent",
              }}
            >
              <img src={st.icon} alt={st.name} width={24} height={24} />
            </button>
          ))}
      </div>

      {secondaryStyle?.slots.map((slot, i) => {
        if (i === 0) return null; // Pas de keystone en secondaire.
        return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            {slot.runes.map((r) => (
              <button
                key={r.id}
                onClick={() => toggleSecondary(i, r.id)}
                title={r.name}
                className="hoverable"
                style={{
                  padding: 3,
                  borderRadius: "50%",
                  border: `2px solid ${secondaryPicks[i] === r.id ? "var(--gold)" : "transparent"}`,
                  opacity: secondaryPicks[i] === r.id ? 1 : 0.5,
                }}
              >
                <img src={r.icon} alt={r.name} width={26} height={26} />
              </button>
            ))}
          </div>
        );
      })}

      {error && <div style={{ fontSize: 12, color: "var(--loss)", margin: "8px 0" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Btn
          variant="primary"
          disabled={!canSave || saving}
          onClick={() => onSave({ primaryStyleId, subStyleId, primaryPerkIds: primaryPicks, secondaryPerkIds: secondaryIds })}
        >
          {saving ? <Spinner /> : <Check size={14} />} Enregistrer et activer
        </Btn>
        <Btn onClick={onCancel} disabled={saving}>
          Annuler
        </Btn>
      </div>
    </div>
  );
}
