# ✅ Vérification : Configuration Blockfrost

## 🔍 Comment Vérifier si Blockfrost est Configuré

### Méthode 1 : Vérifier dans la Console

1. **Ouvrir la console du navigateur** (F12)
2. **Recharger la page** (F5)
3. **Chercher** dans la console :

```
🔧 Tentative d'initialisation de Lucid avec Blockfrost...
🔑 Project ID configuré: preprod...
```

**Si vous voyez :**
- `🔑 Project ID configuré: preprod...` ✅ **Blockfrost est configuré**
- `🔑 Project ID configuré: NON CONFIGURÉ` ❌ **Blockfrost n'est pas configuré**

### Méthode 2 : Vérifier le Fichier .env

1. **Ouvrir** `frontend/.env`
2. **Chercher** la ligne :
   ```
   VITE_BLOCKFROST_PROJECT_ID=preprod...
   ```

**Si la ligne existe** avec une clé qui commence par `preprod`, alors Blockfrost est configuré.

### Méthode 3 : Vérifier dans Blockfrost Dashboard

1. **Aller sur** : https://blockfrost.io/dashboard
2. **Voir les "Requests"** (requêtes)
3. **Si vous voyez des requêtes**, cela signifie que Lucid utilise Blockfrost.

## 📝 Format de la Clé

La clé Blockfrost pour Preprod Testnet doit :
- ✅ Commencer par `preprod`
- ✅ Avoir environ 32 caractères
- ✅ Exemple : `preprodABC123XYZ789...`

## 🔧 Si la Clé n'est Pas Configurée

Suivez le guide : `GUIDE_ETAPE_PAR_ETAPE_BLOCKFROST.md`




