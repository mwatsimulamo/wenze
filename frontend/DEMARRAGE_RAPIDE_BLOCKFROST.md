# ⚡ Démarrage Rapide : Configurer Blockfrost en 5 Minutes

## 🎯 Objectif

Faire fonctionner Lucid avec Blockfrost pour avoir de **vraies transactions blockchain** au lieu de simulations.

---

## 📍 ÉTAPE 1 : Obtenir une Clé API (3 minutes)

### 1. Aller sur Blockfrost
**Lien** : https://blockfrost.io/

### 2. Créer un Compte
- Cliquer sur "Sign Up"
- Remplir : Email, Mot de passe
- Confirmer l'email

### 3. Se Connecter
- Aller sur : https://blockfrost.io/dashboard
- Cliquer sur "Sign In"
- Entrer email et mot de passe

### 4. Créer un Projet
- Cliquer sur "Create a Project"
- Remplir :
  - **Name** : `WENZE Preprod`
  - **Network** : **Preprod** ⚠️ (pas Mainnet)
  - **Plan** : Free
- Cliquer sur "Create"

### 5. Copier la Clé API
- Cliquer sur votre projet
- Copier la "Project ID" (commence par `preprod...`)

---

## 📝 ÉTAPE 2 : Configurer dans .env (1 minute)

### 1. Ouvrir le Fichier
**Emplacement** : `C:\Users\PC\wenze\frontend\.env`

Si le fichier n'existe pas, le créer.

### 2. Ajouter la Clé
**Ajouter cette ligne** :

```env
VITE_BLOCKFROST_PROJECT_ID=preprodXXXXXXXXXX
```

**Remplacez `preprodXXXXXXXXXX` par votre vraie clé.**

### 3. Format Important
- ✅ Pas d'espaces : `VITE_BLOCKFROST_PROJECT_ID=preprodABC123`
- ✅ Pas de guillemets
- ✅ La clé doit commencer par `preprod`

### 4. Sauvegarder
- Ctrl+S

---

## 🔄 ÉTAPE 3 : Redémarrer (1 minute)

1. **Arrêter** le serveur (Ctrl+C)
2. **Redémarrer** :
   ```bash
   cd frontend
   npm run dev
   ```
3. **Rafraîchir** la page (F5)

---

## ✅ ÉTAPE 4 : Vérifier (30 secondes)

1. **Ouvrir la console** (F12)
2. **Chercher** :
   - ✅ `✅ Lucid initialisé avec Blockfrost avec succès`
   - ❌ `⚠️ Blockfrost non configuré`

---

## 🎯 C'est Fait !

Si vous voyez le message de succès, Lucid fonctionne avec Blockfrost !

---

## 🆘 Si ça ne Marche Pas

1. Vérifier que la clé commence par `preprod`
2. Vérifier qu'il n'y a pas d'espaces dans `.env`
3. Vérifier que le serveur a été redémarré
4. Vider le cache : supprimer `node_modules/.vite`

---

## 📖 Guide Détaillé

Pour plus de détails, voir : `GUIDE_PRATIQUE_COMPLET.md`




