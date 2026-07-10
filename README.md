# WENZE - Marketplace Sécurisée sur Cardano

<div align="center">

**Une marketplace moderne et sécurisée construite pour la République Démocratique du Congo, intégrant la blockchain Cardano pour garantir la sécurité des transactions via un système d'escrow décentralisé.**

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Cardano](https://img.shields.io/badge/Cardano-Plutus-0033AD?logo=cardano)](https://cardano.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)

[Fonctionnalités](#-fonctionnalités) • [Installation](#-installation--démarrage) • [Architecture](#-architecture) • [Contribution](#-contribution)

</div>

---

## Caractéristiques Principales

- **Escrow Blockchain Cardano** : Les fonds sont verrouillés dans un smart contract jusqu'à confirmation de réception
- **Paiements en ADA** : Transactions sécurisées sur la blockchain Cardano (Preprod Testnet)
- **Système de Points WZP** : Récompenses pour chaque transaction réussie
- **Négociation de Prix** : Système de chat intégré avec propositions de prix
- **Multi-langue** : Support Français et Swahili
- **Statistiques en Temps Réel** : Données réelles depuis la base de données
- **Interface Moderne** : Design fluide et intuitif optimisé pour mobile

## Architecture

### Frontend
- **Framework** : React 18 + TypeScript
- **Build Tool** : Vite
- **Styling** : TailwindCSS
- **Blockchain** : Lucid-Cardano (v0.10.11)
- **Smart Contracts** : Aiken (Plutus V2/V3)
- **Routing** : React Router v6

### Backend & Infrastructure
- **Database** : Supabase (PostgreSQL)
- **Authentication** : Supabase Auth (Email/Password, Google OAuth)
- **API** : Supabase REST API + Node.js/Express (pour logiques complexes)
- **Blockchain Provider** : Blockfrost API (Preprod Testnet)

## Installation & Démarrage

### Pré-requis

- Node.js (v18+)
- npm ou yarn
- Un compte [Supabase](https://supabase.com) (Gratuit)
- Un compte [Blockfrost](https://blockfrost.io) pour Preprod Testnet (Gratuit)
- Un wallet Cardano compatible CIP-30 (Nami, Eternl, Lace, etc.)

### 1. Configuration Supabase

1. Créez un nouveau projet Supabase
2. Allez dans l'éditeur SQL de Supabase
3. Exécutez le contenu du fichier `supabase_schema.sql` (à la racine du projet)
   - Cela créera toutes les tables nécessaires : `profiles`, `products`, `orders`, `messages`, `wzp_balances`, etc.
4. Récupérez vos clés API (Settings → API) :
   - `Project URL` (VITE_SUPABASE_URL)
   - `anon public key` (VITE_SUPABASE_ANON_KEY)

### 2. Configuration Blockfrost

1. Créez un compte sur [Blockfrost](https://blockfrost.io)
2. Créez un nouveau projet pour **Preprod Testnet**
3. Récupérez votre `Project ID` (clé API)

### 3. Configuration Frontend

1. Clonez le repository :
   ```bash
   git clone <repository-url>
   cd wenze/frontend
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Créez le fichier `.env` :
   ```bash
   cp .env.example .env
   ```

4. Remplissez `.env` avec vos clés :
   ```env
   # Supabase
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-cle-publique-supabase

   # Blockfrost (Preprod Testnet)
   VITE_BLOCKFROST_PROJECT_ID=votre-project-id-blockfrost

   # Adresse du Smart Contract Escrow (Preprod)
   VITE_ESCROW_ADDRESS_TESTNET=addr_test1...
   ```

5. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

L'application sera accessible sur `http://localhost:5173`

### 4. Configuration Backend (Optionnel)

Le frontend communique principalement avec Supabase. Le backend Node.js est disponible pour des logiques complexes futures.

```bash
cd backend
npm install
# Configurez .env si nécessaire
npm start
```

## Fonctionnalités

### Authentification
- Inscription/Connexion avec email et mot de passe
- Authentification Google OAuth
- Gestion automatique des profils utilisateurs

### Gestion des Produits
- Création de produits avec images, prix (en ADA ou FC), catégories
- Recherche et filtrage par catégorie
- Affichage des produits avec prix en temps réel
- Types de prix : fixe ou négociable avec plage min-max
- Catégories : Électronique, Mode, Aliments, Beauté, Bricolage, Services, Immobilier, Auto, Autres

### Transactions & Escrow
- **Achat** : L'acheteur connecte son wallet et verrouille les fonds dans l'escrow blockchain
- **Négociation** : Système de chat avec propositions de prix
- **Livraison** : Le vendeur confirme l'expédition
- **Libération** : L'acheteur confirme la réception → fonds libérés automatiquement via smart contract
- **Suivi** : États de commande (pending → escrow_web2 → shipped → completed)

### Système de Points WZP
- Distribution automatique de points WZP après chaque transaction complétée
- 50% des points pour l'acheteur, 50% pour le vendeur
- Affichage du solde WZP dans le profil utilisateur
- Système d'administration pour envoyer des récompenses manuelles

### Messagerie
- Chat intégré dans chaque commande
- Notifications en temps réel
- Support des négociations de prix
- Statut de lecture (simple = envoyé, double = lu)
- Présence en ligne (indicateur online/offline)

## Structure du Projet

```
wenze/
├── frontend/
│   ├── src/
│   │   ├── blockchain/          # Intégration Cardano
│   │   │   ├── escrowContract.ts # Logique smart contract escrow
│   │   │   ├── lucidService.ts  # Configuration Lucid
│   │   │   ├── prepareAdaPayment.ts  # Verrouillage fonds
│   │   │   └── prepareAdaRelease.ts   # Libération fonds
│   │   ├── components/          # Composants réutilisables
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ChatBox.tsx
│   │   │   └── WalletModal.tsx
│   │   ├── context/             # Contextes React
│   │   │   ├── AuthContext.tsx
│   │   │   ├── BlockchainContext.tsx
│   │   │   ├── LanguageContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── pages/               # Pages de l'application
│   │   │   ├── Home.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── OrderDetail.tsx
│   │   │   └── Dashboard.tsx
│   │   └── utils/               # Utilitaires
│   ├── public/
│   │   └── contracts/           # Smart contracts compilés
│   │       ├── escrow.plutus.json
│   │       └── escrow_v2_test.plutus.json
│   └── contracts/              # Code source Aiken
│       └── escrow/
│           └── validators/
│               └── escrow.ak
├── backend/                     # API Express (optionnel)
├── supabase/
│   ├── migrations/              # Migrations SQL
│   └── functions/               # Edge Functions
│       └── send-reward-notification/
└── supabase_schema.sql          # Schéma complet de la base
```

## 🔗 Intégration Blockchain

### Smart Contract Escrow

L'application utilise un smart contract Plutus (compilé avec Aiken) pour gérer l'escrow :

- **Lock** : Verrouillage des fonds ADA dans le contrat
- **Release** : Libération des fonds vers le vendeur après confirmation
- **Cancel** : Annulation et retour des fonds à l'acheteur (en développement)

### Wallets Supportés

- Nami
- Eternl (Gero)
- Lace
- Flint
- Vespr
- Yoroi

Tous les wallets compatibles CIP-30 sont supportés.

### Compilation du Smart Contract

Pour compiler le smart contract escrow :

```bash
cd frontend/contracts/escrow
aiken build
```

Le contrat compilé sera disponible dans `frontend/public/contracts/`.

## Déploiement

### Vercel (Recommandé)

1. Poussez votre code sur GitHub
2. Importez le projet sur [Vercel](https://vercel.com)
3. Configurez le **Root Directory** : `frontend`
4. Ajoutez les variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BLOCKFROST_PROJECT_ID`
   - `VITE_ESCROW_ADDRESS_TESTNET`
5. Déployez !

### Migrations de Base de Données

Les migrations SQL sont disponibles dans `supabase/migrations/`. Exécutez-les dans l'ordre dans l'éditeur SQL de Supabase :

1. `01_consolidate_all_product_columns.sql` - Colonnes consolidées pour produits
2. `add_is_admin_to_profiles.sql` - Système d'administration
3. `create_wzp_rewards_system.sql` - Système de récompenses WZP
4. `create_wzp_leaderboard.sql` - Tableau des leaders
5. Autres migrations selon vos besoins

## État Actuel & Limitations

### Fonctionnel
- Authentification complète (Email/Password, Google OAuth)
- Gestion des produits (publication, édition, suppression)
- Types de prix (fixe ou négociable avec plage min-max)
- Disponibilité des services (disponible/indisponible)
- Transactions avec escrow blockchain Cardano (Preprod Testnet)
- Système de points WZP (distribution automatique)
- Chat intégré avec statut de lecture et présence en ligne
- Négociation de prix
- Multi-langue (Français/Swahili)
- Statistiques en temps réel
- Interface moderne et responsive

### En Développement
- Support complet Plutus V3 (actuellement limitation avec lucid-cardano 0.10.11)
- Annulation automatique après délai
- Optimisations de performance
- Tests automatisés

### Notes Techniques

- **Réseau** : Actuellement sur **Preprod Testnet** (Cardano)
- **Lucid Version** : 0.10.11 (limitations connues avec Plutus V3)
- **Smart Contract** : Script de test Plutus V2 utilisé en fallback

## Configuration Avancée

### Edge Functions Supabase

Le projet inclut une Edge Function pour l'envoi d'emails de notification :

- **Fonction** : `send-reward-notification`
- **Service** : Resend API
- **Configuration** : Voir `supabase/functions/send-reward-notification/README.md`

### Système d'Administration

Pour créer un compte administrateur et gérer les récompenses WZP :

1. Exécutez la migration `add_is_admin_to_profiles.sql`
2. Mettez à jour un profil avec `is_admin = true` dans Supabase
3. Accédez à `/admin/rewards` pour gérer les récompenses

## Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Guidelines

- Suivez les conventions de code existantes
- Ajoutez des commentaires pour le code complexe
- Testez vos modifications
- Mettez à jour la documentation si nécessaire

## Licence

Ce projet est propriétaire. Tous droits réservés.

## Remerciements

- [Cardano](https://cardano.org/) - Pour la blockchain
- [Supabase](https://supabase.com/) - Pour l'infrastructure backend
- [Lucid](https://github.com/spacebudz/lucid) - Pour l'intégration Cardano
- [Aiken](https://aiken-lang.org/) - Pour les smart contracts

---

<div align="center">


*WENZE - L'avenir du commerce sécurisé en RDC*

</div> .
