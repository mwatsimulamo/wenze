# Guide de Compilation et Déploiement du Contrat Escrow

## Prérequis

1. **Installer Aiken** :
   ```bash
   cargo install aiken
   ```

2. **Vérifier l'installation** :
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

## Déploiement sur Preprod Testnet

### Option 1: Utiliser Lucid pour déployer

Une fois compilé, vous pouvez utiliser Lucid pour déployer le contrat :

```typescript
import { loadEscrowValidator, getEscrowAddress } from './blockchain/escrowContract';

const validator = await loadEscrowValidator();
const address = await getEscrowAddress(lucid, validator);
console.log('Adresse du contrat:', address);
```

### Option 2: Utiliser un outil de déploiement

Vous pouvez utiliser des outils comme :
- **Cardano CLI** avec des scripts de déploiement
- **Mesh** pour le déploiement simplifié
- **Plutus Application Backend (PAB)**

## Configuration dans l'Application

Une fois le contrat déployé, ajoutez l'adresse dans `.env` :

```env
VITE_ESCROW_CONTRACT_ADDRESS=addr_test1...
```

## Tests

Pour tester le contrat avant le déploiement :

```bash
aiken check
aiken test
```

## Structure du Contrat

- **Datum** : Contient les informations de la transaction (order_id, buyer, seller, amount, deadline)
- **Redeemer "release"** : Libère les fonds au vendeur (doit être signé par l'acheteur)
- **Redeemer "cancel"** : Annule l'escrow et rembourse l'acheteur (si le délai est expiré)

## Sécurité

- Le contrat vérifie que seul l'acheteur peut libérer les fonds
- Le contrat vérifie que le délai est expiré avant d'autoriser l'annulation
- Les fonds sont verrouillés dans le contrat jusqu'à la libération ou l'annulation






