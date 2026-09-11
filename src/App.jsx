import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import RankUpCelebration from "./components/RankUpCelebration.jsx";
import NewGameRecapModal from "./components/NewGameRecapModal.jsx";
import AlertBanner from "./components/AlertBanner.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ChampionsPage from "./pages/ChampionsPage.jsx";
import TierlistPage from "./pages/TierlistPage.jsx";
import ChampSelectPage from "./pages/ChampSelectPage.jsx";
import CoachPage from "./pages/CoachPage.jsx";
import LearnPage from "./pages/LearnPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import { useTrackerData } from "./hooks/useTrackerData.js";
import { useAutoRiotImport } from "./hooks/useAutoRiotImport.js";
import { useGameDetectorAlerts } from "./hooks/useGameDetectorAlerts.js";
import { notifyGameEvent } from "./lib/notify.js";

const ALERT_DISPLAY_MS = 6000;

const PAGES = {
  dashboard: Dashboard,
  champions: ChampionsPage,
  tierlist: TierlistPage,
  champselect: ChampSelectPage,
  coach: CoachPage,
  learn: LearnPage,
  settings: SettingsPage,
};

export default function App() {
  const { data, sorted, actions, loaded } = useTrackerData();
  const [page, setPage] = useState("dashboard");

  // Tourne indépendamment de la page affichée (pas seulement quand Paramètres est monté) :
  // tant que ce site reste ouvert dans un onglet, voir useAutoRiotImport.js.
  useAutoRiotImport(data, actions);

  // Idem pour les alertes de jeu (ready check, chargement, en jeu) — voir
  // useGameDetectorAlerts.js. La bannière (AlertBanner) est le canal fiable ; la
  // notification navigateur (notifyGameEvent) est un bonus best-effort en plus.
  const [alert, setAlert] = useState(null);
  const alertTimer = useRef(null);
  const showAlert = useCallback((message) => {
    notifyGameEvent(message);
    setAlert({ message, id: Date.now() });
    clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setAlert(null), ALERT_DISPLAY_MS);
  }, []);
  useGameDetectorAlerts(data?.settings, setPage, showAlert);

  // Lien de "pairing" (QR code ou "Copier le lien" dans Paramètres, voir
  // GameDetectorSection.jsx) : configure l'adresse/le token du téléphone en un tap au lieu
  // de les faire ressaisir à la main, puis nettoie l'URL une fois consommé.
  useEffect(() => {
    if (!loaded) return;
    const params = new URLSearchParams(window.location.search);
    const host = params.get("champselect_host");
    const token = params.get("champselect_token");
    if (!host || !token) return;
    actions.setSettings({ gameDetectorHost: host, gameDetectorToken: token });
    setPage("champselect");
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url);
  }, [loaded, actions]);

  // "?page=..." : utilisé par le manifest PWA (start_url et le raccourci Dashboard, voir
  // vite.config.js) pour ouvrir directement la bonne page au lancement depuis l'icône
  // installée sur le téléphone — le host+token de pairing, eux, sont déjà en localStorage
  // depuis le premier scan, pas besoin de les repasser dans l'URL à chaque fois.
  useEffect(() => {
    if (!loaded) return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("page");
    if (!requested || !PAGES[requested]) return;
    setPage(requested);
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url);
  }, [loaded]);

  if (!loaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "var(--bg)",
          color: "var(--dim)",
        }}
      >
        <span className="spinner" style={{ width: 20, height: 20, color: "var(--gold)" }} />
        <span style={{ fontSize: 13 }}>Chargement de CLIMB.EUW…</span>
      </div>
    );
  }

  const Page = PAGES[page] || Dashboard;
  const pageProps = { data, sorted, currentRank: data.currentRank, navigate: setPage, ...actions };

  return (
    <div className="app-shell">
      <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />
      <Sidebar page={page} setPage={setPage} currentRank={data.currentRank} />
      {/* `key={page}` remonte le contenu à chaque changement d'onglet : l'animation
          d'entrée rejoue donc à chaque navigation, ce qui signale visuellement
          qu'on a changé de page (sinon le contenu se substitue sans transition). */}
      <main className="app-main">
        <div className="page-enter" key={page} style={{ maxWidth: 1440, margin: "0 auto", width: "100%" }}>
          <Page {...pageProps} />
        </div>
      </main>
      <RankUpCelebration
        currentRank={data.currentRank}
        settings={data.settings}
        setSettings={actions.setSettings}
      />
      <NewGameRecapModal
        data={data}
        sorted={sorted}
        currentRank={data.currentRank}
        setSettings={actions.setSettings}
      />
    </div>
  );
}
