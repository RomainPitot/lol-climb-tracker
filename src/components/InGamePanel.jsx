import { Card, Eyebrow, Pill, Spinner } from "./ui/primitives.jsx";
import ChampAvatar from "./ChampAvatar.jsx";
import { useLiveGame } from "../hooks/useLiveGame.js";
import { useDdragonVersion } from "../hooks/useDdragonVersion.js";

const OBJECTIVE_LABEL = {
  DragonKill: "Dragon",
  BaronKill: "Baron",
  HeraldKill: "Héraut",
  TurretKilled: "Tourelle",
  InhibKilled: "Inhibiteur",
};

/** "ORDER"/"CHAOS" (valeurs Riot) → couleur de côté, jamais présenté comme "ton équipe" —
 * la Live Client Data ne dit pas laquelle est la tienne de façon fiable, voir README. */
const TEAM_LABEL = { ORDER: "Équipe bleue", CHAOS: "Équipe rouge" };

function formatClock(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Infos en direct pendant la partie (façon Blitz), tant qu'on est réellement en jeu
 * (chargement terminé — voir useChampSelect gameLoaded). Données 100% factuelles depuis
 * la Live Client Data de Riot : pas de timer prédictif de prochain objectif (les
 * intervalles de spawn changent trop souvent d'une saison à l'autre pour être codés en
 * dur sans risquer d'afficher un faux compte à rebours), pas de cooldown de sort
 * d'invocateur adverse (Riot ne l'expose pas du tout par cette API, aucun contournement
 * honnête possible) — seulement ce que le jeu confirme réellement.
 */
export default function InGamePanel({ host, token }) {
  const { liveGame, error } = useLiveGame(host, token, true);
  const ddragonVersion = useDdragonVersion();

  if (error && !liveGame) {
    return (
      <Card className="p-5">
        <div style={{ textAlign: "center", color: "var(--dim)", fontSize: 13, padding: "12px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Spinner /> En attente de la partie…
        </div>
      </Card>
    );
  }

  if (!liveGame) {
    return (
      <Card className="p-5">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0" }}>
          <Spinner />
        </div>
      </Card>
    );
  }

  const teams = { ORDER: [], CHAOS: [] };
  for (const p of liveGame.players) {
    (teams[p.team] || (teams[p.team] = [])).push(p);
  }
  const events = [...liveGame.objectiveEvents].sort((a, b) => b.time - a.time);

  return (
    <Card className="p-5">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Eyebrow style={{ marginBottom: 0 }}>En jeu</Eyebrow>
        <span className="tnum" style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 20, color: "var(--gold)" }}>
          {formatClock(liveGame.gameTime)}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {["ORDER", "CHAOS"].map((team) => (
          <div key={team}>
            <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 8, fontWeight: 600 }}>
              {TEAM_LABEL[team]}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(teams[team] || []).map((p) => (
                <div
                  key={p.summonerName}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-elevated)",
                    opacity: p.isDead ? 0.5 : 1,
                  }}
                >
                  <ChampAvatar name={p.champion} size={28} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.champion} <span style={{ color: "var(--dim)", fontWeight: 400 }}>Nv.{p.level}</span>
                    </div>
                    <div className="tnum" style={{ fontSize: 10.5, color: "var(--dim)", display: "flex", gap: 8 }}>
                      <span title="KDA">{p.kills}/{p.deaths}/{p.assists}</span>
                      <span title="CS">{p.cs} CS</span>
                      {p.isDead && p.respawnTimer > 0 && <span style={{ color: "var(--loss)" }}>Mort {Math.ceil(p.respawnTimer)}s</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {p.items.slice(0, 6).map((it, i) =>
                      it.id ? (
                        <img
                          key={i}
                          src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/item/${it.id}.png`}
                          alt={it.name}
                          title={it.name}
                          width={18}
                          height={18}
                          style={{ borderRadius: 3 }}
                        />
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {liveGame.activePlayerGold != null && (
        <div style={{ fontSize: 11.5, color: "var(--dim)", marginBottom: 12 }}>
          Ton or actuel : <span className="tnum" style={{ color: "var(--gold)", fontWeight: 700 }}>{Math.round(liveGame.activePlayerGold)}</span>
        </div>
      )}

      <Eyebrow style={{ marginBottom: 8 }}>Objectifs pris</Eyebrow>
      {events.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--dim)" }}>Aucun objectif pris pour l'instant.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
          {events.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span className="tnum" style={{ color: "var(--dim)", minWidth: 40 }}>{formatClock(e.time)}</span>
              <span style={{ color: "var(--text)" }}>
                {OBJECTIVE_LABEL[e.type] || e.type}
                {e.detail ? ` (${e.detail})` : ""}
                {e.stolen ? " — volé !" : ""}
              </span>
              {e.team && (
                <Pill tone={e.team === "ORDER" ? "neutral" : "loss"} style={{ marginLeft: "auto" }}>
                  {TEAM_LABEL[e.team]}
                </Pill>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 12, opacity: 0.8 }}>
        Pas de compte à rebours de prochain objectif ni de cooldown de sort adverse ici :
        Riot ne fournit ni l'un ni l'autre de façon fiable par cette API — jamais deviné à
        la place.
      </p>
    </Card>
  );
}
