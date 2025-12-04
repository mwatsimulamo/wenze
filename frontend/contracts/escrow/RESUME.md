# Résumé - Smart Contract Escrow avec Aiken

## ✅ Ce qui a été créé

### 1. Contrat Aiken (`escrow.ak`)
- **Fichier** : `frontend/contracts/escrow/escrow.ak`
- **Fonctionnalités** :
  - Verrouille les fonds dans un escrow
  - Permet de libérer les fonds au vendeur (signé par l'acheteur)
  - Permet d'annuler et récupérer les fonds si le délai expire

### 2. Configuration Aiken (`aiken.toml`)
- **Fichier** : `frontend/contracts/escrow/aiken.toml`
- Configuration du projet Aiken

### 3. Service TypeScript (`escrowContract.ts`)
- **Fichier** : `frontend/src/blockchain/escrowContract.ts`
- Fonctions pour interagir avec le contrat :
  - `lockFundsInEscrow()` - Verrouiller les fonds
  - `releaseFundsFromEscrow()` - Libérer les fonds au vendeur
  - `cancelEscrow()` - Annuler l'escrow
  - `getEscrowUtxos()` - Récupérer les UTXOs de l'escrow

### 4. Documentation
- `README.md` - Vue d'ensemble
- `BUILD.md` - Guide de compilation et déploiement
- `INSTALL.md` - Guide d'installation

## 📋 Prochaines étapes

### 1. Compiler le contrat
```bash
cd frontend/contracts/escrow
aiken build
```

### 2. Intégrer dans `prepareAdaPayment.ts`
Modifier `prepareAdaPayment` pour utiliser `lockFundsInEscrow` au lieu d'une transaction directe.

### 3. Intégrer dans `prepareAdaRelease.ts`
Modifier `prepareAdaRelease` pour utiliser `releaseFundsFromEscrow`.

### 4. Mettre à jour le flux de commande
- Lors de l'achat : utiliser `lockFundsInEscrow`
- Lors de la confirmation de réception : utiliser `releaseFundsFromEscrow`
- Gérer les timeouts avec `cancelEscrow`

## 🔧 Structure du Datum

```typescript
{
  order_id: ByteArray,      // ID de la commande
  buyer: VerificationKeyHash, // Clé de vérification de l'acheteur
  seller: VerificationKeyHash, // Clé de vérification du vendeur
  amount: Int,              // Montant en Lovelace
  deadline: Int             // Timestamp Unix en millisecondes
}
```

## 🔐 Sécurité

- ✅ Seul l'acheteur peut libérer les fonds (vérification de signature)
- ✅ L'annulation n'est possible qu'après expiration du délai
- ✅ Les fonds sont verrouillés dans le contrat jusqu'à libération/annulation

