# 🎯 Comment Obtenir une Clé API Blockfrost

## 📋 Guide Étape par Étape (5 minutes)

### Étape 1 : Créer un Compte Blockfrost

1. **Aller sur Blockfrost** : https://blockfrost.io/
2. **Cliquer sur "Sign Up"** (en haut à droite)
3. **Remplir le formulaire** :
   - Email
   - Mot de passe (minimum 8 caractères)
   - Confirmer le mot de passe
4. **Cliquer sur "Sign Up"**
5. **Vérifier votre email** :
   - Ouvrir votre boîte email
   - Cliquer sur le lien de confirmation
   - Votre compte sera activé

### Étape 2 : Se Connecter

1. **Retourner sur** : https://blockfrost.io/
2. **Cliquer sur "Sign In"**
3. **Entrer** votre email et mot de passe
4. **Cliquer sur "Sign In"**

### Étape 3 : Créer un Projet Preprod

1. **Aller dans le Dashboard** : https://blockfrost.io/dashboard
2. **Cliquer sur "Create a Project"** ou le bouton **"+"** ou **"New Project"**

3. **Remplir le formulaire** :
   ```
   Name: WENZE Preprod
   Network: Preprod  ⚠️ IMPORTANT : Sélectionner "Preprod" (pas Mainnet)
   Description: (optionnel) Projet pour WENZE Marketplace sur Preprod Testnet
   Plan: Free
   ```

4. **Cliquer sur "Create Project"** ou "Create"

### Étape 4 : Copier la Clé API

Une fois le projet créé :

1. **Vous serez redirigé** vers la page du projet
2. **Vous verrez la "Project ID"** (c'est votre clé API)
   - Format : `preprodABC123XYZ789...`
   - **Commence toujours par `preprod`** pour Preprod Testnet
   - Environ 32-40 caractères

3. **Cliquer sur le bouton "Copy"** à côté de la clé
   - Ou sélectionner toute la clé et faire Ctrl+C

4. **⚠️ IMPORTANT** : Gardez cette clé précieusement ! Vous en aurez besoin maintenant.

---

## 📝 Étape 5 : Ajouter la Clé dans .env

### Localiser le Fichier .env

**Emplacement** : `C:\Users\PC\wenze\frontend\.env`

### Ouvrir le Fichier

1. **Aller dans l'explorateur de fichiers**
2. **Naviguer vers** : `C:\Users\PC\wenze\frontend\`
3. **Chercher** un fichier nommé `.env`

**Si le fichier n'existe pas** :
- Créer un nouveau fichier texte
- Le renommer en `.env` (avec le point au début)

### Ajouter la Clé

1. **Ouvrir le fichier** avec Notepad, VS Code, ou n'importe quel éditeur

2. **Ajouter cette ligne** (ou modifier si elle existe déjà) :

```env
VITE_BLOCKFROST_PROJECT_ID=preprodXXXXXXXXXX
```

**Remplacez `preprodXXXXXXXXXX` par la clé que vous avez copiée.**

### Exemple Concret

Si votre clé Blockfrost est : `preprodABC123XYZ789DEF456`

Alors votre fichier `.env` doit contenir :

```env
VITE_BLOCKFROST_PROJECT_ID=preprodABC123XYZ789DEF456
```

### Format Important

- ✅ **Correct** : `VITE_BLOCKFROST_PROJECT_ID=preprodABC123`
- ❌ **Incorrect** : `VITE_BLOCKFROST_PROJECT_ID = preprodABC123` (espaces)
- ❌ **Incorrect** : `VITE_BLOCKFROST_PROJECT_ID="preprodABC123"` (guillemets)
- ❌ **Incorrect** : `VITE_BLOCKFROST_PROJECT_ID=mainnetABC123` (mauvais réseau)

### Sauvegarder

- **Ctrl+S** pour sauvegarder
- **Fermer l'éditeur**

---

## 🔄 Étape 6 : Redémarrer le Serveur

**⚠️ CRITIQUE** : Après avoir modifié `.env`, vous DEVEZ redémarrer le serveur.

1. **Dans le terminal**, appuyer sur **Ctrl+C** pour arrêter le serveur

2. **Redémarrer** :
   ```bash
   cd frontend
   npm run dev
   ```

3. **Attendre** que le serveur démarre (vous verrez `Local: http://localhost:5173/`)

4. **Rafraîchir la page** dans le navigateur (F5)

---

## ✅ Étape 7 : Vérifier que ça Fonctionne

### Ouvrir la Console

1. **Ouvrir votre application** dans le navigateur
2. **Appuyer sur F12** pour ouvrir la console
3. **Aller dans l'onglet "Console"**
4. **Recharger la page** (F5)

### Vérifier les Messages

**✅ Si tout fonctionne, vous verrez :**
```
🔧 Tentative d'initialisation de Lucid avec Blockfrost...
📡 URL Blockfrost: https://cardano-preprod.blockfrost.io/api/v0
🔑 Project ID configuré: preprod123...
✅ Lucid initialisé avec Blockfrost avec succès
```

**❌ Si ça ne fonctionne pas :**
```
⚠️ Blockfrost non configuré
🔑 Project ID configuré: NON CONFIGURÉ
❌ Erreur avec Blockfrost: ...
```

---

## 🎯 Si vous Avez Déjà une Clé

Si vous avez déjà configuré une clé Blockfrost mais que Lucid ne fonctionne pas :

### Vérifier la Clé Actuelle

1. **Ouvrir** `frontend/.env`
2. **Chercher** : `VITE_BLOCKFROST_PROJECT_ID=...`
3. **Vérifier** :
   - La clé commence-t-elle par `preprod` ? ✅
   - Y a-t-il des espaces ? ❌
   - Y a-t-il des guillemets ? ❌

### Si la Clé est Incorrecte

1. **Aller sur Blockfrost Dashboard** : https://blockfrost.io/dashboard
2. **Vérifier votre projet** :
   - Est-il actif ?
   - Est-il pour Preprod ?
3. **Copier la clé correcte**
4. **Mettre à jour** `.env`
5. **Redémarrer le serveur**

### Si vous Voulez une Nouvelle Clé

1. **Aller sur Blockfrost Dashboard**
2. **Créer un nouveau projet** pour Preprod
3. **Copier la nouvelle clé**
4. **Mettre à jour** `.env` avec la nouvelle clé
5. **Redémarrer le serveur**

---

## 📋 Checklist Rapide

- [ ] Compte Blockfrost créé ✅
- [ ] Projet créé pour **Preprod Testnet** ✅
- [ ] Clé API copiée (commence par `preprod`) ✅
- [ ] Fichier `.env` créé/modifié dans `frontend/` ✅
- [ ] Variable `VITE_BLOCKFROST_PROJECT_ID` ajoutée ✅
- [ ] Pas d'espaces autour du `=` ✅
- [ ] Pas de guillemets ✅
- [ ] Serveur redémarré ✅
- [ ] Console affiche : `✅ Lucid initialisé avec succès` ✅

---

## 🔗 Liens Directs

- **Blockfrost** : https://blockfrost.io/
- **Blockfrost Dashboard** : https://blockfrost.io/dashboard
- **Preprod Faucet** (pour obtenir des ADA de test) : https://docs.cardano.org/cardano-testnet/tools/faucet

---

## 💡 Conseils

1. **Utilisez Preprod pour les tests** : C'est gratuit et sans risque
2. **Gardez votre clé secrète** : Ne la partagez jamais publiquement
3. **Testez avec peu d'ADA** : Pour vérifier que tout fonctionne
4. **Vérifiez les limites** : Blockfrost Free a des limites de requêtes par jour









