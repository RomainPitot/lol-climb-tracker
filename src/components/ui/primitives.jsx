import { useState } from "react";
import { AlertTriangle, ArrowUp, ArrowDown, Minus, ChevronDown, Inbox } from "lucide-react";

export const Card = ({ children, className = "", style = {} }) => (
  <div
    className={`rounded-xl ${className}`}
    style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-sm)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const SectionTitle = ({ children, sub }) => (
  <div className="mb-4">
    <h2
      style={{
        fontFamily: "var(--display)",
        fontSize: 23,
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: 0.3,
        lineHeight: 1.2,
      }}
    >
      {children}
    </h2>
    {sub && <p style={{ color: "var(--dim)", fontSize: 13, marginTop: 4, maxWidth: 640, lineHeight: 1.5 }}>{sub}</p>}
  </div>
);

/** Petit libellé discret en majuscules (SITUATION ACTUELLE, OBLIGATOIRE…) — un seul
 * endroit pour ce style plutôt qu'un objet `style` recopié à la main partout. */
export const Eyebrow = ({ children, color, style = {} }) => (
  <div className="eyebrow" style={{ color: color || "var(--dim)", ...style }}>
    {children}
  </div>
);

const PILL_TONES = {
  neutral: { bg: "rgba(139,147,167,0.12)", fg: "var(--dim)" },
  win: { bg: "rgba(15,214,138,0.14)", fg: "var(--win)" },
  loss: { bg: "rgba(255,92,92,0.14)", fg: "var(--loss)" },
  gold: { bg: "rgba(212,175,55,0.14)", fg: "var(--gold)" },
};

export const Pill = ({ children, tone = "neutral" }) => {
  const t = PILL_TONES[tone] || PILL_TONES.neutral;
  return (
    <span
      className="tnum"
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: t.bg,
        color: t.fg,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        lineHeight: 1.5,
      }}
    >
      {children}
    </span>
  );
};

export const StatCard = ({ label, value, sub, tone }) => (
  <Card className="p-4">
    <div className="eyebrow" style={{ marginBottom: 8 }}>
      {label}
    </div>
    <div
      className="tnum"
      style={{
        fontFamily: "var(--display)",
        fontSize: 26,
        fontWeight: 700,
        color: tone || "var(--text)",
        lineHeight: 1.15,
      }}
    >
      {value}
    </div>
    {sub && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>{sub}</div>}
  </Card>
);

export const Field = ({ label, children, required }) => (
  <label
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontSize: 12,
      color: "var(--dim)",
      fontWeight: 500,
    }}
  >
    <span>
      {label}
      {required && <span style={{ color: "var(--loss)" }}> *</span>}
    </span>
    {children}
  </label>
);

const inputStyle = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  paddingTop: 9,
  paddingBottom: 9,
  paddingLeft: 10,
  paddingRight: 10,
  color: "var(--text)",
  fontSize: 13,
  outline: "none",
  width: "100%",
};

export const Input = ({ style, className = "", ...props }) => (
  <input className={`field-input ${className}`} {...props} style={{ ...inputStyle, ...style }} />
);

export const Select = ({ children, style, className = "", ...props }) => (
  <select className={`field-input ${className}`} {...props} style={{ ...inputStyle, cursor: "pointer", ...style }}>
    {children}
  </select>
);

export const TextArea = ({ style, className = "", ...props }) => (
  <textarea
    className={`field-input ${className}`}
    {...props}
    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5, ...style }}
  />
);

const BTN_CLASS = { primary: "btn-primary", ghost: "btn-ghost", danger: "btn-danger" };

export const Btn = ({ children, onClick, variant = "ghost", style = {}, type = "button", disabled, className = "" }) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`btn ${BTN_CLASS[variant] || BTN_CLASS.ghost} ${className}`}
    style={style}
  >
    {children}
  </button>
);

/** Bouton icône seul (éditer/supprimer, fermer une modale…). */
export function IconBtn({ children, onClick, className = "", style = {}, ...props }) {
  return (
    <button type="button" onClick={onClick} className={`icon-btn ${className}`} style={style} {...props}>
      {children}
    </button>
  );
}

/** Chip bascule pour les groupes de boutons "segmentés" (rôle, période, preset…) —
 * un seul composant pour un rendu identique partout où ce motif apparaît. */
export function ToggleChip({ active, disabled, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`chip ${active ? "chip-active" : ""}`}
    >
      {children}
    </button>
  );
}

/** Petit rond tournant, pour les boutons en cours d'action asynchrone. */
export function Spinner({ size = 14 }) {
  return <span className="spinner" style={{ width: size, height: size }} />;
}

/** Avertit quand une stat repose sur trop peu de games pour être significative. */
export function LowSample({ n, min = 10 }) {
  if (n >= min) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        color: "var(--gold)",
        background: "rgba(212,175,55,0.1)",
        padding: "4px 8px",
        borderRadius: "var(--radius-sm)",
        marginTop: 4,
      }}
    >
      <AlertTriangle size={12} /> Échantillon faible ({n} games) — interprétation prudente.
    </div>
  );
}

/** Delta signé avec flèche. `invert` = une baisse est une bonne nouvelle. */
export function Trend({ value, suffix = "", invert = false, decimals = 1 }) {
  if (value === null || value === undefined || !isFinite(value)) {
    return <span style={{ color: "var(--dim)" }}>—</span>;
  }
  const flat = Math.abs(value) < 0.05;
  const good = invert ? value < 0 : value > 0;
  const color = flat ? "var(--dim)" : good ? "var(--win)" : "var(--loss)";
  const Icon = flat ? Minus : value > 0 ? ArrowUp : ArrowDown;

  return (
    <span
      className="tnum"
      style={{ color, display: "inline-flex", alignItems: "center", gap: 2, fontWeight: 600, fontSize: 12 }}
    >
      <Icon size={12} />
      {Math.abs(value).toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function Collapsible({ title, sub, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="mb-4" style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="row-hover"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "15px 18px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
        </div>
        <ChevronDown
          size={16}
          color="var(--dim)"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: `transform ${"var(--fast)"} var(--ease)`,
            flexShrink: 0,
            marginLeft: 12,
          }}
        />
      </button>
      {open && (
        <div className="fade-in" style={{ padding: "0 18px 18px" }}>
          {children}
        </div>
      )}
    </Card>
  );
}

/** État vide générique — icône discrète + message, pour qu'une liste sans donnée se lise
 * comme un état normal de l'app plutôt que comme un graphique cassé. */
export function EmptyChart({ label, icon: Icon = Inbox, height = 160 }) {
  return (
    <div
      style={{
        minHeight: height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: "var(--dim)",
        fontSize: 13,
        textAlign: "center",
        padding: "0 16px",
      }}
    >
      <Icon size={22} strokeWidth={1.5} style={{ opacity: 0.6 }} />
      {label}
    </div>
  );
}
