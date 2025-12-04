# Installation et Compilation du Contrat Escrow

## Prérequis

1. **Installer Rust** (si pas déjà installé) :
   ```bash
   # Windows (PowerShell)
   winget install Rustlang.Rustup
   
   # Ou télécharger depuis https://rustup.rs/
   ```

2. **Installer Aiken** :
   ```bash
   cargo install aiken
   ```

3. **Vérifier l'installation** :
   ```bash
   aiken --version
   ```

## Compilation

1. **Aller dans le dossier du contrat** :
   ```bash
   cd frontend/contracts/escrow
   ```

2. **Compiler le contrat** :
   ```bash
   aiken build
   ```

3. **Le contrat compilé sera dans** :
   ```
   build/escrow.plutus
   ```

## Utilisation dans l'Application

Une fois compilé, le contrat peut être utilisé via `escrowContract.ts` :

```typescript
import { lockFundsInEscrow, releaseFundsFromEscrow } from './blockchain/escrowContract';

// Verrouiller les fonds
const { txHash, escrowAddress, escrowUtxo } = await lockFundsInEscrow(
  orderId,
  amountAda,
  buyerAddress,
  sellerAddress
);

// Libérer les fonds
const releaseTxHash = await releaseFundsFromEscrow(
  escrowUtxo,
  sellerAddress
);
```

## Structure du Contrat

- **Datum** : Contient `order_id`, `buyer`, `seller`, `amount`, `deadline`
- **Redeemer "release"** : Libère les fonds au vendeur (doit être signé par l'acheteur)
- **Redeemer "cancel"** : Annule l'escrow et rembourse l'acheteur (si délai expiré)

