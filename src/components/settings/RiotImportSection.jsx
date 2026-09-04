import { useState } from "react";
import { Sparkles, Upload, ChevronRight, KeyRound, ExternalLink } from "lucide-react";
import { Field, Input, Select, TextArea, Btn, Spinner } from "../ui/primitives.jsx";
import { RIOT_REGIONS, WORKER_CODE } from "../../constants/riot.js";
import { fetchRiotGames, diagnoseRiotError, rotateRiotKey, diagnoseRotateError } from "../../lib/riotApi.js";
import { riotMatchToGame } from "../../lib/importers.js";
import { rankLabel } from "../../lib/rank.js";
import { DEFAULT_ACTIVE_INTERVAL_MIN, DEFAULT_IDLE_INTERVAL_MIN } from "../../hooks/useAutoRiotImport.js";

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
  adminToken: "riotAdminToken",
  autoImport: "riotAutoImport",
  sessionActive: "riotSessionActive",
  activeIntervalMin: "riotActiveIntervalMin",
  idleIntervalMin: "riotIdleIntervalMin",
};

export default function RiotImportSection({ data, setSettings, importGames, importRiotResult }) {
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
    adminToken: s.riotAdminToken || "",
    autoImport: s.riotAutoImport || false,
    sessionActive: s.riotSessionActive || false,
    activeIntervalMin: s.riotActiveIntervalMin || DEFAULT_ACTIVE_INTERVAL_MIN,
    idleIntervalMin: s.riotIdleIntervalMin || DEFAULT_IDLE_INTERVAL_MIN,
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [matchJsonText, setMatchJsonText] = useState("");
  const [manualPuuid, setManualPuuid] = useState(s.riotPuuid || "");
  const [showWorkerGuide, setShowWorkerGuide] = useState(false);

  // La nouvelle clé n'est jamais persistée : elle ne sert qu'une fois, pour cet appel.
  const [newRiotKey, setNewRiotKey] = useState("");
  const [rotating, setRotating] = useState(false);
  const [rotateMsg, setRotateMsg] = useState("");
  const [rotateError, setRotateError] = useState("");

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
      const result = await fetchRiotGames(conn, existingMatchIds, data.currentRank);
      // Un seul appel qui combine games + rang + PUUID : voir le commentaire sur
      // importRiotResult dans useTrackerData.js pour la raison (bug d'écrasement corrigé).
      const importedCount = importRiotResult({ puuid: result.puuid, games: result.games, rank: result.rank });
      if (result.puuid) setManualPuuid(result.puuid);

      const hasEstimate = result.games.some((g) => g.lpEstimated);
      let lpNote = " Le gain/perte de LP n'est pas fourni par l'API Riot — pense à corriger les LP des games importées si besoin (bouton Modifier dans l'historique).";
      if (result.rank && hasEstimate) {
        lpNote =
          " Le LP par game n'est pas fourni par l'API Riot — les valeurs affichées (marquées ≈) sont une estimation basée sur ton rang avant/après ce lot, pas la vraie donnée Riot. Astuce : importe plus souvent (idéalement après chaque game) pour des lots plus petits, donc plus précis — avec une seule game par lot, la valeur devient exacte. Corrige-les à la main si tu les connais précisément (bouton Modifier dans l'historique).";
      } else if (result.rank && importedCount === 1) {
        lpNote = " Une seule game dans ce lot : le LP affiché est la vraie valeur (pas une estimation), déduite de ton rang avant/après.";
      }

      setMsg(
        `${importedCount} nouvelle(s) game(s) SoloQ importée(s) sur ${result.totalFound} trouvées.` +
          (result.rank
            ? ` Rang resynchronisé : ${rankLabel(result.rank.tier, result.rank.div)} — ${result.rank.lp} LP.`
            : "") +
          lpNote
      );
    } catch (e) {
      setError(
        `Échec de la récupération automatique (${e.message}). ${diagnoseRiotError(e, form.mode)} En attendant, utilise le repli manuel juste en dessous.`
      );
    } finally {
      setLoading(false);
    }
  };

  const rotateKey = async () => {
    setRotating(true);
    setRotateMsg("");
    setRotateError("");
    try {
      await rotateRiotKey({ proxyUrl: form.proxyUrl, adminToken: form.adminToken }, newRiotKey.trim());
      setRotateMsg("Clé mise à jour sur le Worker. Tu peux relancer une récupération.");
      setNewRiotKey("");
    } catch (e) {
      setRotateError(`Échec de la mise à jour (${e.message}). ${diagnoseRotateError(e)}`);
    } finally {
      setRotating(false);
    }
  };

  const importMatchJson = () => {
    setError("");
    try {
      const parsed = JSON.parse(matchJsonText);
      const matches = Array.isArray(parsed) ? parsed : [parsed];
      const games = matches.map((m) => riotMatchToGame(m, manualPuuid)).filter(Boolean);
      if (!games.length) {
        setError("Aucune game trouvée pour ce PUUID dans le JSON collé — vérifie le PUUID.");
        return;
      }
      const n = importGames(games);
      setMsg(`${n} game(s) importée(s) depuis le JSON collé.`);
      setMatchJsonText("");
    } catch {
      setError("JSON de match invalide.");
    }
  };

  const canRun = form.gameName && (form.mode === "proxy" ? form.proxyUrl : form.apiKey);

  return (
    <>
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
              background: form.mode === m.id ? "rgba(212,175,55,0.1)" : "var(--bg-elevated)",
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
            />
          </Field>
          <Field label="Token du proxy">
            <Input
              value={form.proxyToken}
              onChange={(e) => patch({ proxyToken: e.target.value })}
              placeholder="le PROXY_TOKEN que tu as choisi"
            />
          </Field>
          <SessionActiveField checked={form.sessionActive} onChange={(v) => patch({ sessionActive: v })} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
          <Field label="Clé API Riot">
            <Input value={form.apiKey} onChange={(e) => patch({ apiKey: e.target.value })} placeholder="RGAPI-..." />
          </Field>
          <SessionActiveField checked={form.sessionActive} onChange={(v) => patch({ sessionActive: v })} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
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
              Vérifier automatiquement (toutes les {form.sessionActive ? form.activeIntervalMin : form.idleIntervalMin} min
              en ce moment)
            </span>
            <br />
            <span style={{ fontSize: 11.5, color: "var(--dim)" }}>
              Tant que ce site reste ouvert dans un onglet — les petits lots (souvent une seule game) donnent un LP
              exact plutôt qu'estimé. Ne remplace pas un import manuel après une longue absence. La fréquence dépend
              de "Session active" ci-dessus, réglable juste en dessous.
            </span>
          </span>
        </label>
        {form.autoImport && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 12 }}>
              <Field label="Intervalle en session active (min)">
                <Input
                  type="number"
                  min={1}
                  value={form.activeIntervalMin}
                  onChange={(e) => patch({ activeIntervalMin: Number(e.target.value) })}
                />
              </Field>
              <Field label="Intervalle hors session (min)">
                <Input
                  type="number"
                  min={1}
                  value={form.idleIntervalMin}
                  onChange={(e) => patch({ idleIntervalMin: Number(e.target.value) })}
                />
              </Field>
            </div>
            <AutoImportStatus settings={s} />
          </>
        )}
      </div>

      {form.mode === "proxy" && (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
            Renouveler la clé Riot
          </div>
          <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 10 }}>
            Une clé de dev Riot expire toutes les 24h. Régénère-la sur le portail Riot (un clic, une fois connecté),
            colle la nouvelle ici : elle est poussée directement dans les secrets du Worker, sans passer par le
            dashboard Cloudflare. Nécessite d'avoir configuré <code>ADMIN_TOKEN</code>, <code>CF_API_TOKEN</code> et{" "}
            <code>CF_ACCOUNT_ID</code> sur le Worker — voir <code>docs/RIOT_PROXY.md</code>.
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <a
              href="https://developer.riotgames.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Btn type="button">
                <ExternalLink size={14} /> Ouvrir developer.riotgames.com
              </Btn>
            </a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 10 }}>
            <Field label="Admin token (ADMIN_TOKEN du Worker)">
              <Input
                value={form.adminToken}
                onChange={(e) => patch({ adminToken: e.target.value })}
                placeholder="différent du token du proxy"
              />
            </Field>
            <Field label="Nouvelle clé Riot">
              <Input
                value={newRiotKey}
                onChange={(e) => setNewRiotKey(e.target.value)}
                placeholder="RGAPI-..."
              />
            </Field>
          </div>
          <Btn
            variant="primary"
            onClick={rotateKey}
            disabled={rotating || !form.proxyUrl || !form.adminToken || !newRiotKey.trim()}
          >
            {rotating ? <Spinner /> : <KeyRound size={14} />} {rotating ? "Mise à jour…" : "Mettre à jour la clé sur le Worker"}
          </Btn>
          {rotateMsg && <div className="fade-in" style={{ marginTop: 10, fontSize: 12.5, color: "var(--win)" }}>{rotateMsg}</div>}
          {rotateError && <div className="fade-in" style={{ marginTop: 10, fontSize: 12.5, color: "var(--loss)" }}>{rotateError}</div>}
        </div>
      )}

      <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Repli manuel (si la récupération auto échoue)
        </div>
        <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>
          Ouvre l'URL du match dans un nouvel onglet (ça contourne le blocage CORS) et colle le JSON obtenu ici. Un ou
          plusieurs objets match (tableau) sont acceptés.
        </p>
        <Field label="PUUID (rempli automatiquement après une récupération réussie, sinon à indiquer)">
          <Input value={manualPuuid} onChange={(e) => setManualPuuid(e.target.value)} placeholder="puuid du compte" />
        </Field>
        <div style={{ marginTop: 8 }}>
          <TextArea
            rows={4}
            value={matchJsonText}
            onChange={(e) => setMatchJsonText(e.target.value)}
            placeholder='{"metadata":{...},"info":{...}} ou [ {...}, {...} ]'
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <Btn onClick={importMatchJson}>
            <Upload size={14} /> Importer ce(s) match(s)
          </Btn>
        </div>
      </div>
    </>
  );
}

/** Bascule "session en cours" — détermine quel intervalle de vérification auto s'applique. */
function SessionActiveField({ checked, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--dim)", fontWeight: 500 }}>
      <span>Session active</span>
      <span
        style={{
          ...inputBoxStyle,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span style={{ fontSize: 12.5, color: "var(--text)" }}>{checked ? "Oui, je joue" : "Non"}</span>
      </span>
    </label>
  );
}

const inputBoxStyle = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "9px 10px",
};

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
          Ta clé Riot expirant toutes les 24h (clé de dev), reviens mettre à jour le secret{" "}
          <span style={em}>RIOT_API_KEY</span> régulièrement — ou configure la rotation automatique (section{" "}
          <span style={em}>Renouveler la clé Riot</span> plus bas, voir <span style={em}>docs/RIOT_PROXY.md</span>).
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
