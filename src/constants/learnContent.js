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
];
