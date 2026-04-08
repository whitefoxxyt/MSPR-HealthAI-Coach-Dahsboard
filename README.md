# Dashboard HealthAI Coach - Interface d'Administration

Interface web d'administration pour la gestion de la qualité des données du projet HealthAI Coach, une plateforme de santé connectée centralisant des données hétérogènes (profils utilisateurs, données nutritionnelles, catalogues d'exercices, métriques biométriques).

## 📋 Vue d'ensemble

Ce dashboard permet aux équipes internes de :

- 📊 **Consulter les métriques de qualité** : valeurs manquantes, doublons, anomalies, statut des flux
- 🧹 **Nettoyer les données** : correction manuelle, édition inline, suppression, normalisation
- ✓ **Gérer le workflow de validation** : approuver ou rejeter les données en attente
- 📥 **Exporter les données** : export au format JSON ou CSV

## 🛠️ Stack technique

- **Vue 3** avec Composition API (`<script setup>`)
- **Vue Router** pour la navigation entre les vues
- **Pinia** pour la gestion de l'état global
- **Vitest** pour les tests unitaires
- **TypeScript** pour le typage statique
- **Vite** comme bundler et serveur de développement

## 📁 Structure du projet

```
src/
├── views/                    # Vues principales de l'application
│   ├── DashboardView.vue     # Tableau de bord avec métriques
│   ├── DataCleaningView.vue  # Interface de nettoyage des anomalies
│   └── ValidationView.vue    # Workflow de validation/approbation
├── components/               # Composants réutilisables
│   ├── common/               # Composants génériques
│   │   ├── MetricsCard.vue   # Carte d'affichage de métrique
│   │   ├── DataTable.vue     # Table de données avec pagination
│   │   └── ExportButton.vue  # Bouton d'export JSON/CSV
│   ├── dashboard/            # Composants du dashboard
│   │   └── DataFlowStatus.vue # Statut des flux de données
│   ├── data-cleaning/        # Composants de nettoyage
│   │   └── AnomaliesTable.vue # Table des anomalies
│   └── validation/           # Composants de validation
├── stores/                   # Stores Pinia
│   ├── dataQuality.ts        # Store pour métriques et anomalies
│   ├── validation.ts         # Store pour workflow de validation
│   └── __tests__/            # Tests unitaires des stores
├── services/                 # Services API
│   └── api.ts                # Client API avec données mockées
├── types/                    # Types et interfaces TypeScript
│   └── index.ts              # Définitions de types
├── utils/                    # Fonctions utilitaires
│   ├── helpers.ts            # Helpers de formatage et conversion
│   └── __tests__/            # Tests unitaires des utils
└── router/                   # Configuration du routeur
    └── index.ts              # Définition des routes
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
# Utilisation des données mockées (true par défaut)
VITE_USE_MOCK=true

# URL de l'API backend Java (à configurer lors de l'intégration)
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

Lance le linter et corrige automatiquement les erreurs :

```bash
npm run lint
```

Formate le code avec Prettier :

```bash
npm run format
```

## 🔌 Intégration avec le backend

### Mode Mock (par défaut)

Par défaut, l'application utilise des données mockées définies dans `src/services/api.ts`. Ce mode permet de développer et tester l'interface sans backend actif.

### Intégration avec l'API réelle

Pour connecter l'application à l'API backend Java :

1. Modifier le fichier `.env` :
   ```env
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=http://votre-backend:8080/api
   ```

2. Le service API (`src/services/api.ts`) utilise automatiquement les vrais endpoints :
   - `GET /data-quality/metrics` : Récupère les métriques
   - `GET /data-quality/anomalies` : Liste les anomalies
   - `GET /data-quality/flows` : Statut des flux de données
   - `PUT /data-quality/anomalies/:id` : Mise à jour d'une anomalie
   - `DELETE /data-quality/anomalies/:id` : Suppression d'une anomalie
   - `GET /validation/records` : Liste des enregistrements à valider
   - `PUT /validation/records/:id` : Mise à jour d'un enregistrement
   - `POST /validation/records/:id/validate` : Validation d'un enregistrement
   - `POST /export` : Export des données

3. Ajoutez l'authentification JWT dans `src/services/api.ts` si nécessaire.

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

### 1. Dashboard de pilotage

- Métriques de qualité des données en temps réel
- Score de santé global
- Statut des flux de données (actif, inactif, erreur)
- Actions rapides vers les autres sections

### 2. Nettoyage des données

- Visualisation des anomalies détectées
- Édition inline des valeurs
- Filtrage par type et sévérité
- Actions en lot (suppression, correction)
- Export des données corrigées

### 3. Workflow de validation

- Liste des enregistrements en attente
- Détails complets de chaque enregistrement
- Approbation/rejet individuel ou en lot
- Historique de validation
- Filtrage par statut

### 4. Export de données

- Export au format JSON ou CSV
- Inclusion optionnelle des métadonnées
- Filtrage par plage de dates
- Filtrage par type d'entité

## 🧪 Tests

Le projet inclut des tests unitaires pour :

- ✅ **Stores Pinia** : logique métier et gestion d'état
- ✅ **Fonctions utilitaires** : formatage, traduction, validation

Couverture de test : > 80% sur les stores et utils critiques.

## 🎨 Personnalisation

### Styles

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

- [ ] Ajout de graphiques de tendances (Chart.js)
- [ ] Notifications en temps réel (WebSocket)
- [ ] Mode sombre
- [ ] Personnalisation du dashboard par utilisateur
- [ ] Export automatisé programmé
- [ ] Internationalisation (i18n) pour support multilingue
