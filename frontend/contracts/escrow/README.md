# Smart Contract Escrow - Aiken

Ce dossier contient le smart contract escrow pour WENZE, écrit en Aiken.

## Structure

- `escrow.ak` - Le contrat principal
- `aiken.toml` - Configuration Aiken
- `README.md` - Ce fichier

## Installation d'Aiken

Si Aiken n'est pas installé, suivez les instructions sur https://aiken-lang.org/

```bash
# Installer Aiken (si pas déjà installé)
cargo install aiken

# Vérifier l'installation
aiken --version
```

## Compilation

```bash
cd frontend/contracts/escrow
aiken build
```

## Déploiement

Une fois compilé, le contrat peut être déployé sur Preprod Testnet ou Mainnet.






