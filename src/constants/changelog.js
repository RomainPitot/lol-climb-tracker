/**
 * Journal des nouveautés — maintenu à la main à chaque évolution notable de l'app (pas à
 * chaque commit : ça noierait ce qui compte vraiment pour l'utilisateur derrière du bruit
 * de refactoring). Le plus récent en premier. `id` sert à savoir si une entrée a déjà été
 * vue (voir Sidebar.jsx, settings.lastSeenChangelogId) — change-le si tu réécris une entrée
 * déjà publiée, jamais sinon.
 */
export const CHANGELOG = [
  {
    id: "2026-09-12-coaching",
    date: "2026-09-12",
    title: "Un coaching plus personnel",
    items: [
      "Nouveau : \"Ton signal n°1\", qui compare tes games gagnées et perdues — plus parlant qu'un repère générique qui ne connaît pas ton style de jeu.",
      "Nouveau : bouton \"Suivre ce point\" sur le Coach — démarre un correctif pré-rempli en un clic, sans ressaisir ce que l'app sait déjà.",
      "Point de focus et Correctifs fusionnés en un seul système — plus de doublon entre le Dashboard et Coach IA.",
    ],
  },
  {
    id: "2026-09-12-ingame",
    date: "2026-09-12",
    title: "Suivi de la partie en direct",
    items: [
      "Phone control affiche maintenant le chrono, les deux équipes (champion, niveau, KDA, CS, objets) et les objectifs pris, une fois en jeu.",
      "Nécessite GameDetectorLol v1.1.0 ou plus récent.",
    ],
  },
  {
    id: "2026-09-11-public",
    date: "2026-09-11",
    title: "Le site devient installable",
    items: [
      "Installable sur téléphone (icône d'accueil, ouvre directement Phone control).",
      "Export/import de sauvegarde de retour dans Paramètres.",
      "Champions, rôles et icônes se basent maintenant sur tes games réellement jouées, plus une liste figée à la main.",
      "GameDetectorLol (le companion PC) est maintenant une vraie application à installer, pas un script à lancer à la main.",
    ],
  },
];
