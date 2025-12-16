# Installation de lucid-evolution pour Support PlutusV3

## 📦 Installation

```bash
cd frontend
npm install @no-witness-labs/lucid-evolution
```

## ✅ Modifications Effectuées

Tous les imports de `lucid-cardano` ont été remplacés par `@no-witness-labs/lucid-evolution` dans les fichiers suivants :

- ✅ `frontend/src/blockchain/lucidService.ts`
- ✅ `frontend/src/blockchain/escrowContract.ts`
- ✅ `frontend/src/blockchain/prepareAdaPayment.ts`
- ✅ `frontend/src/blockchain/prepareAdaRelease.ts`
- ✅ `frontend/src/blockchain/escrowService.ts`
- ✅ `frontend/src/blockchain/testV2Compatibility.ts`
- ✅ `frontend/src/context/BlockchainContext.tsx`

## 🧪 Test

Après installation, testez :

1. **Démarrer le serveur de développement** :
   ```bash
   npm run dev
   ```

2. **Connecter un wallet** (Nami, Eternl, etc.) sur Preprod testnet

3. **Essayer une transaction escrow** :
   - Aller sur une page produit
   - Cliquer sur "Acheter"
   - La transaction devrait maintenant fonctionner avec le contrat PlutusV3

## 📋 Vérifications

- ✅ Les imports sont corrects
- ⏳ Installation de la dépendance (à faire manuellement)
- ⏳ Test du contrat PlutusV3

## 🔍 En cas d'erreur

Si vous rencontrez des erreurs après installation :

1. **Vérifier l'installation** :
   ```bash
   npm list @no-witness-labs/lucid-evolution
   ```

2. **Vérifier les logs de la console** (F12) pour voir les erreurs spécifiques

3. **Documentation** : https://no-witness-labs.github.io/lucid-evolution/

## 🎯 Avantages de lucid-evolution

- ✅ Support PlutusV3 immédiat
- ✅ API similaire à lucid-cardano
- ✅ Compatible avec les scripts compilés par Aiken
- ✅ Fonctionne sur Cardano Preprod

---

**Note** : Assurez-vous que votre wallet est connecté au réseau **Preprod Testnet** pour tester les transactions.

