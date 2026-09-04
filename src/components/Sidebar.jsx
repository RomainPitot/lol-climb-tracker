import { Swords } from "lucide-react";
import { NAV } from "../constants/nav.js";
import RankBadge from "./RankBadge.jsx";

export default function Sidebar({ page, setPage, currentRank }) {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-brand" style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px" }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(155deg, var(--yone), var(--tahm))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Swords size={16} color="#0A0D13" />
        </div>
        <div
          style={{
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: 17,
            color: "var(--text)",
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
          }}
        >
          CLIMB.EUW
        </div>
      </div>

      <nav className="app-sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              aria-current={active ? "page" : undefined}
              className="app-sidebar-nav-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: "var(--radius-md)",
                background: active ? "rgba(212,175,55,0.12)" : "transparent",
                color: active ? "var(--gold)" : "var(--dim)",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                textAlign: "left",
                width: "100%",
                transition: "background-color var(--fast) var(--ease), color var(--fast) var(--ease)",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "var(--bg)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              <span className="app-sidebar-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        className="app-sidebar-rank"
        style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)" }}
      >
        <RankBadge tier={currentRank.tier} div={currentRank.div} lp={currentRank.lp} size="sm" />
      </div>
    </aside>
  );
}
