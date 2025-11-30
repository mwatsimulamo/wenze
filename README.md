# Wenze / Uzisha Chain - MVP V1 (Web2)

Bienvenue dans le MVP de **Wenze**, la marketplace Web2 qui prépare le terrain pour la blockchain Cardano.
Ce projet simule un système d'Escrow sécurisé et utilise Supabase pour toute la gestion des données.

**⚠️ NOTE IMPORTANTE :** Ce projet ne contient **AUCUN** code blockchain réel exécutable. Les fonctions liées à Cardano sont des placeholders (`src/blockchain/`) prêts pour la V2.

## 🏗 Architecture

- **Frontend :** React, Vite, TailwindCSS
- **Backend :** Node.js, Express (API Shell)
- **Database :** Supabase (PostgreSQL)
- **Auth :** Supabase Auth

## 🚀 Installation & Démarrage

### 1. Pré-requis
- Node.js (v16+)
- Un compte [Supabase](https://supabase.com) (Gratuit)

### 2. Configuration Supabase
1. Créez un nouveau projet Supabase.
2. Allez dans l'éditeur SQL de Supabase.
3. Copiez et exécutez le contenu du fichier `supabase_schema.sql` (à la racine du projet).
   - Cela créera toutes les tables (profiles, products, orders, messages, etc.).
4. Récupérez vos clés API (Settings -> API) : `Project URL` et `anon public key`.

### 3. Configuration Frontend
1. Allez dans le dossier frontend : `cd frontend`
2. Installez les dépendances : `npm install`
3. Créez le fichier `.env` à partir de l'exemple :
   ```bash
   cp .env.example .env
   ```
4. Remplissez `.env` avec vos clés Supabase :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-cle-publique
   ```
5. Lancez le serveur de développement : `npm run dev`

### 4. Configuration Backend (Optionnel pour le MVP UI)
Le frontend communique directement avec Supabase pour le CRUD. Le backend Node est prêt pour les futures logiques complexes.
1. Allez dans le dossier backend : `cd backend`
2. Installez les dépendances : `npm install`
3. Configurez `.env` (voir `.env.example`).
4. Lancez le serveur : `npm start`

## 📱 Fonctionnalités du MVP

1. **Authentification :** Inscrivez-vous avec un email/mot de passe.
2. **Produits :**
   - Créez un produit (Titre, Prix en ADA, Image).
   - Le prix est affiché en ADA mais géré comme une valeur numérique standard.
3. **Achat & Escrow (Simulation) :**
   - Un acheteur clique sur "Acheter".
   - Une commande est créée (Statut : `pending`).
   - Le système simule le blocage des fonds (Statut : `escrow_web2`).
4. **Livraison & Libération :**
   - Le vendeur voit la commande et clique sur "Confirmer l'expédition" (Statut : `shipped`).
   - L'acheteur reçoit, vérifie et clique sur "Confirmer la réception" (Statut : `completed`).
   - Les fonds sont "libérés" (logique purement base de données) et des points UZP sont distribués.
5. **Chat :** Messagerie intégrée dans chaque commande.

## 📂 Structure des Dossiers Clés

```
/frontend
  /src
    /blockchain/      # Placeholders pour l'intégration future Cardano
    /components/      # Navbar, Layout, ChatBox
    /context/         # AuthContext
    /lib/             # Client Supabase
    /pages/           # Ecrans (Login, Dashboard, Products, Orders)
/backend              # API Express
supabase_schema.sql   # Structure de la base de données
```

## 🔮 Intégration Blockchain Future (V2)

Pour passer à la V2 :
1. Installer `lucid-cardano` ou `meshsdk`.
2. Implémenter la logique réelle dans `/src/blockchain/connectWallet.ts`.
3. Remplacer la simulation d'Escrow dans `ProductDetail.tsx` par un appel à un Smart Contract.


