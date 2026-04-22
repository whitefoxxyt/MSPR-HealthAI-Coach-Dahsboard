# Dashboard HealthAI Coach - Interface d'Administration

Interface web d'administration pour la gestion de la qualité des données du projet HealthAI Coach, une plateforme de santé connectée centralisant des données hétérogènes (profils utilisateurs, données nutritionnelles, catalogues d'exercices, métriques biométriques).

## 📋 Vue d'ensemble

Ce dashboard permet aux équipes internes (admins, data scientists) de :

- 🔐 **S'authentifier** via le microservice MSPR-AUTH (better-auth) : login / register / reset password
- 📊 **Consulter les métriques de qualité** : valeurs manquantes, doublons, anomalies, statut des flux
- 📈 **Analyser les performances globales** : progression utilisateurs, nutrition, activité, KPIs business
- 🧹 **Nettoyer les données** : correction manuelle, édition inline, suppression, normalisation
- ✓ **Gérer le workflow de validation** : approuver ou rejeter les données en attente
- 📥 **Exporter les données** : export au format JSON ou CSV

> Le dashboard est destiné à l'administration et à la data science, pas aux utilisateurs finaux de la plateforme HealthAI Coach.

## 🛠️ Stack technique

- **Vue 3.5** avec Composition API (`<script setup>`)
- **Vue Router 5** pour la navigation et la protection des routes (`requireAuth`)
- **Pinia 3** pour la gestion de l'état global (auth, dataQuality, validation)
- **TypeScript 6** pour le typage statique
- **Vite 8** comme bundler et serveur de développement
- **Vitest 4** pour les tests unitaires
- **oxlint + ESLint + Prettier** pour le lint et le formatage
- **Chart.js 4** pour les visualisations analytics
- **FontAwesome** pour l'iconographie
- **better-auth client** (via `src/services/auth.ts`) pour l'interaction avec le microservice MSPR-AUTH

## 📁 Structure du projet

```
src/
├── views/                    # Vues principales de l'application
│   ├── AuthView.vue          # Login / register / reset password (route /)
│   ├── DashboardView.vue     # Tableau de bord avec métriques (route /dashboard)
│   ├── DataCleaningView.vue  # Interface de nettoyage des anomalies (route /data-cleaning)
│   └── ValidationView.vue    # Workflow de validation/approbation (route /validation)
├── components/               # Composants réutilisables
│   ├── common/               # Composants génériques
│   │   ├── MetricsCard.vue   # Carte d'affichage de métrique
│   │   ├── BaseModal.vue     # Modale de base réutilisable
│   │   └── ConfirmDialog.vue # Dialogue de confirmation
│   └── dashboard/            # Composants du dashboard
│       └── DataFlowStatus.vue # Statut des flux de données
├── stores/                   # Stores Pinia
│   ├── auth.ts               # Store d'authentification (utilisateur courant, session)
│   ├── dataQuality.ts        # Store pour métriques et anomalies
│   ├── validation.ts         # Store pour workflow de validation
│   └── __tests__/            # Tests unitaires des stores
├── services/                 # Clients des microservices
│   ├── api.ts                # Client API métier (MSPR-API, port 8080)
│   └── auth.ts               # Client better-auth (MSPR-AUTH, port 3000)
├── types/                    # Types et interfaces TypeScript
│   └── index.ts              # Définitions de types
├── utils/                    # Fonctions utilitaires
│   ├── helpers.ts            # Helpers de formatage et conversion
│   └── __tests__/            # Tests unitaires des utils
└── router/                   # Configuration du routeur
    └── index.ts              # Définition des routes + guards requireAuth / guestOnly
```

## 🚀 Installation et lancement

### Prérequis

- Node.js **^20.19.0** ou **>=22.12.0**
- npm ou pnpm

### Installation des dépendances

```bash
npm install
```

### Configuration

Créez un fichier `.env` à la racine du projet (ou utilisez `.env.example`) :

```env
# Utilisation des données mockées (true par défaut en dev)
VITE_USE_MOCK=true

# URL du service d'authentification (MSPR-AUTH, Hono + better-auth)
VITE_AUTH_BASE_URL=http://localhost:3000

# URL de l'API backend Java (MSPR-API, Spring Boot)
VITE_API_BASE_URL=http://localhost:8080/api
```

### Développement

Lance le serveur de développement avec hot-reload :

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:5173](http://localhost:5173)

### Build de production

Compile et minifie le projet pour la production :

```bash
npm run build
```

Les fichiers générés seront dans le dossier `dist/`.

### Prévisualisation du build

Prévisualise le build de production localement :

```bash
npm run preview
```

### Tests unitaires

Lance les tests unitaires avec Vitest :

```bash
npm run test:unit
```

Pour lancer les tests en mode watch :

```bash
npm run test:unit -- --watch
```

### Vérification de types

Vérifie les types TypeScript :

```bash
npm run type-check
```

### Linting et formatage

Lance les deux linters (oxlint puis ESLint) et corrige automatiquement les erreurs :

```bash
npm run lint
```

Formate le code avec Prettier :

```bash
npm run format
```

## 🔌 Intégration avec les microservices

Le front interagit avec deux microservices :

- **MSPR-AUTH** (`VITE_AUTH_BASE_URL`, port 3000) : authentification via better-auth (login, register, session, reset password)
- **MSPR-API** (`VITE_API_BASE_URL`, port 8080) : API métier Spring Boot (qualité des données, export, CRUD)

### Mode Mock (par défaut en dev)

Lorsque `VITE_USE_MOCK=true`, l'application utilise des données mockées définies dans `src/services/api.ts`. Ce mode permet de développer et tester l'interface sans backend métier actif. L'authentification reste, elle, branchée sur le vrai service AUTH.

### Intégration avec l'API réelle

Pour connecter l'application à l'API backend Java :

1. Modifier le fichier `.env` :
   ```env
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=http://votre-backend:8080/api
   ```

2. Le service API (`src/services/api.ts`) utilise automatiquement les vrais endpoints :
   - `GET /data-quality/metrics` — Récupère les métriques
   - `GET /data-quality/anomalies` — Liste les anomalies
   - `GET /data-quality/flows` — Statut des flux de données
   - `GET /analytics/overview` — Données analytics (utilisateurs, nutrition, fitness, business)
   - `PUT /data-quality/anomalies/:id` — Mise à jour d'une anomalie
   - `DELETE /data-quality/anomalies/:id` — Suppression d'une anomalie
   - `GET /validation/records` — Liste des enregistrements à valider
   - `PUT /validation/records/:id` — Mise à jour d'un enregistrement
   - `POST /validation/records/:id/validate` — Validation d'un enregistrement
   - `POST /export` — Export des données

3. Le JWT émis par MSPR-AUTH (`GET /api/jwt`) est injecté automatiquement en en-tête `Authorization: Bearer <token>` pour chaque requête vers MSPR-API.

## 🐳 Docker

Un `Dockerfile` multi-stage (builder Node 22 + image finale `serve`) est fourni. Il accepte les `ARG` `VITE_AUTH_BASE_URL`, `VITE_API_BASE_URL`, `VITE_USE_MOCK` pour injecter les URLs à la build. Le container est orchestré via le `docker-compose.yml` à la racine du monorepo MSPR.

## ♿ Accessibilité (RGAA niveau AA)

L'interface respecte les standards d'accessibilité RGAA niveau AA :

- ✅ Navigation au clavier complète
- ✅ Attributs ARIA appropriés (`role`, `aria-label`, `aria-labelledby`, etc.)
- ✅ Focus visible pour tous les éléments interactifs
- ✅ Contrastes de couleurs conformes
- ✅ Labels explicites pour les champs de formulaire
- ✅ Support de `prefers-reduced-motion` pour animations
- ✅ Structure HTML sémantique
- ✅ Messages d'état avec `role="status"` et `role="alert"`

## 📊 Fonctionnalités principales

### 1. Authentification

- Login / register / reset password via better-auth (MSPR-AUTH)
- Vérification d'email avec bootstrap automatique de la session côté front
- Double stockage : cookie HTTP-only (Better Auth) + localStorage (résilience au reload)
- Guards `requireAuth` et `guestOnly` appliqués au niveau du router

### 2. Dashboard de pilotage

- Métriques de qualité des données en temps réel
- Score de santé global
- Statut des flux de données (actif, inactif, erreur)
- Visualisations analytics (utilisateurs, nutrition, fitness, business)
- Actions rapides vers les autres sections

### 3. Nettoyage des données

- Visualisation des anomalies détectées
- Édition inline des valeurs
- Filtrage par type et sévérité
- Actions en lot (suppression, correction)
- Export des données corrigées

### 4. Workflow de validation

- Liste des enregistrements en attente
- Détails complets de chaque enregistrement
- Approbation/rejet individuel ou en lot
- Historique de validation
- Filtrage par statut

### 5. Export de données

- Export au format JSON ou CSV
- Inclusion optionnelle des métadonnées
- Filtrage par plage de dates
- Filtrage par type d'entité

## 🧪 Tests

Le projet inclut des tests unitaires pour :

- ✅ **Stores Pinia** : logique métier et gestion d'état
- ✅ **Fonctions utilitaires** : formatage, traduction, validation

Couverture de test : > 80% sur les stores et utils critiques.

## 🎨 Design

Le dashboard utilise un **design system sombre** inspiré d'iOS Dark : fonds sombres, accents bleus/verts, cartes avec effet de glassmorphism léger, animations fluides via `requestAnimationFrame`.

Les styles sont définis au niveau des composants avec `<style scoped>`. Pour personnaliser le thème :

1. Modifiez les variables CSS globales dans `src/App.vue`
2. Adaptez les classes utilitaires dans chaque composant

### Données mockées

Pour adapter les données mockées, modifiez l'objet `mockData` dans `src/services/api.ts`.

## 🤝 Contribution

1. Les composants doivent utiliser la Composition API avec `<script setup>`
2. Respecter la structure de dossiers établie
3. Ajouter des tests unitaires pour toute nouvelle fonctionnalité
4. Suivre les standards d'accessibilité RGAA niveau AA
5. Documenter les fonctions complexes

## 📝 Licence

Ce projet est un dashboard interne pour HealthAI Coach.

## 🆘 Support

Pour toute question ou problème :

1. Vérifier que Node.js et npm sont à jour
2. Supprimer `node_modules` et réinstaller : `rm -rf node_modules && npm install`
3. Vérifier les logs du serveur de développement
4. Consulter la documentation Vue 3 : [vuejs.org](https://vuejs.org)

## 🔮 Roadmap

- [x] Mode sombre (design system iOS Dark)
- [x] Authentification via MSPR-AUTH
- [ ] Notifications en temps réel (WebSocket)
- [ ] Personnalisation du dashboard par utilisateur
- [ ] Export automatisé programmé
- [ ] Internationalisation (i18n) pour support multilingue
