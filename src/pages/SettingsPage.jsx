import { useRef, useState } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { SectionTitle, Btn, Collapsible } from "../components/ui/primitives.jsx";
import GameDetectorSection from "../components/settings/GameDetectorSection.jsx";
import RiotImportSection from "../components/settings/RiotImportSection.jsx";

export default function SettingsPage({ data, setSettings, importRiotResult, resetAll, resetStats, restoreBackup }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmResetStats, setConfirmResetStats] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(null); // fichier en attente de confirmation
  const [restoreError, setRestoreError] = useState("");
  const fileInputRef = useRef(null);

  /** Sauvegarde complète : tout l'état vit dans le navigateur, un export est la seule copie. */
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `climb-euw-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setRestoreError("");
    file
      .text()
      .then((text) => setConfirmRestore({ name: file.name, parsed: JSON.parse(text) }))
      .catch(() => setRestoreError("Fichier illisible — pas un JSON valide."));
  };

  const confirmedRestore = () => {
    try {
      restoreBackup(confirmRestore.parsed);
      setConfirmRestore(null);
    } catch (e) {
      setRestoreError(e.message);
      setConfirmRestore(null);
    }
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle sub="Sections repliables — ouvre uniquement ce dont tu as besoin.">Paramètres</SectionTitle>

      <Collapsible
        title="Import automatique (API Riot) — mode avancé"
        sub="Optionnel : ajoute tes games à la main depuis le Dashboard (bouton « Ajouter une game »), ça marche sans rien configurer. Ceci récupère tes games SoloQ automatiquement, mais demande une clé Riot personnelle et de déployer un petit proxy toi-même (voir docs/RIOT_PROXY.md) — pour qui veut se passer de la saisie manuelle."
      >
        <RiotImportSection data={data} setSettings={setSettings} importRiotResult={importRiotResult} />
      </Collapsible>

      <Collapsible
        title="GameDetectorLol"
        sub="Statut en direct de ta partie (recherche, chargement, en jeu...) — plus de notification Discord, tout s'affiche ici et sur Phone control."
      >
        <GameDetectorSection />
      </Collapsible>

      <Collapsible
        title="Statistiques"
        sub="Contrôle ce qui compte dans les stats, benchmarks et bilans IA."
      >
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={!!data.settings.includeExcludedGames}
            onChange={(e) => setSettings({ includeExcludedGames: e.target.checked })}
            style={{ marginTop: 2 }}
          />
          <span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>
              Inclure les games marquées "non représentatives" dans les stats et bilans
            </span>
            <br />
            <span style={{ fontSize: 11.5, color: "var(--dim)" }}>
              Par défaut, une game marquée non représentative (remake, teammate qui feed volontairement, smurf
              adverse — voir le drapeau dans l'historique ou l'édition d'une game) est exclue des agrégats de
              tendance, des benchmarks et des prompts de bilan IA, pour ne pas fausser la lecture de ta vraie
              progression. Elle reste toujours visible dans l'historique et compte pour ton rang/LP.
            </span>
          </span>
        </label>
      </Collapsible>

      <Collapsible
        title="Sauvegarde"
        sub="Tes données ne vivent que dans ce navigateur — vider le cache ou changer d'appareil les efface. Pense à exporter de temps en temps."
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: confirmRestore || restoreError ? 12 : 0 }}>
          <Btn onClick={exportBackup}>
            <Download size={14} /> Exporter une sauvegarde
          </Btn>
          <Btn onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Importer une sauvegarde
          </Btn>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={onFilePicked} hidden />
        </div>

        {confirmRestore && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--text)" }}>
              Remplacer toutes les données actuelles par le contenu de "{confirmRestore.name}" ?
            </span>
            <Btn variant="danger" onClick={confirmedRestore}>
              Oui, restaurer
            </Btn>
            <Btn onClick={() => setConfirmRestore(null)}>Annuler</Btn>
          </div>
        )}
        {restoreError && (
          <div style={{ fontSize: 12, color: "var(--loss)", marginTop: 8 }}>{restoreError}</div>
        )}
        {!confirmRestore && !restoreError && (
          <p style={{ fontSize: 11.5, color: "var(--dim)" }}>
            Importer remplace intégralement les données actuelles — utile pour restaurer un export ou passer sur un
            autre appareil, pas pour fusionner deux historiques.
          </p>
        )}
      </Collapsible>

      <Collapsible title="Zone sensible">
        <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
          {!confirmResetStats ? (
            <Btn variant="danger" onClick={() => setConfirmResetStats(true)}>
              <RotateCcw size={14} /> Réinitialiser les games et statistiques
            </Btn>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--text)" }}>
                Confirmer la suppression des games et statistiques ?
              </span>
              <Btn
                variant="danger"
                onClick={() => {
                  resetStats();
                  setConfirmResetStats(false);
                }}
              >
                Oui, effacer les games et stats
              </Btn>
              <Btn onClick={() => setConfirmResetStats(false)}>Annuler</Btn>
            </div>
          )}
          <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8 }}>
            Efface les games, objectifs, historique et rang courant — garde la
            config de connexion (URL/token du Worker, clé API, GameDetectorLol) pour ne pas
            avoir à tout ressaisir.
          </p>
        </div>

        {!confirmReset ? (
          <Btn variant="danger" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={14} /> Réinitialiser toutes les données
          </Btn>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--text)" }}>
              Confirmer la suppression de toutes les données ?
            </span>
            <Btn
              variant="danger"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
              }}
            >
              Oui, tout effacer
            </Btn>
            <Btn onClick={() => setConfirmReset(false)}>Annuler</Btn>
          </div>
        )}
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8 }}>
          Efface absolument tout, y compris la config de connexion — à réserver à un vrai
          "repartir de zéro".
        </p>
      </Collapsible>

      <p style={{ fontSize: 11.5, color: "var(--dim)", textAlign: "center", marginTop: 24 }}>
        <a
          href="https://github.com/RomainPitot/lol-climb-tracker/issues"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "inherit" }}
        >
          Signaler un bug ou une idée
        </a>
      </p>
    </div>
  );
}
