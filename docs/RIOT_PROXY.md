# Import automatique via l'API Riot

## Pourquoi un proxy ?

Deux blocages empêchent d'appeler l'API Riot directement depuis la page :

1. **CORS** — les serveurs Riot ne renvoient pas d'en-tête autorisant un navigateur à lire la réponse. La requête part, mais le navigateur refuse d'en donner le contenu à la page.
2. **La clé API** — tout ce qui est dans le JavaScript d'une page est lisible par n'importe qui. Une clé placée là est une clé publiée.

Un proxy résout les deux : il tourne côté serveur (pas de CORS pour lui), garde la clé dans ses secrets, et n'expose à la page qu'un point d'entrée protégé par un token.

L'app fonctionne très bien **sans** proxy — la saisie manuelle et l'import CSV couvrent tout. Le proxy ne fait qu'automatiser la récupération des games.

## Déployer le Worker (Cloudflare, gratuit)

1. Crée un compte sur [dash.cloudflare.com](https://dash.cloudflare.com), puis **Workers & Pages → Create Worker**.
2. Remplace le code par défaut par le contenu de [`worker/worker.js`](../worker/worker.js), et **Deploy**.
3. Dans **Settings → Variables and Secrets** du Worker, ajoute deux *secrets* (pas des variables en clair) :

   | Nom | Valeur |
   | --- | --- |
   | `RIOT_API_KEY` | ta clé sur [developer.riotgames.com](https://developer.riotgames.com) |
   | `PROXY_TOKEN` | une chaîne aléatoire que tu inventes (ex: sortie de `openssl rand -hex 24`) |

4. Note l'URL du Worker (`https://<nom>.<toncompte>.workers.dev`).
5. Dans l'app : **Ajouter une game**, mode *Via mon proxy*, colle l'URL et le token, renseigne ton Riot ID et ta région, puis lance la récupération.

## Points d'attention

- **Une clé de développement Riot expire toutes les 24h** — il faut la régénérer et mettre à jour le secret `RIOT_API_KEY` du Worker à la main à chaque fois. Demande plutôt une [**Personal API Key**](https://developer.riotgames.com) (gratuite, pour un usage perso comme celui-ci, via *Register Product* une fois connecté) : elle n'expire pas, un seul copier-coller dans le secret du Worker et c'est réglé pour de bon.
- **Le `PROXY_TOKEN` n'est pas un secret fort** : il est visible dans les requêtes du navigateur si quelqu'un a accès à ta machine. Il sert à empêcher un inconnu de consommer ton quota Riot, pas à protéger des données sensibles.
- **Le Worker ne relaie que vers `*.api.riotgames.com`** — cette vérification est ce qui l'empêche d'être utilisé comme proxy ouvert. Ne la retire pas.
- **Le gain/perte de LP n'existe pas dans l'API Riot.** L'app en *estime* un (voir ci-dessous) plutôt que de mettre `lpChange = 0` — de plus en plus rarement une estimation à mesure que l'auto-import tourne, mais reste à corriger à la main depuis l'historique si tu connais la vraie valeur.

## Précision du LP par game

Riot ne fournit jamais le LP gagné/perdu par game, seulement le résultat (victoire/défaite) et, séparément, ton rang *actuel*. L'app reconstruit un LP par game à partir de ça, avec une précision qui dépend de la fréquence des vérifications :

- Chaque vérification de rang (manuelle ou via l'auto-import, même sans nouvelle game trouvée) est conservée dans un historique (`rankHistory`).
- Une game qui se termine dans un intervalle où **aucune autre** ne se termine a un LP **exact** : la différence entre les deux vérifications qui l'entourent EST son gain/perte, sans hypothèse.
- Seules les games regroupées dans un même intervalle (plusieurs games jouées entre deux vérifications) retombent sur un modèle approximatif — victoires et défaites supposées symétriques (`+x`/`-x`) — et seulement pour ce sous-groupe, pas tout le lot importé.

Plus l'intervalle de vérification automatique est court par rapport à ta cadence de jeu, plus les intervalles ne contiennent qu'une seule game, plus le LP devient exact. Un gros lot importé « à froid » (après plusieurs jours sans avoir ouvert l'app) reste approximatif : personne n'a vérifié ton rang entre les games, cette donnée n'a jamais existé et rien ne peut la reconstruire après coup.

Chaque valeur estimée est marquée **≈** dans l'historique (survole pour le détail) et n'est plus considérée comme une estimation dès que tu la corriges à la main via **Modifier**.

## Vérification automatique

L'app peut vérifier elle-même, à intervalle régulier et **tant que l'onglet reste ouvert**, si de nouvelles games sont disponibles — **Ajouter une game → Vérifier automatiquement**, avec un intervalle réglable (5 min par défaut). Ce n'est pas un service en arrière-plan : fermer l'onglet arrête les vérifications, et les games jouées pendant ce temps retombent dans le cas « lot importé à froid » ci-dessus à la réouverture.

## Que fait l'app avec l'API

Trois endpoints, en lecture seule :

| Endpoint | Usage |
| --- | --- |
| `account/v1/accounts/by-riot-id/...` | résoudre ton Riot ID en PUUID |
| `match/v5/matches/by-puuid/{puuid}/ids?queue=420` | lister les IDs de tes dernières SoloQ |
| `match/v5/matches/{matchId}` | détail de chaque game non encore importée |
| `league/v4/entries/by-puuid/{puuid}` | resynchroniser ton rang actuel (optionnel) |

Les matchs déjà en base sont filtrés par `matchId` avant appel : relancer une récupération ne re-télécharge que le nouveau.

## Coach IA

Le bilan de compte, le bilan de fin de game et les conseils de bans/matchups (Sélection
de champion) fonctionnent en **copier-coller**, exactement comme le recap Coach IA
d'origine : le bouton prépare un texte structuré et l'affiche prêt à copier — tu le
colles dans Claude, ChatGPT ou l'IA de ton choix. Aucune clé API, aucun coût, rien à
configurer côté Worker : ça utilise l'abonnement que tu as déjà pour discuter avec ton
IA, pas une intégration payante à l'usage.
