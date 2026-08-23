import { useState } from "react";
import { Sparkles, Upload, ChevronRight } from "lucide-react";
import { Field, Input, Select, TextArea, Btn } from "../ui/primitives.jsx";
import { RIOT_REGIONS, WORKER_CODE } from "../../constants/riot.js";
import { fetchRiotGames, diagnoseRiotError } from "../../lib/riotApi.js";
import { riotMatchToGame } from "../../lib/importers.js";
import { rankLabel } from "../../lib/rank.js";

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

export default function RiotImportSection({ data, setSettings, setCurrentRank, importGames }) {
  const s = data.settings;
  const [form, setForm] = useState({
    mode: s.riotMode || "proxy",
    apiKey: s.riotApiKey || "",
    proxyUrl: s.riotProxyUrl || "",
    proxyToken: s.riotProxyToken || "",
    gameName: s.riotGameName || "",
    tagLine: s.riotTagLine || "EUW",
    platform: s.riotPlatform || "euw1",
    count: 20,
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [matchJsonText, setMatchJsonText] = useState("");
  const [manualPuuid, setManualPuuid] = useState(s.riotPuuid || "");
  const [showWorkerGuide, setShowWorkerGuide] = useState(false);

  const patch = (p) => setForm((prev) => ({ ...prev, ...p }));

  const run = async () => {
    setLoading(true);
    setMsg("");
    setError("");

    // On mémorise la config avant l'appel : elle reste utile même si celui-ci échoue.
    setSettings({
      riotMode: form.mode,
      riotApiKey: form.apiKey,
      riotProxyUrl: form.proxyUrl,
      riotProxyToken: form.proxyToken,
      riotGameName: form.gameName,
      riotTagLine: form.tagLine,
      riotPlatform: form.platform,
    });

    const region = RIOT_REGIONS.find((r) => r.platform === form.platform) || RIOT_REGIONS[0];
    const existingMatchIds = new Set(data.games.map((g) => g.matchId).filter(Boolean));
    const conn = { ...form, platform: region.platform, continent: region.continent };

    try {
      const result = await fetchRiotGames(conn, existingMatchIds);
      if (result.puuid) {
        setManualPuuid(result.puuid);
        setSettings({ riotPuuid: result.puuid });
      }
      if (result.games.length) importGames(result.games);
      if (result.rank) setCurrentRank(result.rank);

      setMsg(
        `${result.games.length} nouvelle(s) game(s) SoloQ importée(s) sur ${result.totalFound} trouvées.` +
          (result.rank
            ? ` Rang resynchronisé : ${rankLabel(result.rank.tier, result.rank.div)} — ${result.rank.lp} LP.`
            : "") +
          " Le gain/perte de LP n'est pas fourni par l'API Riot — pense à corriger les LP des games importées si besoin (bouton Modifier dans l'historique)."
      );
    } catch (e) {
      setError(
        `Échec de la récupération automatique (${e.message}). ${diagnoseRiotError(e, form.mode)} En attendant, utilise le repli manuel juste en dessous.`
      );
    } finally {
      setLoading(false);
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
            style={{
              flex: "1 1 220px",
              padding: "10px 12px",
              borderRadius: 8,
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
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <Field label="Clé API Riot">
            <Input value={form.apiKey} onChange={(e) => patch({ apiKey: e.target.value })} placeholder="RGAPI-..." />
          </Field>
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
        <Sparkles size={14} /> {loading ? "Récupération en cours…" : "Récupérer mes dernières games SoloQ"}
      </Btn>

      {msg && <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--win)" }}>{msg}</div>}
      {error && <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--loss)" }}>{error}</div>}

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
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
          <span style={em}>RIOT_API_KEY</span> régulièrement.
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
