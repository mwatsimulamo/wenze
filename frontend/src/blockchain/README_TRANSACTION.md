# 💰 Transaction avec Lucid - Guide Complet

## 📋 Vue d'ensemble

Ce dossier contient tout le code nécessaire pour créer des transactions Cardano avec Lucid.

## 🗂️ Fichiers Principaux

### `lucidService.ts`
Service principal pour gérer Lucid :
- Initialisation de Lucid
- Connexion au wallet
- Utilitaires (conversion ADA/Lovelace, explorer URL, etc.)

### `prepareAdaPayment.ts`
Fonction pour créer et envoyer une transaction de paiement :
- Création de la transaction
- Signature avec le wallet
- Envoi sur la blockchain
- Retour du hash de transaction

### `escrowService.ts`
Structure pour le smart contract escrow (à venir) :
- Fonction pour verrouiller les fonds
- Fonction pour libérer les fonds
- Intégration avec le smart contract

### `config.ts`
Configuration blockchain :
- URLs Blockfrost
- Réseaux supportés
- Paramètres de transaction

### `walletUtils.ts`
Utilitaires pour les wallets :
- Conversion d'adresses (hex/Bech32)
- Parsing de balance CBOR
- Vérification de réseau

## 🚀 Utilisation

### Créer une Transaction Simple

```typescript
import { prepareAdaPayment } from './blockchain/prepareAdaPayment';

const result = await prepareAdaPayment(
  orderId,
  amountAda,
  sellerAddress // Optionnel
);

if (result.status === 'success') {
  console.log('Transaction envoyée:', result.txHash);
  console.log('Explorer:', result.explorerUrl);
}
```

### Utiliser Lucid Directement

```typescript
import { getLucid } from './blockchain/lucidService';

const lucid = getLucid();
const tx = await lucid
  .newTx()
  .payToAddress(address, { lovelace: amount })
  .complete();

const signedTx = await tx.sign().complete();
const txHash = await signedTx.submit();
```

## ⚠️ Pour l'Escrow

Pour un **vrai escrow**, les fonds doivent aller dans le **smart contract**, pas directement au vendeur.

**Flux complet :**
1. Acheteur paie → Smart Contract Escrow
2. Vendeur confirme → Les fonds restent dans l'escrow
3. Acheteur confirme → Les fonds sont libérés

## 🧪 Tests

Voir `GUIDE_TEST_TRANSACTION.md` pour les instructions de test complètes.

## 📚 Ressources

- **Documentation Lucid** : https://lucid.spacebudz.io/
- **Preprod Faucet** : https://docs.cardano.org/cardano-testnet/tools/faucet
- **Preprod Explorer** : https://preprod.cardanoscan.io/









