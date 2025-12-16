# 🎥 Tutoriel : Obtenir et Configurer Blockfrost

## 📝 Étapes à Suivre (avec captures d'écran)

### 1. Créer un Compte Blockfrost

1. Aller sur : **https://blockfrost.io/**
2. Cliquer sur **"Sign Up"** (en haut à droite)
3. Remplir :
   - Email
   - Mot de passe
4. Confirmer l'email

### 2. Créer un Projet

1. Se connecter sur : **https://blockfrost.io/dashboard**
2. Cliquer sur **"Create a Project"**
3. Remplir :
   - **Name** : `WENZE Preprod`
   - **Network** : **Preprod** ⚠️
   - **Plan** : Free
4. Cliquer sur **"Create"**

### 3. Copier la Clé

1. Sur la page du projet, vous verrez **"Project ID"**
2. Cliquer sur **"Copy"** à côté de la clé
3. La clé ressemble à : `preprodABC123...`

### 4. Configurer dans .env

1. Ouvrir : `frontend/.env`
2. Ajouter : `VITE_BLOCKFROST_PROJECT_ID=preprodABC123...`
3. Sauvegarder

### 5. Redémarrer

1. Arrêter le serveur (Ctrl+C)
2. Redémarrer : `npm run dev`
3. Rafraîchir la page (F5)

### 6. Vérifier

Ouvrir la console (F12) et chercher :
- ✅ `✅ Lucid initialisé avec Blockfrost avec succès`

## 🆘 Besoin d'Aide ?

Voir le guide complet : `GUIDE_COMPLET_BLOCKFROST.md`









