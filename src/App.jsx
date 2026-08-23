import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AddGame from "./pages/AddGame.jsx";
import ChampionsPage from "./pages/ChampionsPage.jsx";
import SessionsPage from "./pages/SessionsPage.jsx";
import CoachPage from "./pages/CoachPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import { useTrackerData } from "./hooks/useTrackerData.js";

const PAGES = {
  dashboard: Dashboard,
  add: AddGame,
  champions: ChampionsPage,
  sessions: SessionsPage,
  coach: CoachPage,
  settings: SettingsPage,
};

export default function App() {
  const { data, sorted, actions, loaded } = useTrackerData();
  const [page, setPage] = useState("dashboard");

  if (!loaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--dim)",
        }}
      >
        Chargement…
      </div>
    );
  }

  const Page = PAGES[page] || Dashboard;
  const pageProps = { data, sorted, currentRank: data.currentRank, navigate: setPage, ...actions };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex" }}>
      <Sidebar page={page} setPage={setPage} currentRank={data.currentRank} />
      <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", width: "100%" }}>
          <Page {...pageProps} />
        </div>
      </main>
    </div>
  );
}
