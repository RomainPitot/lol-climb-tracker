import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Play, Copy, Check, QrCode, Maximize2, X } from "lucide-react";
import { Btn, IconBtn } from "../ui/primitives.jsx";
import { gamePhaseLabel } from "../../constants/gameDetector.js";

/** Doit rester identique au STATUS_PORT défini dans notifier.py (GameDetectorLol). */
const STATUS_URL = "http://127.0.0.1:37653/status";
const PAIRING_URL = "http://127.0.0.1:37653/pairing";
const STATUS_POLL_MS = 3000;

/**
 * Statut en direct du script local GameDetectorLol (surveille l'API du client League) —
 * remplace la notification Discord : la phase de jeu actuelle (recherche de partie, ready
 * check, chargement, en jeu...) s'affiche ici plutôt que d'être poussée sur Discord, tant
 * que ce site est ouvert sur le même PC que le script.
 *
 * CLIMB.EUW est un site statique : il ne peut ni lire le lockfile du client LoL, ni
 * détecter une partie lui-même (pas d'accès système de fichiers ni réseau local depuis
 * un navigateur) — d'où le script séparé. Deux compléments en plus du statut :
 * - un lien `gamedetectorlol://` pour lancer le script d'un clic ;
 * - un QR code à scanner avec le téléphone pour connecter la page "Sélection de champion"
 *   sans rien recopier à la main — le script réserve l'adresse+token complets aux
 *   requêtes venant de ce PC (127.0.0.1), jamais au reste du Wi-Fi (voir notifier.py).
 */
export default function GameDetectorSection() {
  const [status, setStatus] = useState("checking"); // "checking" | "active" | "inactive"
  const [phase, setPhase] = useState(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [pairingLink, setPairingLink] = useState(null);
  const [pairingError, setPairingError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

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
          setGameLoaded(!!body.gameLoaded);
        }
      } catch {
        // Échec attendu si le script ne tourne pas, ou si ce site n'est pas ouvert sur
        // le même PC — pas une erreur à signaler, juste "pas détecté".
        if (!cancelled) {
          setStatus("inactive");
          setPhase(null);
          setGameLoaded(false);
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
        // Généré en plus grand que la taille affichée en ligne (128) : downscaler à
        // l'affichage reste net, alors qu'agrandir un QR à la volée (bouton "Afficher en
        // grand") l'aurait rendu flou en upscalant depuis une image trop petite.
        const dataUrl = await QRCode.toDataURL(link, { margin: 1, width: 340 });
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

  return (
    <>
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
          {status === "active" && gamePhaseLabel(phase, gameLoaded)}
          {status === "inactive" && "Script non détecté"}
        </span>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--dim)", marginBottom: 14 }}>
        Ce statut n'a de sens que si tu es sur le même PC que celui qui fait tourner le script — sinon
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
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn onClick={copyLink}>
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copié" : "Copier le lien"}
                </Btn>
                <Btn onClick={() => setShowQrModal(true)}>
                  <Maximize2 size={14} /> Afficher en grand
                </Btn>
              </div>
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

      {showQrModal && qrDataUrl && <QrModal dataUrl={qrDataUrl} onClose={() => setShowQrModal(false)} />}
    </>
  );
}

/** QR code en grand — plus facile à scanner à distance qu'à la petite taille affichée en ligne. */
function QrModal({ dataUrl, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Scanne avec ton téléphone</span>
          <IconBtn
            onClick={onClose}
            aria-label="Fermer"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 8 }}
          >
            <X size={16} />
          </IconBtn>
        </div>
        <img
          src={dataUrl}
          alt="QR code de connexion téléphone, en grand"
          width={340}
          height={340}
          style={{ borderRadius: 8, background: "#fff", padding: 12 }}
        />
      </div>
    </div>
  );
}
