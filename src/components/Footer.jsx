/**
 * Mention légale obligatoire des Developer Policies de Riot Games ("post the following
 * legal boilerplate to your product in a location that is readily visible to players") +
 * liens vers les pages de confidentialité/conditions — nécessaires avant toute demande de
 * clé Production. Texte gardé en anglais : c'est le texte officiel exigé tel quel, une
 * traduction introduirait une ambiguïté sur un texte légal fixé par Riot.
 */
export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 48,
        paddingTop: 20,
        borderTop: "1px solid var(--border)",
        fontSize: 11.5,
        lineHeight: 1.6,
        color: "var(--dim)",
      }}
    >
      <div style={{ display: "flex", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
        {/* Chemins relatifs (pas "/lol-climb-tracker/...") : la page courante de la SPA est
            toujours la racine du site, que ce soit en dev (base "/") ou en prod (base
            "/lol-climb-tracker/") — voir vite.config.js. Un chemin absolu casserait en dev. */}
        <a href="privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: "var(--dim)" }}>
          Confidentialité
        </a>
        <a href="terms.html" target="_blank" rel="noopener noreferrer" style={{ color: "var(--dim)" }}>
          Conditions d'utilisation
        </a>
        <a
          href="https://github.com/RomainPitot/lol-climb-tracker"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--dim)" }}
        >
          Code source
        </a>
      </div>
      CLIMB.EUW isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone
      officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties
      are trademarks or registered trademarks of Riot Games, Inc.
    </footer>
  );
}
