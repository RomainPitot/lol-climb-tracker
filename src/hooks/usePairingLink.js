import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Doit rester identique au STATUS_PORT défini dans notifier.py (GameDetectorLol). */
const PAIRING_URL = "http://127.0.0.1:37653/pairing";

/**
 * Génère le lien + QR code de pairing téléphone (host+token, réservés à ce PC — voir
 * _is_loopback dans notifier.py) tant que `active` est vrai. Partagé entre
 * GameDetectorSection (Paramètres) et ChampSelectPage (bouton "Lancer" + QR auto) pour
 * ne pas dupliquer cette logique à deux endroits.
 */
export function usePairingLink(active) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [link, setLink] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active) {
      setQrDataUrl(null);
      setLink(null);
      setError("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(PAIRING_URL);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
        if (cancelled || !body.host || !body.token) return;
        const url = `${window.location.origin}${window.location.pathname}?champselect_host=${encodeURIComponent(body.host)}&champselect_token=${encodeURIComponent(body.token)}`;
        // Généré en plus grand que la taille affichée en ligne : downscaler à l'affichage
        // reste net, alors qu'agrandir à la volée l'aurait rendu flou en upscalant depuis
        // une image trop petite.
        const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 340 });
        if (cancelled) return;
        setLink(url);
        setQrDataUrl(dataUrl);
        setError("");
      } catch (e) {
        if (!cancelled) setError(e.message || "Impossible de générer le QR code.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  return { qrDataUrl, link, error };
}
