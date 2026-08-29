import { useEffect, useState } from "react";
import { Download, Play } from "lucide-react";
import { Field, Input, Btn } from "../ui/primitives.jsx";

/** Doit rester identique au STATUS_PORT défini dans notifier.py (GameDetectorLol). */
const STATUS_URL = "http://127.0.0.1:37653/status";
const STATUS_POLL_MS = 3000;

/**
 * Configure le webhook Discord utilisé par le script local GameDetectorLol (surveille
 * l'API du client League — ready check + début/fin de partie — et poste sur Discord).
 *
 * CLIMB.EUW est un site statique : il ne peut ni lire le lockfile du client LoL, ni
 * détecter une partie lui-même (pas d'accès système de fichiers ni réseau local depuis
 * un navigateur). Cette section ne fait que fabriquer confortablement le config.json que
 * le script attend, pour éviter d'éditer le JSON à la main — plus deux compléments :
 * - un indicateur de statut, qui interroge le petit serveur local que le script expose
 *   (utile seulement si ce site est ouvert sur le même PC que celui qui fait tourner le
 *   script — sinon la requête échoue silencieusement, ce qui est normal) ;
 * - un lien `gamedetectorlol://` pour lancer le script d'un clic, via le mécanisme
 *   standard de Windows pour les liens d'application (comme un lien Spotify/Discord).
 *   Nécessite d'avoir importé `register_protocol.reg` une fois (voir le README du script).
 */
export default function NotificationsSection({ data, setSettings }) {
  const s = data.settings;
  const enabled = s.discordNotificationsEnabled || false;
  const webhookUrl = s.discordWebhookUrl || "";
  const [status, setStatus] = useState("checking"); // "checking" | "active" | "inactive"
  const [phase, setPhase] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(STATUS_URL);
        if (!res.ok) throw new Error("bad status");
        const body = await res.json();
        if (!cancelled) {
          setStatus("active");
          setPhase(body.phase || null);
        }
      } catch {
        // Échec attendu si le script ne tourne pas, ou si ce site n'est pas ouvert sur
        // le même PC — pas une erreur à signaler, juste "pas détecté".
        if (!cancelled) {
          setStatus("inactive");
          setPhase(null);
        }
      }
    };

    poll();
    const id = setInterval(poll, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const downloadConfig = () => {
    const config = { discord_webhook_url: webhookUrl, lockfile_path: null };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setSettings({ discordNotificationsEnabled: e.target.checked })}
          style={{ marginTop: 2 }}
        />
        <span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>Notifications Discord</span>
          <br />
          <span style={{ fontSize: 11.5, color: "var(--dim)" }}>
            Utilisé par le script local GameDetectorLol pour t'alerter sur Discord quand une partie est trouvée
            (popup "Accepter"), quand le chargement démarre, et quand il se termine.
          </span>
        </span>
      </label>

      <Field label="URL du webhook Discord">
        <Input
          value={webhookUrl}
          onChange={(e) => setSettings({ discordWebhookUrl: e.target.value })}
          placeholder="https://discord.com/api/webhooks/..."
          disabled={!enabled}
        />
      </Field>

      <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8, marginBottom: 16 }}>
        Pour l'obtenir : dans Discord, ouvre le salon où tu veux recevoir les alertes → <strong>Modifier le salon</strong>{" "}
        → <strong>Intégrations</strong> → <strong>Webhooks</strong> → <strong>Nouveau webhook</strong> →{" "}
        <strong>Copier l'URL du webhook</strong>.
      </p>

      <Btn variant="primary" onClick={downloadConfig} disabled={!enabled || !webhookUrl.trim()}>
        <Download size={14} /> Télécharger config.json
      </Btn>

      <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8, marginBottom: 18 }}>
        Dépose ce fichier dans le dossier du script, en écrasant l'ancien s'il existe (
        <code>C:\Users\pitot\Documents\GameDetectorLol\config.json</code>), puis relance le script s'il tournait déjà
        pour qu'il prenne en compte le changement.
      </p>

      <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: status === "active" ? "var(--win)" : status === "checking" ? "var(--dim)" : "var(--loss)",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>
            {status === "checking" && "Vérification..."}
            {status === "active" && `Détection active${phase ? ` (${phase})` : ""}`}
            {status === "inactive" && "Script non détecté"}
          </span>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginBottom: 14 }}>
          Cet indicateur n'a de sens que si tu es sur le même PC que celui qui fait tourner le script — sinon
          "non détecté" est normal, pas une erreur.
        </p>

        <a href="gamedetectorlol://lancer" style={{ textDecoration: "none" }}>
          <Btn type="button">
            <Play size={14} /> Lancer GameDetectorLol
          </Btn>
        </a>
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8 }}>
          Ce site ne peut pas démarrer de programme sur ton PC de lui-même (aucun site ne le peut, c'est une
          restriction de sécurité des navigateurs) — ce bouton utilise un lien <code>gamedetectorlol://</code>, le
          même mécanisme que les liens qui ouvrent Spotify ou Discord. Il faut avoir importé{" "}
          <code>register_protocol.reg</code> une fois (voir le README du script) ; ton navigateur demandera une
          confirmation à chaque clic, c'est normal.
        </p>
      </div>
    </>
  );
}
