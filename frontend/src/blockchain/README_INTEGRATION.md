# 🔗 Intégration Smart Contract - Documentation

## 📋 État Actuel

### ✅ Ce qui est prêt

1. **Contexte Blockchain Global** (`BlockchainContext.tsx`)
   - Gestion de l'état du wallet dans toute l'application
   - Persistence dans localStorage
   - Reconnexion automatique
   - Détection réseau (testnet/mainnet)

2. **Configuration Blockchain** (`blockchain/config.ts`)
   - Configuration pour Preprod Testnet
   - Configuration Blockfrost
   - Messages d'erreur en français
   - Paramètres de transaction

3. **Utilitaires Wallet** (`blockchain/walletUtils.ts`)
   - Parsing CBOR
   - Conversion adresses
   - Conversion ADA/Lovelace
   - Vérification réseau

4. **Intégration dans l'Application**
   - `BlockchainProvider` dans `App.tsx`
   - Navbar utilise le contexte global
   - Prêt pour les transactions

### ⚠️ Ce qui reste à faire

1. **Installer Lucid** pour les transactions Cardano
2. **Configurer Blockfrost** (optionnel, pour lire la blockchain)
3. **Implémenter les transactions réelles** dans `prepareAdaPayment.ts` et `prepareAdaRelease.ts`
4. **Intégrer le Smart Contract** une fois déployé

## 🚀 Prochaines Étapes

### Étape 1 : Installer Lucid

```bash
cd frontend
npm install lucid-cardano
```

### Étape 2 : Configurer Blockfrost (Optionnel)

1. Créer un compte sur https://blockfrost.io/
2. Obtenir une clé API pour Preprod Testnet
3. Ajouter dans `.env` :
   ```
   VITE_BLOCKFROST_PROJECT_ID=your_testnet_key
   ```

### Étape 3 : Implémenter les Transactions

Voir `SYNTHESE_SMART_CONTRACT_ESCROW.md` pour l'architecture du smart contract.

Les fichiers à modifier :
- `blockchain/prepareAdaPayment.ts` : Verrouiller les fonds en escrow
- `blockchain/prepareAdaRelease.ts` : Libérer les fonds après confirmation

### Étape 4 : Intégrer le Smart Contract

Une fois le contrat Aiken compilé et déployé :
1. Obtenir l'adresse du contrat
2. Intégrer dans les transactions
3. Gérer le Datum et les Redeemers

## 📚 Documentation

- **Vérification Wallet** : `GUIDE_TEST_WALLET.md`
- **Diagnostic** : `DIAGNOSTIC_WALLET.md`
- **Résumé** : `RESUME_VERIFICATION.md`
- **Smart Contract** : `SYNTHESE_SMART_CONTRACT_ESCROW.md`

## 🔗 Ressources

- **Faucet Preprod** : https://docs.cardano.org/cardano-testnet/tools/faucet
- **Explorateur Preprod** : https://preprod.cardanoscan.io/
- **Documentation CIP-30** : https://cips.cardano.org/cips/cip30/
- **Documentation Lucid** : https://lucid.spacebudz.io/
- **Blockfrost** : https://blockfrost.io/









