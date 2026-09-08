import { useState } from "react";
import { Sparkles, ChevronRight, CheckCircle2, Pencil, Check } from "lucide-react";
import { Field, Input, Select, Btn, Spinner } from "../ui/primitives.jsx";
import { RIOT_REGIONS, WORKER_CODE } from "../../constants/riot.js";
import { fetchRiotGames, diagnoseRiotError } from "../../lib/riotApi.js";
import { rankLabel } from "../../lib/rank.js";
import { DEFAULT_ACTIVE_INTERVAL_MIN } from "../../hooks/useAutoRiotImport.js";

const MODES = [
  {
    id: "proxy",
    title: "Via mon proxy (recommandé)",
    desc: "Ta clé Riot reste sur ton propre Worker, jamais dans le navigateur.",
  },
  {
    id: "direct",
    title: "Direct (peu fiable)",
    desc: "Appel direct au navigateur — bloqué par CORS dans la plupart des cas.",
  },
];

/** Correspondance entre les clés du formulaire local et celles persistées dans `settings`. */
const FIELD_TO_SETTING = {
  mode: "riotMode",
  apiKey: "riotApiKey",
  proxyUrl: "riotProxyUrl",
  proxyToken: "riotProxyToken",
  gameName: "riotGameName",
  tagLine: "riotTagLine",
  platform: "riotPlatform",
  count: "riotCount",
  autoImport: "riotAutoImport",
  activeIntervalMin: "riotActiveIntervalMin",
};

export default function RiotImportSection({ data, setSettings, importRiotResult }) {
  const s = data.settings;
  const [form, setForm] = useState({
    mode: s.riotMode || "proxy",
    apiKey: s.riotApiKey || "",
    proxyUrl: s.riotProxyUrl || "",
    proxyToken: s.riotProxyToken || "",
    gameName: s.riotGameName || "",
    tagLine: s.riotTagLine || "EUW",
    platform: s.riotPlatform || "euw1",
    count: s.riotCount || 20,
    autoImport: s.riotAutoImport || false,
    activeIntervalMin: s.riotActiveIntervalMin || DEFAULT_ACTIVE_INTERVAL_MIN,
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showWorkerGuide, setShowWorkerGuide] = useState(false);

  const configured = !!(form.gameName && (form.mode === "proxy" ? form.proxyUrl : form.apiKey));
  // Champs de connexion (URL Worker, token, pseudo, région...) repliés une fois configurés
  // — on ne les retouche presque jamais après le premier réglage, pas la peine de les
  // laisser occuper l'écran à chaque fois qu'on vient juste chercher ses dernières games.
  const [editingAccount, setEditingAccount] = useState(!configured);

  // Persiste chaque champ dès sa saisie (pas seulement au clic sur "Récupérer") : sans ça,
  // remplir le formulaire puis changer de page sans lancer l'import perdait tout.
  const patch = (p) => {
    setForm((prev) => ({ ...prev, ...p }));
    const settingsPatch = {};
    for (const [key, value] of Object.entries(p)) {
      if (FIELD_TO_SETTING[key]) settingsPatch[FIELD_TO_SETTING[key]] = value;
    }
    if (Object.keys(settingsPatch).length) setSettings(settingsPatch);
  };

  const run = async () => {
    setLoading(true);
    setMsg("");
    setError("");

    const region = RIOT_REGIONS.find((r) => r.platform === form.platform) || RIOT_REGIONS[0];
    const existingMatchIds = new Set(data.games.map((g) => g.matchId).filter(Boolean));
    const conn = { ...form, platform: region.platform, continent: region.continent };

    try {
      // beforeRank sert à estimer un LP par game (voir estimateLpChanges dans riotApi.js) :
      // c'est le rang tel que l'app le connaît juste avant ce lot de games.
      const result = await fetchRiotGames(conn, existingMatchIds, data.currentRank, data.rankHistory);
      // Un seul appel qui combine games + rang + PUUID + historique de rang : voir le
      // commentaire sur importRiotResult dans useTrackerData.js (bug d'écrasement corrigé).
      const importedCount = importRiotResult({
        puuid: result.puuid,
        games: result.games,
        rank: result.rank,
        rankHistory: result.rankHistory,
      });
      // Le LP par game n'est jamais fourni tel quel par Riot — voir estimateLpChanges dans
      // riotApi.js. Chaque game de ce lot est marquée individuellement exacte ou estimée
      // selon qu'une vérification de rang isolée a pu la délimiter ou non (≈ dans l'historique).
      const estimatedCount = result.games.filter((g) => g.lpEstimated).length;
      const exactCount = result.games.length - estimatedCount;
      let lpNote = " Le gain/perte de LP n'est pas fourni par l'API Riot — pense à corriger les LP des games importées si besoin (bouton Modifier dans l'historique).";
      if (result.rank && estimatedCount > 0 && exactCount > 0) {
        lpNote = ` Sur ce lot : ${exactCount} game(s) avec un LP exact, ${estimatedCount} estimée(s) (marquées ≈ dans l'historique — plusieurs games résolues entre deux vérifications de rang). Un intervalle de vérification automatique plus court augmente la part de valeurs exactes. Corrige les estimées à la main si tu les connais précisément.`;
      } else if (result.rank && estimatedCount > 0) {
        lpNote =
          " Le LP par game n'est pas fourni par l'API Riot — les valeurs affichées (marquées ≈) sont une estimation basée sur ton rang avant/après ce lot, pas la vraie donnée Riot. Astuce : importe plus souvent (idéalement après chaque game) pour des lots plus petits, donc plus précis — avec une seule game par lot, la valeur devient exacte. Corrige-les à la main si tu les connais précisément (bouton Modifier dans l'historique).";
      } else if (result.rank && exactCount > 0) {
        lpNote =
          exactCount > 1
            ? " LP exact pour ces games (pas une estimation) — une vérification de rang les a délimitées individuellement."
            : " LP exact pour cette game (pas une estimation) — une vérification de rang l'a délimitée individuellement.";
      }

      setMsg(
        `${importedCount} nouvelle(s) game(s) SoloQ importée(s) sur ${result.totalFound} trouvées.` +
          (result.rank
            ? ` Rang resynchronisé : ${rankLabel(result.rank.tier, result.rank.div)} — ${result.rank.lp} LP.`
            : "") +
          lpNote
      );
    } catch (e) {
      setError(`Échec de la récupération automatique (${e.message}). ${diagnoseRiotError(e, form.mode)}`);
    } finally {
      setLoading(false);
    }
  };

  const canRun = form.gameName && (form.mode === "proxy" ? form.proxyUrl : form.apiKey);
  const regionLabel = RIOT_REGIONS.find((r) => r.platform === form.platform)?.label || form.platform;

  return (
    <>
      <div
        style={{
          padding: "12px 14px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          marginBottom: 16,
        }}
      >
        {configured && !editingAccount ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle2 size={18} color="var(--win)" style={{ flexShrink: 0 }} />
              <div>
                <div className="tnum" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>
                  {form.gameName}#{form.tagLine}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--dim)" }}>
                  {regionLabel} · {form.mode === "proxy" ? "via proxy" : "direct"}
                </div>
              </div>
            </div>
            <Btn onClick={() => setEditingAccount(true)}>
              <Pencil size={14} /> Modifier
            </Btn>
          </div>
        ) : (
          <>
            {!configured && (
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
                Aucun compte connecté — renseigne les informations ci-dessous.
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => patch({ mode: m.id })}
                  className="hoverable"
                  style={{
                    flex: "1 1 220px",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    textAlign: "left",
                    background: form.mode === m.id ? "rgba(212,175,55,0.1)" : "var(--card)",
                    border: `1px solid ${form.mode === m.id ? "var(--gold)" : "var(--border)"}`,
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: "var(--dim)" }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {form.mode === "proxy" && (
              <div style={{ marginBottom: 14 }}>
                <button
                  onClick={() => setShowWorkerGuide((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: "none",
                    color: "var(--gold)",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <ChevronRight
                    size={14}
                    style={{ transform: showWorkerGuide ? "rotate(90deg)" : "none", transition: "transform .15s" }}
                  />
                  Voir le code du Worker à déployer (Cloudflare, gratuit, ~5 min)
                </button>

                {showWorkerGuide && <WorkerGuide />}
              </div>
            )}

            {form.mode === "proxy" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
                <Field label="URL de ton Worker">
                  <Input
                    value={form.proxyUrl}
                    onChange={(e) => patch({ proxyUrl: e.target.value })}
                    placeholder="https://lol-proxy.tonnom.workers.dev"
                    autoComplete="off"
                    name="climb-euw-riot-proxy-url"
                  />
                </Field>
                <Field label="Token du proxy">
                  <Input
                    value={form.proxyToken}
                    onChange={(e) => patch({ proxyToken: e.target.value })}
                    placeholder="le PROXY_TOKEN que tu as choisi"
                    autoComplete="off"
                    name="climb-euw-riot-proxy-token"
                  />
                </Field>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
                <Field label="Clé API Riot">
                  <Input
                    value={form.apiKey}
                    onChange={(e) => patch({ apiKey: e.target.value })}
                    placeholder="RGAPI-..."
                    autoComplete="off"
                    name="climb-euw-riot-api-key"
                  />
                </Field>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 14 }}>
              <Field label="Nom (Riot ID)">
                <Input value={form.gameName} onChange={(e) => patch({ gameName: e.target.value })} placeholder="ex: MonPseudo" />
              </Field>
              <Field label="Tag (#)">
                <Input value={form.tagLine} onChange={(e) => patch({ tagLine: e.target.value })} placeholder="EUW" />
              </Field>
              <Field label="Région">
                <Select value={form.platform} onChange={(e) => patch({ platform: e.target.value })}>
                  {RIOT_REGIONS.map((r) => (
                    <option key={r.platform} value={r.platform}>{r.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Nb de games à vérifier">
                <Input type="number" value={form.count} onChange={(e) => patch({ count: Number(e.target.value) })} />
              </Field>
            </div>

            <Btn variant="primary" onClick={() => setEditingAccount(false)} disabled={!configured}>
              <Check size={14} /> Terminé
            </Btn>
          </>
        )}
      </div>

      <Btn variant="primary" onClick={run} disabled={loading || !canRun}>
        {loading ? <Spinner /> : <Sparkles size={14} />} {loading ? "Récupération en cours…" : "Récupérer mes dernières games SoloQ"}
      </Btn>

      {msg && <div className="fade-in" style={{ marginTop: 10, fontSize: 12.5, color: "var(--win)" }}>{msg}</div>}
      {error && <div className="fade-in" style={{ marginTop: 10, fontSize: 12.5, color: "var(--loss)" }}>{error}</div>}

      <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={form.autoImport}
            onChange={(e) => patch({ autoImport: e.target.checked })}
            style={{ marginTop: 2 }}
          />
          <span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>
              Vérifier automatiquement (toutes les {form.activeIntervalMin} min)
            </span>
            <br />
            <span style={{ fontSize: 11.5, color: "var(--dim)" }}>
              Tant que ce site reste ouvert dans un onglet — les petits lots (souvent une seule game) donnent un LP
              exact plutôt qu'estimé. Ne remplace pas un import manuel après une longue absence.
            </span>
          </span>
        </label>
        {form.autoImport && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 12 }}>
              <Field label="Intervalle de vérification (min)">
                <Input
                  type="number"
                  min={1}
                  value={form.activeIntervalMin}
                  onChange={(e) => patch({ activeIntervalMin: Number(e.target.value) })}
                />
              </Field>
            </div>
            <AutoImportStatus settings={s} />
          </>
        )}
      </div>
    </>
  );
}

/** Statut de la dernière vérification automatique (voir useAutoRiotImport.js). */
function AutoImportStatus({ settings }) {
  if (!settings.riotLastAutoCheck) {
    return (
      <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--dim)" }}>
        Pas encore de vérification automatique effectuée — la première aura lieu sous peu.
      </div>
    );
  }
  const time = new Date(settings.riotLastAutoCheck).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (settings.riotLastAutoError) {
    return (
      <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--loss)" }}>
        Dernière vérification à {time} : échec ({settings.riotLastAutoError}).
      </div>
    );
  }
  const count = settings.riotLastAutoCount || 0;
  return (
    <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--dim)" }}>
      Dernière vérification à {time} : {count > 0 ? `${count} nouvelle(s) game(s) importée(s).` : "rien de nouveau."}
    </div>
  );
}

const em = { color: "var(--text)" };

function WorkerGuide() {
  return (
    <div style={{ marginTop: 10, fontSize: 12, color: "var(--dim)", lineHeight: 1.6 }}>
      <ol style={{ paddingLeft: 18, marginBottom: 10 }}>
        <li>
          Crée un compte gratuit sur <span style={em}>dash.cloudflare.com</span>, section{" "}
          <span style={em}>Workers &amp; Pages</span> → <span style={em}>Create Worker</span>.
        </li>
        <li>
          Remplace le code par défaut par celui ci-dessous, puis <span style={em}>Deploy</span>.
        </li>
        <li>
          Dans <span style={em}>Settings → Variables and Secrets</span> du Worker, ajoute deux secrets :{" "}
          <span style={em}>RIOT_API_KEY</span> (ta clé Riot) et <span style={em}>PROXY_TOKEN</span> (une chaîne random
          que tu inventes).
        </li>
        <li>
          Copie l'URL du Worker (ex: <span style={em}>https://lol-proxy.tonnom.workers.dev</span>) et ton token dans
          les champs ci-dessous.
        </li>
        <li>
          Une clé de dev Riot expire toutes les 24h — il faudrait revenir mettre à jour le secret{" "}
          <span style={em}>RIOT_API_KEY</span> chaque jour. Demande plutôt une <em>Personal API Key</em> sur le
          portail Riot (gratuite, pour ton usage perso) : elle n'expire pas, un seul copier-coller ici et c'est réglé
          pour de bon.
        </li>
      </ol>
      <pre
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 12,
          fontSize: 11,
          overflowX: "auto",
          color: "var(--text)",
          whiteSpace: "pre",
        }}
      >
        {WORKER_CODE}
      </pre>
    </div>
  );
}
