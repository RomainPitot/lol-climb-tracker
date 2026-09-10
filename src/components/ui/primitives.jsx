import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUp, ArrowDown, Minus, ChevronDown, Inbox } from "lucide-react";

/**
 * Trois niveaux de surface au lieu d'un encadré unique répété partout :
 * - "raised" (défaut) : vraie carte, pour un bloc autonome de niveau 1/2.
 * - "flat" : fond légèrement décollé, sans bordure — pour un sous-groupe DANS
 *   une carte, là où une seconde bordure ne ferait qu'ajouter du bruit.
 * - "ghost" : ni fond ni bordure — quand seul l'espacement doit regrouper.
 * Un encadrement doit structurer l'information, pas décorer.
 */
export const Card = ({ children, className = "", variant = "raised", style = {} }) => (
  <div
    className={`surface-${variant} ${className}`}
    style={{ borderRadius: "var(--radius-lg)", ...style }}
  >
    {children}
  </div>
);

export const SectionTitle = ({ children, sub, action }) => (
  <div
    className="mb-6"
    style={{ display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}
  >
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", minWidth: 0 }}>
      <span
        aria-hidden
        style={{
          width: 4,
          borderRadius: 3,
          background: "linear-gradient(180deg, var(--gold), var(--gold-active))",
          alignSelf: "stretch",
          minHeight: 34,
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <h2
          style={{
            fontFamily: "var(--display)",
            fontSize: "var(--fs-2xl)",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: 0.2,
            lineHeight: "var(--lh-tight)",
          }}
        >
          {children}
        </h2>
        {sub && (
          <p className="prose" style={{ color: "var(--dim)", fontSize: "var(--fs-sm)", marginTop: 6 }}>
            {sub}
          </p>
        )}
      </div>
    </div>
    {action}
  </div>
);

/**
 * Groupe de contenu À L'INTÉRIEUR d'une page : un titre typographique et de
 * l'espace, plutôt qu'une carte de plus. C'est ce qui permet d'avoir plusieurs
 * niveaux de lecture sans empiler les encadrements.
 */
export const Section = ({ title, sub, action, children, className = "", style = {} }) => (
  <section className={className} style={{ marginBottom: "var(--sp-6)", ...style }}>
    {(title || action) && (
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--sp-3)",
          marginBottom: "var(--sp-3)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          {title && (
            <h3
              style={{
                fontFamily: "var(--display)",
                fontSize: "var(--fs-xl)",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: 0.2,
                lineHeight: "var(--lh-tight)",
              }}
            >
              {title}
            </h3>
          )}
          {sub && (
            <p className="prose" style={{ color: "var(--dim)", fontSize: "var(--fs-sm)", marginTop: 4 }}>
              {sub}
            </p>
          )}
        </div>
        {action}
      </header>
    )}
    {children}
  </section>
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
  // Séries en cours (victoires, bonnes games sur un objectif) — voir lib/streaks.js.
  fire: { bg: "rgba(255,120,40,0.16)", fg: "#FF8C28" },
};

export const Pill = ({ children, tone = "neutral", className, ...rest }) => {
  const t = PILL_TONES[tone] || PILL_TONES.neutral;
  return (
    <span
      // className séparé de {...rest} et fusionné explicitement : un {...rest} placé après
      // un className littéral écrase silencieusement ce dernier (spread JSX, dernière
      // valeur qui gagne) — sans ça, tout appelant passant sa propre className (ex: pour
      // l'effet "série en cours", voir flame-badge) perdait "tnum" plutôt que de l'ajouter.
      className={["tnum", className].filter(Boolean).join(" ")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: t.bg,
        color: t.fg,
        fontSize: "var(--fs-xs)",
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        lineHeight: 1.5,
      }}
      {...rest}
    >
      {children}
    </span>
  );
};

/**
 * Une stat n'a pas besoin d'une carte complète : le chiffre en display porte
 * déjà toute l'emphase. Surface plate + liseré de ton, sans bordure ni ombre —
 * une grille de 10 stats redevient lisible au lieu de 10 encadrés en compétition.
 */
export const StatCard = ({ label, value, sub, tone, icon: Icon }) => (
  <Card
    variant="flat"
    className="stat-card p-4"
    style={{ "--accent-color": tone || "var(--border)" }}
  >
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--sp-2)" }}>
      <div className="eyebrow" style={{ marginBottom: "var(--sp-2)" }}>
        {label}
      </div>
      {Icon && (
        <Icon size={15} color={tone || "var(--dim)"} style={{ opacity: 0.7, flexShrink: 0, marginTop: -1 }} />
      )}
    </div>
    <div
      className="tnum"
      style={{
        fontFamily: "var(--display)",
        fontSize: "var(--fs-2xl)",
        fontWeight: 700,
        color: tone || "var(--text)",
        lineHeight: "var(--lh-tight)",
      }}
    >
      {value}
    </div>
    {sub && <div style={{ fontSize: "var(--fs-xs)", color: "var(--dim)", marginTop: 5 }}>{sub}</div>}
  </Card>
);

export const Field = ({ label, children, required }) => (
  <label
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontSize: "var(--fs-sm)",
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
  fontSize: "var(--fs-sm)",
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

/**
 * Onglets d'une même page — pour une page qui empile plusieurs outils distincts
 * (Coach IA : bilans, correctifs, analyse) au lieu de tout dérouler verticalement.
 * Le trait actif est un vrai élément animé : il glisse d'un onglet à l'autre
 * plutôt que de clignoter d'une position à une autre.
 */
export function Tabs({ tabs, active, onChange, className = "" }) {
  return (
    <div
      role="tablist"
      className={className}
      style={{
        display: "flex",
        gap: "var(--sp-1)",
        borderBottom: "1px solid var(--border)",
        marginBottom: "var(--sp-5)",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className="tab-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-2)",
              padding: "var(--sp-3) var(--sp-4)",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${isActive ? "var(--gold)" : "transparent"}`,
              color: isActive ? "var(--gold)" : "var(--dim)",
              fontSize: "var(--fs-base)",
              fontWeight: isActive ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              marginBottom: -1,
              transition: "color var(--fast) var(--ease), border-color var(--fast) var(--ease)",
            }}
          >
            {Icon && <Icon size={15} />}
            {t.label}
            {t.badge != null && (
              <Pill tone={isActive ? "gold" : "neutral"} style={{ marginLeft: 2 }}>
                {t.badge}
              </Pill>
            )}
          </button>
        );
      })}
    </div>
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

export function Collapsible({ title, sub, defaultOpen = false, forceOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  // Ouverture à sens unique déclenchée depuis l'extérieur (ex: clic sur un rappel du
  // Dashboard qui doit ouvrir l'Historique, forcément replié par défaut, pour révéler la
  // modale qu'il contient) — ne revient jamais en arrière tout seul, l'utilisateur garde
  // le contrôle du repli une fois ouvert.
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);
  // Replié, un accordéon n'est qu'une ligne de titre : il ne prend la bordure et
  // le fond d'une vraie carte qu'une fois ouvert, quand il porte réellement du
  // contenu. Évite qu'une page aligne des encadrés vides de même poids que ses
  // blocs principaux.
  return (
    <Card
      variant={open ? "raised" : "flat"}
      className="mb-4"
      style={{ padding: 0, overflow: "hidden", transition: `background-color var(--fast) var(--ease)` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="row-hover"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "var(--sp-3) var(--sp-4)",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div style={{ textAlign: "left", minWidth: 0 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: open ? "var(--text)" : "var(--dim)" }}>
            {title}
          </div>
          {sub && (
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--dim)", marginTop: 3, lineHeight: "var(--lh-snug)" }}>
              {sub}
            </div>
          )}
        </div>
        <ChevronDown
          size={16}
          color="var(--dim)"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: `transform var(--med) var(--ease)`,
            flexShrink: 0,
            marginLeft: "var(--sp-3)",
          }}
        />
      </button>
      {open && (
        <div className="fade-in" style={{ padding: "0 var(--sp-4) var(--sp-4)" }}>
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
        fontSize: "var(--fs-sm)",
        textAlign: "center",
        padding: "0 16px",
      }}
    >
      <Icon size={22} strokeWidth={1.5} style={{ opacity: 0.6 }} />
      {label}
    </div>
  );
}
