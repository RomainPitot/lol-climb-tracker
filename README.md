# CLIMB.EUW — LoL Climb Tracker

Tracker de progression SoloQ League of Legends. Suit tes games une par une, calcule ton rang au fil des LP, détecte tes sessions de jeu, et génère un récapitulatif structuré à coller dans une IA coach.

**Application en ligne : https://romainpitot.github.io/lol-climb-tracker/**

> Toutes les données restent dans **ton navigateur** (`localStorage`). Rien n'est envoyé sur un serveur, il n'y a pas de compte, et le site n'a pas de backend. Pense à faire un export JSON de temps en temps (Paramètres → Import / export JSON) : vider les données du navigateur efface aussi ton historique.

---

## Fonctionnalités

| Page | Contenu |
| --- | --- |
| **Dashboard** | Rang courant, frise Émeraude → Master, succès, stats de la période, courbe de LP, historique éditable |
| **Ajouter une game** | Saisie d'une game — tu entres le gain/perte de LP, le rang se recalcule tout seul |
| **Champions** | Stats par champion du roster + graphiques (WR cumulé, CS/min, deaths, dégâts, LP), moyennes mobiles sur 10 games |
| **Sessions** | Regroupement automatique des games jouées à moins de 3h d'écart, avec détection de baisse de perf |
| **Coach IA** | Sélection libre de games → recap texte prêt à coller dans un LLM |
| **Paramètres** | Import Riot API, rang manuel, objectifs, seuils de couleur, stats historiques, import CSV/JSON, export |

### Ce que l'app calcule

- **Rang** : chaque game applique son `lpChange` au rang précédent, avec promotion/rétrogradation entre divisions. Modèle simplifié — pas de série de promotion ni de protection contre la descente.
- **Sessions** : deux games consécutives font partie de la même session si moins de 3h séparent la fin de l'une du début de l'autre.
- **Repères de palier** : les cibles CS/min, KDA et deaths affichées sont des **estimations indicatives** codées en dur (`src/constants/ranks.js`), pas des données temps réel tirées d'une API de stats.

---

## Développement local

```bash
npm install
npm run dev
```

Puis ouvre l'URL affichée (par défaut http://localhost:5173).

Autres commandes :

```bash
npm run build
```

```bash
npm run preview
```

```bash
npm run lint
```

---

## Structure du projet

```
src/
├── main.jsx              point d'entrée React
├── App.jsx               layout + routage entre pages
├── index.css             variables CSS du thème + reset Tailwind
├── constants/            données statiques (rangs, roster, régions Riot, navigation)
├── lib/                  logique pure, testable sans React
│   ├── rank.js           calcul de rang, LP, promotions
│   ├── stats.js          agrégats, moyennes mobiles, séries, couleurs
│   ├── sessions.js       détection de sessions
│   ├── goals.js          progression des objectifs
│   ├── coachRecap.js     génération du recap IA
│   ├── riotApi.js        client Riot (via proxy ou direct)
│   ├── importers.js      CSV / JSON / match Riot → game
│   └── storage.js        persistance localStorage
├── hooks/
│   └── useTrackerData.js état global + mutations
├── components/           composants réutilisables (UI, badges, graphiques)
└── pages/                une page par entrée de navigation
worker/
└── worker.js             proxy Cloudflare pour l'API Riot
```

La logique métier vit dans `src/lib/` et ne dépend pas de React : c'est là qu'il faut regarder pour comprendre ou modifier un calcul.

---

## Import automatique des games (Riot API)

L'API Riot ne peut pas être appelée directement depuis un navigateur : pas de CORS, et une clé API ne doit jamais être exposée côté client. L'app passe donc par un petit proxy que **tu déploies toi-même**.

Voir **[docs/RIOT_PROXY.md](docs/RIOT_PROXY.md)** pour la procédure complète (Cloudflare Workers, gratuit, ~5 minutes).

En repli, l'app accepte aussi du JSON de match collé à la main — utile si le proxy n'est pas en place.

> ⚠️ L'API Riot ne fournit **pas** le gain/perte de LP d'une game. Les games importées arrivent avec `lpChange = 0` ; corrige-les depuis l'historique du Dashboard (bouton crayon).

---

## Déploiement

Le workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) build et publie automatiquement sur GitHub Pages à chaque push sur `main`.

Pour déployer ce projet sur ton propre compte, deux choses à changer :

1. `base` dans [`vite.config.js`](vite.config.js) → `/<nom-de-ton-repo>/`
2. Dans les réglages du repo : **Settings → Pages → Source : GitHub Actions**

---

## Licence

[MIT](LICENSE)

Ce projet n'est ni approuvé ni affilié à Riot Games. League of Legends © Riot Games, Inc.
