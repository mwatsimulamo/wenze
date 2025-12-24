# Guide de Déploiement sur Vercel - WENZE

## 🚀 Configuration Rapide

### 1. Prérequis
- Compte Vercel (gratuit) : [vercel.com](https://vercel.com)
- Repository GitHub avec le code
- Variables d'environnement Supabase prêtes

### 2. Configuration du Projet sur Vercel

#### Étape 1 : Importer le projet
1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **"Add New..."** > **"Project"**
3. Importez votre dépôt GitHub `wenze`

#### Étape 2 : Configuration du Build (IMPORTANT)
Dans les paramètres du projet, configurez :

- **Framework Preset** : `Vite` (détecté automatiquement)
- **Root Directory** : `frontend` ⚠️ **CRUCIAL** - Cliquez sur "Edit" et sélectionnez le dossier `frontend`
- **Build Command** : `npm run build` (ou laissé par défaut)
- **Output Directory** : `dist`
- **Install Command** : `npm install` (par défaut)

#### Étape 3 : Variables d'Environnement
Dans **Settings** > **Environment Variables**, ajoutez :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

⚠️ **Important** : Ces variables sont nécessaires pour que l'authentification fonctionne.

### 3. Déploiement

1. Cliquez sur **"Deploy"**
2. Vercel va :
   - Installer les dépendances (`npm install`)
   - Exécuter le script `postinstall` (crée le stub `stream-browserify/web.js`)
   - Builder l'application (`npm run build`)
   - Déployer sur un URL unique

### 4. Vérification Post-Déploiement

Après le déploiement, vérifiez :
- ✅ L'application se charge correctement
- ✅ L'authentification fonctionne (connexion/inscription)
- ✅ Les produits s'affichent
- ✅ Le wallet se connecte (testnet)

## 🔧 Résolution de Problèmes

### Erreur de build `stream-browserify/web`
Le script `postinstall` devrait créer automatiquement le fichier stub. Si l'erreur persiste :
1. Vérifiez que `scripts/fix-stream-browserify.cjs` existe
2. Vérifiez les logs de build pour voir si le script s'exécute

### Variables d'environnement manquantes
Si l'authentification ne fonctionne pas :
1. Vérifiez que les variables sont bien définies dans Vercel
2. Redéployez après avoir ajouté les variables

### Erreur de routing (404 sur les pages)
Le fichier `vercel.json` configure déjà les rewrites pour React Router. Si le problème persiste, vérifiez que le fichier est bien dans le dossier `frontend/`.

## 📝 Notes

- Le backend Node.js (`backend/`) n'est **pas** déployé sur Vercel (c'est un service frontend)
- Pour le backend, utilisez un autre service (Render, Railway, etc.)
- Le frontend communique directement avec Supabase et la blockchain Cardano

## 🎉 C'est prêt !

Une fois déployé, vous obtiendrez une URL comme : `https://wenze.vercel.app`

---

*Fait à Goma - WENZE Team*

