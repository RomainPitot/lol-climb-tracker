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
5. Dans l'app : **Paramètres → Import automatique (Riot API)**, mode *Via mon proxy*, colle l'URL et le token, renseigne ton Riot ID et ta région, puis lance la récupération.

## Points d'attention

- **Une clé de développement Riot expire toutes les 24h.** Il faut la régénérer et mettre à jour le secret `RIOT_API_KEY` du Worker. Pour un usage durable, demande une *Personal API Key* à Riot.
- **Le `PROXY_TOKEN` n'est pas un secret fort** : il est visible dans les requêtes du navigateur si quelqu'un a accès à ta machine. Il sert à empêcher un inconnu de consommer ton quota Riot, pas à protéger des données sensibles.
- **Le Worker ne relaie que vers `*.api.riotgames.com`** — cette vérification est ce qui l'empêche d'être utilisé comme proxy ouvert. Ne la retire pas.
- **Le gain/perte de LP n'existe pas dans l'API Riot.** Les games importées ont `lpChange = 0` et doivent être corrigées à la main depuis l'historique.

## Que fait l'app avec l'API

Trois endpoints, en lecture seule :

| Endpoint | Usage |
| --- | --- |
| `account/v1/accounts/by-riot-id/...` | résoudre ton Riot ID en PUUID |
| `match/v5/matches/by-puuid/{puuid}/ids?queue=420` | lister les IDs de tes dernières SoloQ |
| `match/v5/matches/{matchId}` | détail de chaque game non encore importée |
| `league/v4/entries/by-puuid/{puuid}` | resynchroniser ton rang actuel (optionnel) |

Les matchs déjà en base sont filtrés par `matchId` avant appel : relancer une récupération ne re-télécharge que le nouveau.

## Repli manuel

Sans proxy, tu peux quand même importer une game :

1. Récupère le JSON du match (ouvrir l'URL `match/v5` dans un onglet avec `?api_key=...` fonctionne — un onglet n'est pas soumis au même blocage CORS qu'une requête de page).
2. Colle-le dans **Paramètres → Import automatique → Repli manuel**, avec ton PUUID.

Un objet match seul ou un tableau de plusieurs sont acceptés.
