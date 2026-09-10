import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { SectionTitle, Btn, Collapsible } from "../components/ui/primitives.jsx";
import GameDetectorSection from "../components/settings/GameDetectorSection.jsx";
import RiotImportSection from "../components/settings/RiotImportSection.jsx";

export default function SettingsPage({ data, setSettings, importRiotResult, resetAll, resetStats }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmResetStats, setConfirmResetStats] = useState(false);

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle sub="Sections repliables — ouvre uniquement ce dont tu as besoin.">Paramètres</SectionTitle>

      <Collapsible
        title="Ajouter une game"
        sub="Récupère tes dernières games SoloQ automatiquement depuis l'API Riot — plus besoin de tout ressaisir à la main."
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
    </div>
  );
}
