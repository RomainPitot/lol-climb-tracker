import { Download } from "lucide-react";
import { Field, Input, Btn } from "../ui/primitives.jsx";

/**
 * Configure le webhook Discord utilisé par le script local GameDetectorLol (surveille
 * l'API du client League — ready check + début de partie — et poste sur Discord).
 *
 * CLIMB.EUW est un site statique : il ne peut ni lire le lockfile du client LoL, ni
 * détecter une partie lui-même (pas d'accès système de fichiers ni réseau local depuis
 * un navigateur). Cette section ne fait que fabriquer confortablement le config.json que
 * le script attend, pour éviter d'éditer le JSON à la main.
 */
export default function NotificationsSection({ data, setSettings }) {
  const s = data.settings;
  const enabled = s.discordNotificationsEnabled || false;
  const webhookUrl = s.discordWebhookUrl || "";

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
            (popup "Accepter") et quand elle démarre réellement.
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

      <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8 }}>
        Dépose ce fichier dans le dossier du script, en écrasant l'ancien s'il existe (
        <code>C:\Users\pitot\Documents\GameDetectorLol\config.json</code>), puis relance le script s'il tournait déjà
        pour qu'il prenne en compte le changement.
      </p>
    </>
  );
}
