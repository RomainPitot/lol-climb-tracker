import { Swords } from "lucide-react";
import { NAV } from "../constants/nav.js";
import RankBadge from "./RankBadge.jsx";

export default function Sidebar({ page, setPage, currentRank }) {
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

      <div
        className="app-sidebar-rank"
        style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid var(--border)" }}
      >
        <RankBadge tier={currentRank.tier} div={currentRank.div} lp={currentRank.lp} size="sm" />
      </div>
    </aside>
  );
}
