import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Play, Copy, Check, QrCode } from "lucide-react";
import { Field, Input, Btn } from "../ui/primitives.jsx";

/** Doit rester identique au STATUS_PORT défini dans notifier.py (GameDetectorLol). */
const STATUS_URL = "http://127.0.0.1:37653/status";
const PAIRING_URL = "http://127.0.0.1:37653/pairing";
const STATUS_POLL_MS = 3000;

/**
 * Configure le webhook Discord utilisé par le script local GameDetectorLol (surveille
 * l'API du client League — ready check + début/fin de partie — et poste sur Discord).
 *
 * CLIMB.EUW est un site statique : il ne peut ni lire le lockfile du client LoL, ni
 * détecter une partie lui-même (pas d'accès système de fichiers ni réseau local depuis
 * un navigateur). Cette section ne fait que fabriquer confortablement le config.json que
 * le script attend, pour éviter d'éditer le JSON à la main — plus trois compléments :
 * - un indicateur de statut, qui interroge le petit serveur local que le script expose
 *   (utile seulement si ce site est ouvert sur le même PC que celui qui fait tourner le
 *   script — sinon la requête échoue silencieusement, ce qui est normal) ;
 * - un lien `gamedetectorlol://` pour lancer le script d'un clic ;
 * - un QR code à scanner avec le téléphone pour connecter la page "Sélection de champion"
 *   sans rien recopier à la main — le script réserve l'adresse+token complets aux
 *   requêtes venant de ce PC (127.0.0.1), jamais au reste du Wi-Fi (voir notifier.py).
 */
export default function NotificationsSection({ data, setSettings }) {
  const s = data.settings;
  const enabled = s.discordNotificationsEnabled || false;
  const webhookUrl = s.discordWebhookUrl || "";
  const [status, setStatus] = useState("checking"); // "checking" | "active" | "inactive"
  const [phase, setPhase] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [pairingLink, setPairingLink] = useState(null);
  const [pairingError, setPairingError] = useState("");
  const [copied, setCopied] = useState(false);

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

  // Le QR/lien dépend de l'adresse+token du script, qu'on ne connaît qu'une fois détecté —
  // on les récupère nous-mêmes (depuis ce PC) plutôt que de les faire recopier à la main.
  useEffect(() => {
    if (status !== "active") {
      setQrDataUrl(null);
      setPairingLink(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(PAIRING_URL);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
        if (cancelled || !body.host || !body.token) return;
        const link = `${window.location.origin}${window.location.pathname}?champselect_host=${encodeURIComponent(body.host)}&champselect_token=${encodeURIComponent(body.token)}`;
        const dataUrl = await QRCode.toDataURL(link, { margin: 1, width: 176 });
        if (cancelled) return;
        setPairingLink(link);
        setQrDataUrl(dataUrl);
        setPairingError("");
      } catch (e) {
        if (!cancelled) setPairingError(e.message || "Impossible de générer le QR code.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pairingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard refusé : le lien reste affiché, sélectionnable à la main
    }
  };

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

      <div style={{ paddingTop: 16, marginTop: 16, borderTop: "1px solid var(--border)" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 7 }}>
          <QrCode size={14} /> Connecter ton téléphone (Sélection de champion)
        </span>
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4, marginBottom: 14 }}>
          Scanne ce QR code avec l'appareil photo de ton téléphone (connecté au même Wi-Fi que ce PC) — il configure
          tout automatiquement et ouvre directement la page Sélection de champion, sans rien recopier à la main.
        </p>

        {status !== "active" && (
          <p style={{ fontSize: 12, color: "var(--dim)" }}>
            Le QR code apparaît ici automatiquement une fois GameDetectorLol détecté ci-dessus.
          </p>
        )}

        {status === "active" && pairingError && (
          <p style={{ fontSize: 12, color: "var(--loss)" }}>{pairingError}</p>
        )}

        {status === "active" && qrDataUrl && (
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <img
              src={qrDataUrl}
              alt="QR code de connexion téléphone"
              width={128}
              height={128}
              style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--border)", flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <Btn onClick={copyLink}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copié" : "Copier le lien"}
              </Btn>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--dim)",
                  marginTop: 8,
                  wordBreak: "break-all",
                  maxWidth: 420,
                }}
              >
                {pairingLink}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
