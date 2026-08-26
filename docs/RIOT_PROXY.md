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

## Rotation automatique de la clé

Une clé de dev Riot expire toutes les 24h. Régénérer la clé sur developer.riotgames.com reste manuel (Riot n'expose aucune API pour ça, et ce n'est qu'un unique clic une fois connecté) — mais l'app peut ensuite pousser la nouvelle clé dans le Worker à ta place, sans passer par le dashboard Cloudflare.

Ça demande trois secrets supplémentaires, une seule fois :

1. Sur [dash.cloudflare.com](https://dash.cloudflare.com), va dans **My Profile → API Tokens → Create Token → Create Custom Token**. Donne-lui la permission **Account → Workers Scripts → Edit**, restreinte à ton compte. Ne choisis rien de plus large — ce jeton ne doit pouvoir toucher que les Workers, rien d'autre sur ton compte Cloudflare.
2. Note l'**Account ID** (visible dans l'URL du dashboard : `dash.cloudflare.com/<account-id>/...`, ou dans la sidebar du Worker).
3. Ajoute trois secrets sur le Worker (**Settings → Variables and Secrets**) :

   | Nom | Valeur |
   | --- | --- |
   | `CF_API_TOKEN` | le jeton créé à l'étape 1 |
   | `CF_ACCOUNT_ID` | l'Account ID de l'étape 2 |
   | `ADMIN_TOKEN` | une **nouvelle** chaîne aléatoire, différente de `PROXY_TOKEN` |

`ADMIN_TOKEN` est volontairement séparé de `PROXY_TOKEN` : ce dernier circule dans chaque requête d'import (donc plus exposé — historique du navigateur, etc.), alors que l'admin token n'est utilisé que lors d'une rotation de clé et donne le droit de réécrire les secrets du Worker. Sans ces trois secrets, le reste de l'app continue de fonctionner normalement — seul le bouton de rotation reste inactif.

Une fois configuré : **Paramètres → Import automatique → Renouveler la clé Riot**, ouvre le portail Riot, régénère ta clé, colle-la dans le champ prévu et valide — le Worker met à jour son propre secret `RIOT_API_KEY` via l'API Cloudflare, sans que la clé transite jamais par un service tiers autre que Riot et Cloudflare.

## Points d'attention

- **Une clé de développement Riot expire toutes les 24h.** Sans la rotation automatique ci-dessus, il faut la régénérer et mettre à jour le secret `RIOT_API_KEY` du Worker à la main. Pour un usage durable, demande une *Personal API Key* à Riot.
- **Le `PROXY_TOKEN` n'est pas un secret fort** : il est visible dans les requêtes du navigateur si quelqu'un a accès à ta machine. Il sert à empêcher un inconnu de consommer ton quota Riot, pas à protéger des données sensibles.
- **Le Worker ne relaie que vers `*.api.riotgames.com`** — cette vérification est ce qui l'empêche d'être utilisé comme proxy ouvert. Ne la retire pas.
- **Le gain/perte de LP n'existe pas dans l'API Riot.** L'app en *estime* un (voir ci-dessous) plutôt que de mettre `lpChange = 0` — mais reste une approximation, à corriger à la main depuis l'historique si tu connais la vraie valeur.

## Estimation du LP par game

Riot ne fournit jamais le LP gagné/perdu par game, seulement le résultat (victoire/défaite). L'app en déduit une estimation en comparant :
- le rang connu de l'app **avant** l'import (ton rang courant au moment du clic),
- le rang **réellement resynchronisé** depuis Riot juste après (`league/v4/entries`).

La différence entre les deux est un fait mesuré ; il ne reste qu'à la répartir sur les games du lot, en supposant que chaque victoire rapporte autant que chaque défaite en fait perdre (hypothèse qui casse en cas de série de promotion, de bonus de première victoire du jour, etc. — d'où le mot *estimation*). Si le lot a autant de victoires que de défaites, cette hypothèse ne suffit même pas à expliquer un delta non nul : l'app retombe alors sur une valeur par défaut (±17 LP) et absorbe l'écart restant sur la game la plus récente, pour que le total reste au moins exact.

Chaque valeur estimée est marquée **≈** dans l'historique (survole pour le rappel) et n'est plus considérée comme une estimation dès que tu la corriges à la main via **Modifier**.

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
