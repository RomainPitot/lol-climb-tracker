/**
 * Contenu de la section Learn (voir pages/LearnPage.jsx) — premier jet rédigé par l'IA,
 * à relire/corriger : ce n'est pas dérivé de données Riot ni de l'historique du joueur,
 * c'est un contenu pédagogique générique qui peut se tromper ou être incomplet. Chaque
 * article est volontairement court (l'objectif est un mini-tuto qu'on lit en 2-3 minutes,
 * pas un guide exhaustif) et peut référencer un diagramme (voir components/learn/) ou une
 * vidéo (champ `video`, une URL YouTube à ajouter à la main — aucune n'est pré-remplie
 * pour ne pas inventer un lien qui n'existe pas).
 */
export const LEARN_ARTICLES = [
  {
    id: "wave-management",
    title: "Gestion de wave",
    tagline: "Freeze, slow push, fast push, crash — les 4 états d'une wave et quand les utiliser.",
    diagram: "wave",
    sections: [
      {
        heading: "Pourquoi ça compte",
        text: "La position de la wave sur la lane décide qui a l'avantage au trade, qui prend le risque en cas de gank, et où se trouve le CS gratuit. Un laner qui subit sa wave sans agir la laisse dériver au hasard — et perd du CS, de la sécurité ou du tempo selon le cas.",
      },
      {
        heading: "Les 4 états d'une wave",
        text: "Freeze : la wave stagne loin de ta tour, juste devant toi — tu forces l'adversaire à s'exposer pour la CS, ou à la laisser filer. Slow push : tu tues les melee minions en premier, laisses les caster minions s'accumuler — la wave grossit et pousse doucement vers l'adversaire. Fast push : tu tues tout dans l'ordre, la wave avance vite vers la tour adverse. Crash : la wave (souvent grossie par un slow push) percute la tour adverse — c'est le moment de recall ou de roam, la wave ne peut plus être punie pendant qu'elle tape la tour.",
      },
      {
        heading: "Quand utiliser quoi",
        text: "Freeze quand tu es en avance et veux priver l'adversaire de CS sans prendre de risque. Slow push quand tu prépares un all-in (la wave grossie force l'adversaire à choisir entre back off et se faire push, ou rester et se faire punir par le nombre de minions). Fast push/crash quand tu veux roamer ou recall sans perdre de CS ni laisser une wave exploitable par l'adversaire.",
      },
      {
        heading: "Erreurs fréquentes",
        text: "Taper les minions sans réfléchir à l'état que ça crée. Freeze trop près de sa propre tour (elle finit par se fast push toute seule, tirée par les tourelles). Partir roam avec une wave qui n'a pas encore crashé — elle traîne le temps que tu reviennes, et se fait manger par l'adversaire.",
      },
    ],
  },
  {
    id: "runes",
    title: "Choisir ses runes",
    tagline: "Lire un arbre de runes et adapter sa page au champion et au matchup, pas juste copier une build en ligne.",
    diagram: "runes",
    sections: [
      {
        heading: "La structure d'une page",
        text: "Une page de runes = un arbre primaire (4 slots, la rune clé + 3 runes mineures) et un arbre secondaire (2 runes parmi deux slots différents), plus des stat shards (attaque/vitesse d'attaque/adaptatif, puis vie/résistances). L'arbre primaire donne le plus gros impact — c'est lui qui définit l'identité de la build (scaling en dégâts, sustain, contrôle...).",
      },
      {
        heading: "Choisir en fonction du champion",
        text: "Un champion qui scale sur les items et les niveaux (ADC, la plupart des mid scaling) profite d'un arbre orienté dégâts continus (Precision) ou burst (Domination selon le kit). Un champion tank/frontline profite plus d'un arbre de sustain/résistances (Résolution). Un champion de peel/enchanteur profite d'un arbre de soin/protection (Sorcellerie) plutôt que de dégâts.",
      },
      {
        heading: "Adapter au matchup",
        text: "Contre un lane agressive early (poke, trades constants), une rune de sustain (heal/shield par trade) compense mieux qu'une rune purement scaling. Contre un lane qui scale plus vite que toi, une rune qui accélère ton propre power spike (dégâts bruts, tempo) vaut mieux qu'une rune défensive qui retarde juste l'inévitable.",
      },
      {
        heading: "Ne pas copier sans réfléchir",
        text: "Une build \"la plus jouée\" en ligne est optimisée pour le cas moyen, pas pour ton matchup précis ni ton style. Si un matchup est notoirement défensif pour toi (voir le plan de matchup dans Champions), ça vaut le coup de dévier de la build standard vers plus de sustain/résistances, même si c'est moins \"optimal\" sur le papier en late game.",
      },
    ],
  },
  {
    id: "vision",
    title: "Vision : wards et control wards",
    tagline: "Où et quand warder pour que la vision serve réellement à quelque chose, offensive ou défensive.",
    diagram: "vision",
    sections: [
      {
        heading: "Vision offensive vs défensive",
        text: "Une ward défensive protège TON territoire (bush de lane, entrée de jungle près de ta base) — elle prévient un gank ou une invade. Une ward offensive éclaire le territoire ADVERSE (bush côté ennemi, autour d'un objectif neutre avant qu'il pop) — elle prépare un play, pas juste une sécurité.",
      },
      {
        heading: "Les control wards",
        text: "Une control ward (ward violette) ne se contente pas de donner de la vision : elle détruit les wards ennemies dans son rayon et résiste à la détection classique. Elle vaut le coup près d'un objectif neutre juste avant qu'il pop (dragon/baron/herald), ou dans un bush stratégique qu'on veut garder aveugle pour l'adversaire sur la durée — son coût (75 or) se rentabilise vite si elle bloque plusieurs wards adverses.",
      },
      {
        heading: "Vision avant un objectif",
        text: "Prendre un objectif sans vision posée dans les minutes qui précèdent, c'est jouer à l'aveugle sur une contestation possible — un gank ou un all-in adverse peut punir lourdement une prise \"à découvert\". Une ward posée 2-3 minutes avant le spawn (ou avant que l'équipe s'engage vers l'objectif) donne le temps de voir venir une contre-attaque.",
      },
      {
        heading: "Erreur fréquente",
        text: "Warder toujours au même endroit par habitude plutôt que selon ce que la game demande — une ward mal placée qui ne sert à rien (zone déjà safe, zone que personne ne traverse) est un slot de vision gaspillé pour toute sa durée.",
      },
    ],
  },
  {
    id: "trades-allin",
    title: "Trades et all-in en lane",
    tagline: "Reconnaître un bon trade, savoir quand all-in, et gérer les cooldowns adverses plutôt que jouer au hasard.",
    diagram: "trades",
    sections: [
      {
        heading: "Qu'est-ce qu'un bon trade",
        text: "Un trade est gagnant si tu infliges plus de dégâts (ou de valeur : CS forcé, sort gaspillé côté adverse) que tu n'en reçois, à ressources égales. Un trade \"à l'aveugle\" sans regarder les cooldowns adverses n'est pas un trade, c'est un pari.",
      },
      {
        heading: "Lire les cooldowns adverses",
        text: "Le moment le plus sûr pour trader (ou all-in) est juste après que l'adversaire a utilisé un sort clé (son poke, son escape, son CC) — il est temporairement sans réponse. Compter mentalement quand l'adversaire a utilisé quoi (à quelle minute environ) permet de savoir quand il retrouve ses cooldowns et redevient dangereux.",
      },
      {
        heading: "Quand all-in",
        text: "All-in seulement quand au moins deux conditions sont réunies : avantage de niveau/items, cooldowns clés adverses absents, et — si le kit a un résumé défensif clé (Flash, un escape) — sa disponibilité déjà entamée ou clairement engagée ailleurs. Un all-in sans aucune de ces conditions repose entièrement sur la mécanique pure, ce qui n'est pas un plan fiable.",
      },
      {
        heading: "Erreur fréquente",
        text: "Trader par réflexe à chaque fois qu'un sort revient en cooldown, sans se demander si la position (proximité de la tour adverse, wave state) rend le trade suivant risqué. Un bon trade en plein milieu de lane peut devenir un mauvais trade collé à la tour adverse.",
      },
    ],
  },
  {
    id: "macro",
    title: "Macro : roams, objectifs, siège",
    tagline: "Quand quitter sa lane, comment prioriser un objectif, et gérer un siège de tour sans le gâcher.",
    diagram: "macro",
    sections: [
      {
        heading: "Quand roamer",
        text: "Un roam vaut le coup quand ta wave est en état crash/fast push (elle ne se punit pas pendant ton absence, voir Gestion de wave) ET que l'impact visé (un kill, un objectif pris ailleurs) vaut plus que le CS et le risque perdus en lane. Roamer avec une wave qui traîne au milieu de la lane, c'est perdre sur les deux tableaux.",
      },
      {
        heading: "Prioriser un objectif",
        text: "Entre deux objectifs disponibles, celui qui rapporte le plus dépend du moment de la game : early, un herald/des grubs qui accélèrent un push de tour valent souvent plus qu'un premier dragon isolé ; en milieu de partie, l'empilement de buffs de dragon (stacking) devient prioritaire si l'équipe adverse en a déjà pris un ou deux. Un objectif contesté sans avantage de nombre ou de vision est souvent à laisser filer plutôt qu'à forcer.",
      },
      {
        heading: "Gérer un siège de tour",
        text: "Une tour qui tape ne meurt vraiment que si elle est punie en continu (dégâts soutenus) — un siège qui s'arrête à mi-vie sans la faire tomber gaspille souvent plus de temps/ressources (sorts, summoners) que le gain obtenu. Avant de s'engager dans un siège, vérifier que l'équipe adverse ne peut pas contre-engager pendant que tout le monde est groupé sur la tour (vision autour, sorts d'engage adverses disponibles).",
      },
      {
        heading: "Erreur fréquente",
        text: "Forcer un objectif ou un siège \"parce que c'est le moment sur l'horloge\" sans vérifier l'état de vision ni les cooldowns d'engage adverses — une mort évitable pendant un objectif coûte souvent plus cher que l'objectif lui-même ne rapporte.",
      },
    ],
  },
  {
    id: "cs-efficiency",
    title: "CS efficace, y compris sous tourelle",
    tagline: "Last hit propre, minions sous tour, et pourquoi le CS/min compte plus que le nombre de kills.",
    cover: { icon: "Crosshair", color: "#F4845F" },
    sections: [
      {
        heading: "Pourquoi le CS/min plutôt que le CS total",
        text: "Le CS total dépend de la durée de la game — le CS/min est la seule mesure comparable entre deux games différentes (voir Dashboard, déjà calculé). Un CS/min stable et proche du repère de ton rôle vaut plus, en or gagné sur toute la partie, qu'une poignée de kills isolés.",
      },
      {
        heading: "Last hit sous tourelle",
        text: "Sous ta propre tour, ne tape un minion que quand la tourelle vient de le frapper et l'a mis à portée du dernier coup — sinon tu voles le CS de ta tourelle sans le récupérer plus vite. Anticiper les dégâts de la tourelle (elle tape toutes les ~0.85s les 3 premiers coups sur une cible, puis plus fort) permet de placer le dernier coup au bon moment plutôt qu'au hasard.",
      },
      {
        heading: "Erreur fréquente",
        text: "Se concentrer sur les échanges (trades, kill attempts) au point d'oublier plusieurs vagues de CS gratuit — un joueur qui rate 2-3 minions par vague sur toute une game perd largement plus d'or qu'un kill ne lui en rapporte.",
      },
    ],
  },
  {
    id: "map-awareness",
    title: "Map awareness et minimap",
    tagline: "Regarder la minimap régulièrement pour anticiper un gank, un roam adverse ou une ouverture à exploiter.",
    cover: { icon: "Map", color: "#5AC8FA" },
    sections: [
      {
        heading: "Pourquoi regarder la minimap change tout",
        text: "La plupart des morts \"surprises\" en lane viennent d'un jungler ou d'un roamer adverse simplement pas vu venir. Un coup d'œil régulier à la minimap (pas juste après une mort pour comprendre ce qui s'est passé) permet d'anticiper plutôt que de réagir.",
      },
      {
        heading: "Ce qu'il faut lire sur la minimap",
        text: "Les champions ennemis visibles (et surtout ceux qui manquent à l'appel — un jungler ou un mid absent de la vue est probablement en train de roam). Les pings alliés. Les icônes d'objectifs qui vont spawn. Une habitude simple : regarder la minimap à chaque fois qu'on tape un sort ou qu'on recall — deux moments où l'attention est déjà un peu libre.",
      },
      {
        heading: "Erreur fréquente",
        text: "Fixer son propre champion et sa barre de vie en permanence sans jamais lever les yeux vers la carte — c'est la cause la plus fréquente de morts qui paraissaient \"injustes\" mais étaient en réalité prévisibles.",
      },
    ],
  },
  {
    id: "teamfight-positioning",
    title: "Positionnement en teamfight",
    tagline: "Où se placer selon son rôle dans le fight, et pourquoi la plupart des morts en teamfight sont évitables.",
    cover: { icon: "Users", color: "#A970FF" },
    sections: [
      {
        heading: "Le principe général",
        text: "Un teamfight se gagne rarement sur les dégâts bruts d'un seul champion — il se gagne sur qui parvient à infliger des dégâts en restant en vie le plus longtemps. Le positionnement décide qui peut faire ça : rester à portée d'agir sans être à portée d'être puni.",
      },
      {
        heading: "Selon ton rôle dans le fight",
        text: "Un carry (ADC, mid scaling) reste en périphérie, hors de portée des engages adverses, et n'avance que quand la menace immédiate (tank/engage adverse) est neutralisée ou occupée. Un frontline/tank se place devant, entre son équipe et la menace, pour absorber l'engage plutôt que le subir de dos. Un support/peel reste proche de son carry, prêt à intervenir sur un dive plutôt qu'à initier lui-même.",
      },
      {
        heading: "Erreur fréquente",
        text: "Avancer dès que sa barre de vie/mana le permet plutôt que selon la position réelle de la menace — mourir en avance de 2 secondes sur son équipe transforme souvent un fight gagnable en fight perdu (4v5 le temps de mourir).",
      },
    ],
  },
  {
    id: "shotcalling",
    title: "Shotcalling et priorité d'objectifs",
    tagline: "Décider quoi faire à l'échelle de l'équipe — pas juste de sa propre lane — et communiquer la décision.",
    cover: { icon: "Flag", color: "#0FD68A" },
    sections: [
      {
        heading: "Penser à l'échelle de l'équipe",
        text: "Une bonne décision individuelle (un trade gagné, un objectif pris seul) peut être une mauvaise décision d'équipe si elle laisse un autre lane exposé ou ignore un objectif plus urgent ailleurs. Le shotcalling, c'est se demander \"qu'est-ce qui fait avancer l'équipe entière\", pas juste sa propre lane.",
      },
      {
        heading: "Comment décider une priorité",
        text: "Comparer explicitement les options disponibles (objectif A vs B, split vs grouper, push vs defend) selon ce que chaque camp a comme ressources up (sorts, ultimates, summoners) — l'équipe avec le plus de ressources dispo a l'avantage sur un engagement, peu importe qui \"devrait\" gagner sur le papier.",
      },
      {
        heading: "Comment communiquer la décision",
        text: "Une info courte et actionnable (\"on groupe bot, dragon dans 30s\") vaut infiniment plus qu'un ping frénétique sans contexte. Le but n'est pas d'avoir raison seul dans le chat, mais que l'équipe agisse ensemble à temps.",
      },
    ],
  },
  {
    id: "itemization-adapt",
    title: "Adapter son build en cours de partie",
    tagline: "Lire la comp adverse et son propre état de game pour dévier de la build \"standard\" au bon moment.",
    cover: { icon: "Package", color: "#FFD166" },
    sections: [
      {
        heading: "Pourquoi dévier de la build standard",
        text: "Une build \"optimale\" en ligne suppose une game moyenne. Ta game réelle a une comp adverse précise (beaucoup de tank ? beaucoup de burst ? un carry fixe qui te punit ?) et un état précis (en avance, en retard, ahead en items) — la build qui maximise tes chances de gagner CETTE game peut différer de la build théorique.",
      },
      {
        heading: "Lire la comp adverse",
        text: "Beaucoup de résistances en face → un item de pénétration d'armure/magique ou %HP damage devient prioritaire. Beaucoup de burst/CC en face → un item défensif (résistances, un actif défensif) avant de continuer le scaling en dégâts. Un carry fixe qui domine la game adverse → un item de contre (anti-heal, anti-shield, ou tanky selon le cas) plutôt que de pure continuer sa propre build.",
      },
      {
        heading: "Erreur fréquente",
        text: "Suivre sa build planifiée à l'avance sans jamais la reconsidérer une fois la game en cours — une build figée ignore les informations (comp, état de game) qui n'existaient pas encore avant le début de la partie.",
      },
    ],
  },
  {
    id: "tilt-management",
    title: "Gérer le tilt et le mental",
    tagline: "Reconnaître le tilt avant qu'il coûte plusieurs games, et savoir quand s'arrêter.",
    cover: { icon: "Brain", color: "#F72585" },
    sections: [
      {
        heading: "Ce qu'est vraiment le tilt",
        text: "Le tilt n'est pas juste \"être énervé\" — c'est une prise de décision dégradée sous frustration : trades plus agressifs que d'habitude, all-in sans vérifier les cooldowns, refus de recall à temps. Le problème n'est pas l'émotion elle-même, mais son effet sur les décisions.",
      },
      {
        heading: "Les signaux à reconnaître",
        text: "Envie de \"punir\" un adversaire ou un allié plutôt que de jouer la game optimale. Sensation d'urgence à regagner immédiatement après une défaite frustrante. Une série de défaites qui s'enchaîne avec un LP moyen qui se dégrade (voir la bannière de série négative sur le Dashboard, déjà en place pour repérer ça objectivement).",
      },
      {
        heading: "Quoi faire",
        text: "Une pause courte (5-10 minutes, pas nécessairement arrêter la session) suffit souvent à casser la spirale. Se fixer une règle à l'avance (\"j'arrête après 3 défaites d'affilée\") retire la décision au moment où elle est justement la moins fiable à prendre.",
      },
    ],
  },
  {
    id: "champion-pool",
    title: "Construire sa pool de champions",
    tagline: "Spécialisation vs polyvalence — combien de champions maîtriser, et pourquoi une pool trop large ralentit la progression.",
    cover: { icon: "Layers", color: "#2EC4B6" },
    sections: [
      {
        heading: "Le compromis spécialisation vs polyvalence",
        text: "Un joueur qui maîtrise 2-3 champions en profondeur (matchups connus, timings, builds) progresse généralement plus vite qu'un joueur qui en joue 8-10 superficiellement — chaque game sur un champion connu génère plus d'apprentissage exploitable que sur un champion nouveau.",
      },
      {
        heading: "Quand élargir sa pool",
        text: "Élargir a du sens pour couvrir un besoin précis : un champion de secours si ton main est banni/contré à haut niveau, ou un profil différent (poke vs engage, par exemple) pour s'adapter à des metas différentes. Élargir \"pour varier\" sans raison stratégique dilue l'apprentissage sans bénéfice clair.",
      },
      {
        heading: "Comment progresser sur un champion",
        text: "Rejouer le même champion plusieurs games de suite (voir le Point de focus du Dashboard) permet de comparer directement une game à la précédente sur les mêmes repères — un luxe qu'on n'a pas en changeant de champion à chaque game.",
      },
    ],
  },
  {
    id: "vod-review",
    title: "Revoir ses games (VOD review)",
    tagline: "La méthode la plus efficace pour progresser — comment s'y prendre sans y passer des heures.",
    cover: { icon: "Video", color: "#FF6B6B" },
    sections: [
      {
        heading: "Pourquoi c'est l'outil le plus efficace",
        text: "Les stats disent QUOI (CS bas, mort précoce) mais jamais POURQUOI. Revoir la game (ou au moins un moment précis, mort par mort) est le seul moyen de voir la vraie cause : mauvaise vision, mauvais timing de cooldown adverse, ou simplement une erreur mécanique.",
      },
      {
        heading: "Comment s'y prendre sans y passer des heures",
        text: "Pas besoin de revoir la game entière : cibler 2-3 moments précis identifiés à froid (une mort qui a coûté cher, un objectif perdu, une décision de roam) suffit largement. Noter ce qu'on a compris tout de suite après (voir le champ VOD/note par mort dans l'analyse de game) — la mémoire de \"ce qui s'est vraiment passé\" se dégrade vite après la game.",
      },
      {
        heading: "Ce qu'il faut chercher",
        text: "Pas seulement \"qu'est-ce que j'ai fait de mal\" mais aussi \"qu'est-ce que je n'ai pas vu\" (positionnement adverse, timer d'objectif, ward manquante) — beaucoup d'erreurs viennent d'un manque d'information plutôt que d'une mauvaise décision avec la bonne information.",
      },
    ],
  },
  {
    id: "tracking-summoners",
    title: "Tracker les sorts d'invocateur adverses",
    tagline: "Savoir quand l'adversaire a utilisé Flash/Ignite/Exhaust change directement ce qui est risqué ou sûr.",
    cover: { icon: "Timer", color: "#4CC9F0" },
    sections: [
      {
        heading: "Pourquoi ça change tout",
        text: "Un all-in ou un gank est radicalement plus sûr si l'adversaire a déjà utilisé son Flash (ou un autre sort défensif clé) dans les minutes précédentes — il n'a plus d'échappatoire immédiate. À l'inverse, engager sans savoir si le Flash est disponible revient à ignorer l'information la plus utile qui existe sur un cooldown adverse.",
      },
      {
        heading: "Comment tracker sans y penser en permanence",
        text: "Noter mentalement (ou dans le tag manuel \"Flash disponible\" de l'analyse de game, pour au moins se souvenir après coup) le moment où un adversaire utilise Flash pour esquiver un sort, s'échapper d'un gank, ou traverser un mur. 5 minutes de cooldown de base (plus long avec certaines runes) donne une fenêtre approximative où il reste vulnérable.",
      },
      {
        heading: "Erreur fréquente",
        text: "Se souvenir seulement du Flash utilisé par SA cible directe, en oubliant les autres ennemis à proximité qui pourraient contre-engager pendant l'action — le Flash qui compte n'est pas toujours celui du champion qu'on regarde.",
      },
    ],
  },
  {
    id: "splitpush",
    title: "Split push : quand et comment",
    tagline: "Pousser seul une side lane peut forcer une décision adverse — mais seulement dans les bonnes conditions.",
    cover: { icon: "ArrowRightLeft", color: "#FFB347" },
    sections: [
      {
        heading: "Le principe",
        text: "Un split push force l'adversaire à un dilemme : envoyer quelqu'un s'en occuper (affaiblissant son propre groupe) ou laisser une tour/inhibiteur tomber. Ça ne vaut le coup que si ton équipe peut gérer un 4v5 ailleurs pendant ce temps, ou si le champion qui splitte peut survivre à une réponse à 2 adverses.",
      },
      {
        heading: "Quand splitter",
        text: "Un champion tanky ou avec un bon 1v1/duel de tour (dégâts soutenus, capacité à survivre à un dive à 2) splitte mieux qu'un carry fragile qui meurt dès qu'on lui envoie deux ennemis. Splitter est plus fort quand ton équipe a la vision/priorité pour éviter un 4v5 surprise pendant ton absence.",
      },
      {
        heading: "Erreur fréquente",
        text: "Splitter sans vision de ce qui se passe sur le reste de la carte — un split qui isole son équipe dans un fight perdu à 4 vaut largement moins que la tour qu'il fait tomber en échange.",
      },
    ],
  },
  {
    id: "jungle-pathing",
    title: "Pathing jungle : les bases",
    tagline: "Prioriser ses camps early, lire où ganker, et pourquoi le premier clear décide souvent du reste de la game.",
    cover: { icon: "Compass", color: "#06D6A0" },
    sections: [
      {
        heading: "Pourquoi le premier clear compte autant",
        text: "Le pathing du tout début de game décide du niveau, du timing de premier gank et du contrôle de la jungle adverse — un retard sur ce premier clear se répercute sur toute l'early game (moins de présence, ganks plus tardifs, moins de contrôle des buffs).",
      },
      {
        heading: "Prioriser les camps",
        text: "L'ordre dépend du champion (certains veulent le buff dès que possible pour un premier gank fort, d'autres préfèrent enchaîner le clear le plus efficace en XP/or) et de la composition adverse (une lane qui peut se défendre seule libère du temps pour un chemin plus long ou une invade).",
      },
      {
        heading: "Où et quand ganker",
        text: "Un gank vaut le coup quand la lane visée a une ouverture réelle (adversaire poussé trop loin, sans vision, cooldowns clés absents) — ganker \"pour ganker\" sans lecture de la situation gaspille du temps de jungle sans garantie de résultat.",
      },
    ],
  },
  {
    id: "comms-pinging",
    title: "Pings et communication efficace",
    tagline: "Communiquer vite et utile sans spam — ce qui aide vraiment une équipe à décider ensemble.",
    cover: { icon: "MessageSquare", color: "#7BDFF2" },
    sections: [
      {
        heading: "Le ping utile vs le ping frustration",
        text: "Un ping (danger, on-my-way, assist me) donne une information claire et actionnable en une fraction de seconde. Spammer un ping après une mort ou une erreur d'un allié ne change rien à la situation et dégrade l'ambiance — à séparer clairement de la communication utile.",
      },
      {
        heading: "Quand communiquer",
        text: "Avant l'action plutôt qu'après : prévenir d'un danger vu sur la minimap, annoncer une intention (\"je roam bot\", \"dragon dans 30s\") pendant qu'il est encore temps d'agir en équipe. Une info qui arrive après le fait accompli n'aide plus personne.",
      },
      {
        heading: "Erreur fréquente",
        text: "Confondre \"communiquer beaucoup\" et \"communiquer utile\" — une équipe qui reçoit un flot constant de pings finit par les ignorer tous, y compris les importants.",
      },
    ],
  },
];
