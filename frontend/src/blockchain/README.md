# Intégration Blockchain WENZE

Ce dossier contient la logique d'interaction avec la Blockchain (le cœur du projet).

## Architecture Prévue

L'objectif est de sécuriser les transactions via des Smart Contracts (Escrow).

### Structure actuelle
- `connectWallet.ts` : Gestion de la connexion aux portefeuilles (ex: Nami, Eternl pour Cardano, ou Metamask pour EVM).
- `prepareAdaPayment.ts` : Logique de préparation de la transaction de verrouillage des fonds.
- `prepareAdaRelease.ts` : Logique de libération des fonds une fois le produit reçu.

### Prochaines Étapes
1. **Définir le Smart Contract** : Rédiger le script de validation (Plutus pour Cardano ou Solidity pour EVM).
2. **Intégration SDK** : Utiliser `lucid-cardano` ou `ethers.js` pour interagir avec le contrat.
3. **État Global** : Connecter ces fonctions au `AuthContext` ou un nouveau `BlockchainContext`.

> **Note pour l'équipe** : La confiance est la clé à Goma. Assurez-vous que les messages d'erreur et de succès dans ces fichiers soient clairs et traduits en Français.

