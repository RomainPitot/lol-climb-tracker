import { useState } from "react";
import { Check, RotateCcw, Download, AlertTriangle } from "lucide-react";
import { SectionTitle, Field, Input, Select, Btn, Collapsible } from "../components/ui/primitives.jsx";
import GoalsSection from "../components/settings/GoalsSection.jsx";
import GameDetectorSection from "../components/settings/GameDetectorSection.jsx";
import RiotImportSection from "../components/settings/RiotImportSection.jsx";
import { TIERS, APEX, DIVS } from "../constants/ranks.js";
import { rankLabel } from "../lib/rank.js";

export default function SettingsPage({
  data, sorted, currentRank, addGoal, deleteGoal,
  setThresholds, setCurrentRank, setSettings, importRiotResult, resetAll, resetStats,
}) {
  const [th, setTh] = useState(data.thresholds);
  const [rankForm, setRankForm] = useState({
    tier: currentRank.tier,
    div: currentRank.div || "IV",
    lp: currentRank.lp,
  });
  const [msg, setMsg] = useState("");
  const [msgError, setMsgError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmResetStats, setConfirmResetStats] = useState(false);

  const notify = (text, isError = false) => {
    setMsg(text);
    setMsgError(isError);
  };

  const saveCurrentRank = () => {
    const isApex = APEX.includes(rankForm.tier);
    setCurrentRank({
      tier: rankForm.tier,
      div: isApex ? null : rankForm.div,
      lp: Math.max(0, Math.round(Number(rankForm.lp) || 0)),
    });
    notify("Rang actuel mis à jour.");
  };

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

  const updateTh = (key, field, val) =>
    setTh((p) => ({ ...p, [key]: { ...p[key], [field]: Number(val) } }));

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle sub="Sections repliables — ouvre uniquement ce dont tu as besoin.">Paramètres</SectionTitle>

      {msg && (
        <div
          className="fade-in"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: "10px 14px",
            background: msgError ? "rgba(255,92,92,0.08)" : "rgba(15,214,138,0.08)",
            border: `1px solid ${msgError ? "rgba(255,92,92,0.3)" : "rgba(15,214,138,0.3)"}`,
            borderRadius: "var(--radius-md)",
            marginBottom: 16,
            fontSize: 13,
            color: "var(--text)",
          }}
        >
          {msgError ? (
            <AlertTriangle size={14} color="var(--loss)" style={{ flexShrink: 0, marginTop: 1 }} />
          ) : (
            <Check size={14} color="var(--win)" style={{ flexShrink: 0, marginTop: 1 }} />
          )}
          {msg}
        </div>
      )}

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
        title="Rang actuel"
        sub={`Actuellement : ${rankLabel(currentRank.tier, currentRank.div)} — ${currentRank.lp} LP. Corrige-le ici s'il n'est pas à jour.`}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, alignItems: "end" }}>
          <Field label="Tier">
            <Select value={rankForm.tier} onChange={(e) => setRankForm((p) => ({ ...p, tier: e.target.value }))}>
              {[...TIERS, ...APEX].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          {!APEX.includes(rankForm.tier) && (
            <Field label="Division">
              <Select value={rankForm.div} onChange={(e) => setRankForm((p) => ({ ...p, div: e.target.value }))}>
                {DIVS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="LP">
            <Input type="number" value={rankForm.lp} onChange={(e) => setRankForm((p) => ({ ...p, lp: e.target.value }))} />
          </Field>
          <Btn variant="primary" onClick={saveCurrentRank}>
            <Check size={14} /> Mettre à jour le rang actuel
          </Btn>
        </div>
      </Collapsible>

      <Collapsible title="Objectifs" sub={`${data.goals.length} objectif(s) défini(s)`}>
        <GoalsSection data={data} sorted={sorted} addGoal={addGoal} deleteGoal={deleteGoal} />
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
        title="Seuils de couleur"
        sub="Règle à partir de quelle valeur une stat s'affiche en vert / orange / rouge."
      >
        {Object.entries(th).map(([key, t]) => (
          <div
            key={key}
            style={{ display: "grid", gridTemplateColumns: "1fr repeat(2, 120px)", gap: 10, alignItems: "end", marginBottom: 10 }}
          >
            <div style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 600 }}>
              {t.label}
              {t.invert ? " (plus bas = mieux)" : " (plus haut = mieux)"}
            </div>
            <Field label="Seuil bon (vert)">
              <Input type="number" value={t.good} onChange={(e) => updateTh(key, "good", e.target.value)} />
            </Field>
            <Field label="Seuil mauvais (rouge)">
              <Input type="number" value={t.bad} onChange={(e) => updateTh(key, "bad", e.target.value)} />
            </Field>
          </div>
        ))}
        <Btn
          variant="primary"
          onClick={() => {
            setThresholds(th);
            notify("Seuils de couleur enregistrés.");
          }}
          style={{ marginTop: 6 }}
        >
          <Check size={14} /> Enregistrer les seuils
        </Btn>
      </Collapsible>

      <Collapsible title="Export JSON" sub="Sauvegarde tes données — elles ne vivent que dans ce navigateur.">
        <Btn onClick={exportBackup}>
          <Download size={14} /> Exporter une sauvegarde complète
        </Btn>
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
            Efface les games, objectifs, historique, seuils et rang courant — garde la
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
