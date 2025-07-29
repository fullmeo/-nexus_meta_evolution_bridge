# NeuralMix P2P v11.1.0

Plateforme de DJ collaborative en temps réel avec synchronisation P2P et intelligence artificielle.

> **Dernière mise à jour** : 29/07/2025  
> **Version actuelle** : 11.1.0  
> **Auteur** : Serigne Diagne

## 🚀 Fonctionnalités

- 🎵 Lecture audio avancée avec Web Audio API
- 🌐 Synchronisation en temps réel entre DJs via WebRTC
- 🧠 Intelligence artificielle pour la détection de BPM et la synchronisation
- 🎛️ Effets audio en temps réel
- 🎤 Support du micro avec effets en direct
- 🎨 Interface utilisateur moderne et réactive
- 🔔 Système de notifications utilisateur amélioré
- 🛠️ Gestion avancée des erreurs audio
- 🔄 Système de versioning intégré

## 📁 Structure du Projet

```
neural_dj_p2p/
├── src/                    # Code source principal
│   ├── js/                 # Fichiers JavaScript
│   │   ├── modules/        # Modules JavaScript
│   │   │   ├── audioSync.js
│   │   │   ├── neuralSync.js
│   │   │   └── p2p.js
│   │   └── main.js         # Point d'entrée principal
│   │
│   ├── css/                # Feuilles de style
│   │   ├── main.css
│   │   └── themes/         # Thèmes supplémentaires
│   │
│   └── assets/             # Ressources
│       ├── images/
│       ├── samples/        # Échantillons audio
│       └── icons/
│
├── dist/                   # Fichiers compilés pour la production
│   ├── index.html
│   ├── js/
│   └── css/
│
├── docs/                   # Documentation
│   ├── api.md
│   └── setup.md
│
├── versions/               # Gestion des versions
│   ├── archive/           # Archives des versions
│   │   ├── v11.0.0/       # Version initiale
│   │   └── v11.1.0/       # Amélioration gestion erreurs
│   ├── version-manifest.json # Manifeste des versions
│   └── versionManager.js  # Gestionnaire de versions
│
└── tests/                  # Tests
    ├── unit/
    └── integration/
```

## 📦 Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-utilisateur/neural_dj_p2p.git

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```
## 🔄 Gestion des Versions

### Créer une nouvelle version
```bash
node versions/versionManager.js create <version> "<description>" "<auteur>"
```

### Lister les versions disponibles
```bash
node versions/versionManager.js list
```

### Restaurer une version
```bash
node versions/versionManager.js restore <version>
```

## 📝 Notes de Version

### v11.1.0 (29/07/2025)
- Ajout d'un système de notifications utilisateur
- Amélioration de la gestion des erreurs audio
- Correction des problèmes de lecture/pause
- Optimisation des performances

### v11.0.0 (Version Initiale)
- Version de base avec les fonctionnalités principales
- Synchronisation P2P basique
- Interface utilisateur initiale

## 🚀 Déploiement

Pour créer une version de production :

```bash
npm run build
```

Les fichiers optimisés seront disponibles dans le dossier `dist/`.

## 📦 Système de Versionnement

NeuralMix P2P dispose d'un système de versionnement intégré pour suivre et gérer les différentes versions du projet.

### Structure du système

```
versions/
├── version-manifest.json    # Fichier de suivi des versions
├── versionManager.js        # Script de gestion des versions
└── archive/                 # Archives des versions
    ├── v11.0.0/             # Version 11.0.0
    │   ├── version-info.json
    │   ├── neuralmix_v11_fixed.html
    │   └── src/
    │       ├── js/
    │       │   ├── main.js
    │       │   └── modules/
    │       │       ├── audioSync.js
    │       │       └── neuralSync.js
    │       └── css/
    │           └── main.css
    └── ...
```

### Utilisation du gestionnaire de versions

Le script `versionManager.js` permet de gérer facilement les versions du projet :

```bash
# Créer une nouvelle version
node versions/versionManager.js create 11.1.0 "Description des changements" "Auteur"

# Lister toutes les versions
node versions/versionManager.js list

# Comparer deux versions
node versions/versionManager.js compare 11.0.0 11.1.0

# Ajouter un fichier au suivi de version
node versions/versionManager.js add chemin/vers/fichier.js javascript

# Générer un rapport de version
node versions/versionManager.js report 11.0.0
```

### Fonctionnalités du système de versionnement

- 📋 Suivi des versions avec métadonnées (auteur, date, description)
- 📦 Archivage automatique des fichiers pour chaque version
- 🔍 Comparaison entre versions
- 📊 Génération de rapports
- 🔄 Gestion des fichiers suivis

### Création d'une nouvelle version

Pour créer une nouvelle version après des modifications :

1. Effectuez vos modifications sur les fichiers du projet
2. Créez une nouvelle version avec le gestionnaire :
   ```bash
   node versions/versionManager.js create 11.1.0 "Ajout de nouvelles fonctionnalités" "Votre Nom"
   ```
3. La version sera automatiquement archivée et le manifeste mis à jour

## 📚 Documentation

Consultez le dossier `docs/` pour la documentation complète de l'API et du guide d'installation.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
