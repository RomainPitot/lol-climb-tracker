import { useState } from "react";
import { Bell, Swords, Settings as SettingsIcon } from "lucide-react";
import { NAV } from "../constants/nav.js";
import { CHANGELOG } from "../constants/changelog.js";
import RankBadge from "./RankBadge.jsx";
import ChangelogPanel from "./ChangelogPanel.jsx";

export default function Sidebar({ page, setPage, currentRank, settings, setSettings }) {
  const [showChangelog, setShowChangelog] = useState(false);
  const hasUnseenChangelog = CHANGELOG.length > 0 && settings?.lastSeenChangelogId !== CHANGELOG[0].id;

  const openChangelog = () => {
    setShowChangelog(true);
    setSettings?.({ lastSeenChangelogId: CHANGELOG[0]?.id });
  };

  return (
    <aside className="app-sidebar">
      <div
        className="app-sidebar-brand"
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 26px" }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(155deg, var(--yone), var(--tahm))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 16px rgba(169,112,255,0.35)",
          }}
        >
          <Swords size={19} color="#0A0D13" strokeWidth={2.25} />
        </div>
        <div
          className="app-sidebar-brand-word"
          style={{
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: 19,
            color: "var(--text)",
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
          }}
        >
          CLIMB.EUW
        </div>
      </div>

      <nav className="app-sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              aria-current={active ? "page" : undefined}
              className={`app-sidebar-nav-item ${active ? "" : "row-hover"}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                ...(active ? { background: "rgba(212,175,55,0.14)" } : {}),
                color: active ? "var(--gold)" : "var(--dim)",
                border: "none",
                cursor: "pointer",
                fontSize: 13.5,
                fontWeight: active ? 700 : 500,
                textAlign: "left",
                width: "100%",
              }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span className="app-sidebar-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Rang + accès aux Paramètres : la roue crantée reste discrète à côté du rang plutôt
          que de peser comme un onglet à part entière dans la navigation. */}
      {/* La mise en page vit dans le CSS (et non en style inline) : sur mobile, la
          media query doit pouvoir masquer le rang tout en gardant la roue crantée,
          seul accès aux Paramètres depuis qu'ils ne sont plus un onglet. */}
      <div className="app-sidebar-rank">
        <div className="app-sidebar-rank-badge">
          <RankBadge tier={currentRank.tier} div={currentRank.div} lp={currentRank.lp} size="sm" />
        </div>
        <button
          onClick={openChangelog}
          aria-label="Nouveautés"
          title="Nouveautés"
          className="icon-btn"
          style={{ flexShrink: 0, padding: 8, position: "relative", color: "var(--dim)" }}
        >
          <Bell size={17} />
          {hasUnseenChangelog && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--gold)",
                border: "1.5px solid var(--card)",
              }}
            />
          )}
        </button>
        <button
          onClick={() => setPage("settings")}
          aria-label="Paramètres"
          aria-current={page === "settings" ? "page" : undefined}
          title="Paramètres"
          className="icon-btn"
          style={{
            flexShrink: 0,
            padding: 8,
            color: page === "settings" ? "var(--gold)" : "var(--dim)",
            background: page === "settings" ? "rgba(212,175,55,0.14)" : "transparent",
          }}
        >
          <SettingsIcon size={17} />
        </button>
      </div>

      {showChangelog && <ChangelogPanel onClose={() => setShowChangelog(false)} />}
    </aside>
  );
}
