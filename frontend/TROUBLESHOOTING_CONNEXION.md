# Guide de Dépannage - Erreurs de Connexion

## 🔴 Erreurs Rencontrées

### 1. Erreurs Supabase (`ERR_CONNECTION_CLOSED` / `ERR_CONNECTION_RESET`)
```
Failed to load resource: net::ERR_CONNECTION_CLOSED
uzevxhwvyiqmnuhuplsy.supabase.co/rest/v1/...
```

### 2. Erreurs Blockfrost (`ERR_CONNECTION_CLOSED`)
```
Failed to load resource: net::ERR_CONNECTION_CLOSED
cardano-preprod.blockfrost.io/api/v0/epochs/latest/parameters
```

## 🔍 Causes Possibles

1. **Problème de connexion Internet**
2. **Serveurs Supabase/Blockfrost temporairement indisponibles**
3. **Problème de proxy/firewall**
4. **Problème de configuration réseau locale**
5. **Problème de CORS (moins probable avec ERR_CONNECTION_CLOSED)**

## ✅ Solutions

### Solution 1 : Vérifier la Connexion Internet

1. Vérifiez que vous êtes connecté à Internet
2. Testez d'autres sites web pour confirmer
3. Redémarrez votre routeur/modem si nécessaire

### Solution 2 : Vérifier le Statut des Services

#### Supabase
- Allez sur https://status.supabase.com/
- Vérifiez si tous les services sont opérationnels

#### Blockfrost
- Testez l'API directement : https://cardano-preprod.blockfrost.io/api/v0/epochs/latest
- Vérifiez si vous avez une clé API valide configurée dans `.env`

### Solution 3 : Vérifier les Variables d'Environnement

Vérifiez que votre fichier `.env` contient les bonnes valeurs :

```env
VITE_SUPABASE_URL=https://uzevxhwvyiqmnuhuplsy.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon
VITE_BLOCKFROST_PROJECT_ID=votre_project_id
```

**Important :** Après modification de `.env`, redémarrez le serveur de développement !

### Solution 4 : Redémarrer le Serveur de Développement

1. Arrêtez le serveur (Ctrl+C)
2. Supprimez le cache :
   ```bash
   rm -rf node_modules/.vite  # Linux/Mac
   rmdir /s node_modules\.vite  # Windows PowerShell
   ```
3. Redémarrez :
   ```bash
   npm run dev
   ```

### Solution 5 : Vérifier le Proxy/Firewall

1. Vérifiez si vous utilisez un proxy/VPN qui bloque les connexions
2. Désactivez temporairement le VPN/proxy pour tester
3. Vérifiez les paramètres du pare-feu Windows
4. Ajoutez une exception pour Node.js/Vite si nécessaire

### Solution 6 : Vérifier la Console Navigateur

1. Ouvrez la console (F12)
2. Allez dans l'onglet "Network"
3. Essayez de recharger la page
4. Vérifiez les requêtes qui échouent :
   - Statut HTTP (401, 403, 500, etc.)
   - Headers de réponse
   - Détails de l'erreur

### Solution 7 : Test Direct de l'API

Testez Supabase directement dans la console du navigateur :

```javascript
// Test Supabase
fetch('https://uzevxhwvyiqmnuhuplsy.supabase.co/rest/v1/products?limit=1', {
  headers: {
    'apikey': 'VOTRE_ANON_KEY',
    'Authorization': 'Bearer VOTRE_ANON_KEY'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## 🔧 Solutions Avancées

### Si le Problème Persiste avec Supabase

1. Vérifiez vos clés API dans le dashboard Supabase
2. Vérifiez les règles RLS (Row Level Security) de vos tables
3. Vérifiez les logs Supabase dans le dashboard pour voir les erreurs serveur

### Si le Problème Persiste avec Blockfrost

1. Vérifiez que votre Project ID est correct
2. Vérifiez que vous n'avez pas dépassé les limites de taux
3. Créez un nouveau projet Blockfrost si nécessaire : https://blockfrost.io/

## 📝 Logs à Vérifier

### Dans la Console du Navigateur (F12)
- Onglet "Console" : Messages d'erreur JavaScript
- Onglet "Network" : Requêtes HTTP échouées
- Onglet "Application" > "Storage" : Cookies/LocalStorage

### Dans le Terminal
- Messages d'erreur du serveur Vite
- Messages d'erreur lors du démarrage

## 🆘 Si Rien ne Fonctionne

1. **Nettoyage complet** :
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

2. **Vérifier la configuration réseau** :
   - Testez avec un autre réseau (ex: hotspot mobile)
   - Testez avec un autre navigateur
   - Testez en mode incognito

3. **Contacter le support** :
   - Supabase : https://supabase.com/support
   - Blockfrost : https://blockfrost.io/support

---

**Dernière mise à jour** : $(Get-Date -Format "yyyy-MM-dd")

