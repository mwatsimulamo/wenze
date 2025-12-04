# 🔍 Diagnostic : Problème d'Initialisation Lucid

## ❌ Problème

Blockfrost est configuré dans `.env`, les requêtes apparaissent dans le tableau de bord Blockfrost, mais Lucid n'est toujours pas initialisé lors des transactions.

## 🔍 Étapes de Diagnostic

### 1. Vérifier la Configuration Blockfrost

1. **Vérifier le fichier `.env`** :
   - Le fichier doit être dans `frontend/.env` (pas dans la racine)
   - Format : `VITE_BLOCKFROST_PROJECT_ID=votre_cle_api`
   - Pas d'espaces autour du `=`
   - Pas de guillemets autour de la clé

2. **Vérifier que le serveur a été redémarré** :
   - Après modification de `.env`, il faut **redémarrer le serveur de développement**
   - Arrêter avec `Ctrl+C`
   - Relancer avec `npm run dev`

### 2. Vérifier l'Initialisation de Lucid

Lucid est initialisé dans `BlockchainContext.tsx` lors de :
- La connexion d'un wallet
- Le chargement d'un wallet depuis localStorage

**Vérifier dans la console :**
- Chercher : `✅ Lucid initialisé avec succès`
- Ou : `⚠️ Lucid ne peut pas être initialisé`

### 3. Vérifier que le Wallet est Connecté

1. Connecter un wallet Cardano (Nami, Eternl, etc.)
2. Vérifier dans la console qu'il n'y a pas d'erreur lors de la connexion
3. Vérifier que l'adresse du wallet s'affiche dans la navbar

### 4. Vérifier les Logs d'Erreur

Dans la console du navigateur, chercher :
- `⚠️ Blockfrost non configuré`
- `⚠️ Erreur avec Blockfrost`
- `❌ Erreur lors de l'initialisation de Lucid`

## ✅ Solutions

### Solution 1 : Redémarrer le Serveur

Si vous avez modifié `.env` sans redémarrer :

```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

### Solution 2 : Vérifier la Clé Blockfrost

1. Aller sur https://blockfrost.io/dashboard
2. Vérifier que la clé API est active
3. Vérifier que c'est bien pour **Preprod Testnet** (pas Mainnet)
4. Copier la clé et la coller dans `.env`

### Solution 3 : Vérifier le Format du .env

Le fichier `frontend/.env` doit contenir exactement :

```env
VITE_BLOCKFROST_PROJECT_ID=preprodxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Points importants :**
- Pas d'espaces
- Pas de guillemets
- Le préfixe doit être présent dans la variable

### Solution 4 : Déconnecter et Reconnecter le Wallet

1. Déconnecter le wallet dans l'application
2. Déconnecter dans l'extension wallet
3. Reconnecter le wallet
4. Vérifier les logs dans la console

## 🔧 Code Amélioré

Le code a été amélioré pour :
- ✅ Utiliser le Lucid du contexte plutôt que l'instance globale
- ✅ Afficher des messages de diagnostic plus clairs
- ✅ Gérer gracieusement l'absence de Lucid (mode simulation)

## 📝 Logs à Vérifier

Ouvrez la console du navigateur et cherchez :

```
✅ Lucid initialisé avec succès
```

Ou :

```
⚠️ Lucid ne peut pas être initialisé: [message d'erreur]
💡 Vérifiez que :
   1. Blockfrost est configuré dans .env (VITE_BLOCKFROST_PROJECT_ID)
   2. Le wallet est connecté
   3. Le serveur a été redémarré après la configuration de .env
```

## 🆘 Si le Problème Persiste

1. Vérifier les logs dans la console
2. Partager les messages d'erreur exacts
3. Vérifier que Blockfrost répond bien (voir dans le tableau de bord)
4. Essayer avec une autre clé API Blockfrost




