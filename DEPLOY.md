# Guide de Déploiement sur Vercel (WENZE)

Votre projet est prêt à être déployé. L'architecture Frontend (Vite + React) est optimisée pour Vercel.

## 1. Préparation
Assurez-vous que tout votre code est poussé sur GitHub (ou GitLab/Bitbucket).

## 2. Création du Projet sur Vercel
1. Allez sur [vercel.com](https://vercel.com) et connectez-vous.
2. Cliquez sur **"Add New..."** > **"Project"**.
3. Importez votre dépôt Git `WENZE`.

## 3. Configuration Importante (CRUCIAL)
Vercel va détecter le projet, mais il faut lui dire que l'application est dans le sous-dossier `frontend`.

*   **Framework Preset** : Vite
*   **Root Directory** (Racine) : Cliquez sur "Edit" et sélectionnez le dossier `frontend`.
*   **Build Command** : `npm run build` (ou laissé par défaut si Vercel détecte `vite build`)
*   **Output Directory** : `dist`

## 4. Variables d'Environnement
Dans la section **"Environment Variables"**, vous devez ajouter les clés qui se trouvent dans votre fichier `.env` local (si vous en avez) ou vos clés Supabase :

*   `VITE_SUPABASE_URL` : (Votre URL Supabase, ex: https://xyz.supabase.co)
*   `VITE_SUPABASE_ANON_KEY` : (Votre clé publique Supabase)

> **Note** : Sans ces clés, l'inscription et la connexion ne fonctionneront pas en ligne.

## 5. Déployer
Cliquez sur **"Deploy"**. Vercel va installer les dépendances (y compris `lucid-cardano` et les correctifs que nous avons mis en place) et construire le site.

## 6. Limitations Backend
Pour l'instant, ce déploiement ne concerne que le **Frontend**.
Si votre projet utilise le serveur Node.js situé dans le dossier `backend/` (ex: pour des webhooks ou des tâches complexes), ce serveur ne tournera pas sur Vercel Frontend.
*   **Solution MVP** : Pour les tests utilisateurs, l'interaction directe Frontend <-> Supabase + Frontend <-> Blockchain (via Wallet) est généralement suffisante.

---
*Fait à Goma - WENZE Team*

