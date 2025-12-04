# Guide Complet - Contrat Escrow avec Aiken

## 📋 Vue d'ensemble

Ce contrat escrow permet de sécuriser les transactions sur WENZE en verrouillant les fonds jusqu'à confirmation de réception.

## 🚀 Démarrage Rapide

### 1. Installation d'Aiken

**Option A: Via Cargo (Recommandé)**
```powershell
# Installer Rust d'abord (si pas déjà installé)
# Télécharger depuis https://rustup.rs/

# Installer Aiken
cargo install aiken
```

**Option B: Via Binaries**
- Télécharger depuis https://github.com/aiken-lang/aiken/releases
- Extraire `aiken.exe` et l'ajouter au PATH

**Vérifier:**
```powershell
aiken --version
```

### 2. Compilation Automatique

Utilisez le script PowerShell fourni :
```powershell
cd frontend/contracts/escrow
.\install_and_build.ps1
```

### 3. Compilation Manuelle

```powershell
cd frontend/contracts/escrow
aiken build
aiken check
```

## 📁 Structure du Projet

```
contracts/escrow/
├── escrow.ak              # Code source du contrat
├── test.ak                # Tests unitaires
├── aiken.toml             # Configuration Aiken
├── install_and_build.ps1   # Script d'installation
├── build/                  # Dossier de compilation (généré)
│   └── escrow.plutus       # Contrat compilé
└── plutus.json             # JSON du contrat (pour Lucid)
```

## 🔧 Fonctionnalités du Contrat

### Datum (Données stockées)
- `order_id`: ID de la commande
- `buyer`: Clé de vérification de l'acheteur
- `seller`: Clé de vérification du vendeur
- `amount`: Montant en Lovelace
- `deadline`: Timestamp d'expiration (millisecondes)

### Redeemers (Actions)
- **release**: Libère les fonds au vendeur (doit être signé par l'acheteur)
- **cancel**: Annule l'escrow et rembourse l'acheteur (si délai expiré)

## 🔐 Sécurité

- ✅ Seul l'acheteur peut libérer les fonds (vérification de signature)
- ✅ L'annulation n'est possible qu'après expiration du délai
- ✅ Les fonds sont verrouillés dans le contrat jusqu'à libération/annulation

## 📝 Utilisation dans l'Application

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

## 🧪 Tests

```powershell
aiken test
```

## ⚠️ Dépannage

### Aiken non trouvé
- Vérifiez que Aiken est dans le PATH
- Redémarrez le terminal après l'installation
- Sur Windows, redémarrez l'ordinateur si nécessaire

### Erreurs de compilation
- Vérifiez la syntaxe Aiken
- Utilisez `aiken check` pour voir les erreurs détaillées
- Consultez la documentation Aiken: https://aiken-lang.org/

### Erreurs Rust/Cargo
- Installez Rust depuis https://rustup.rs/
- Sur Windows, installez les outils de build Visual Studio

## 📚 Ressources

- **Documentation Aiken**: https://aiken-lang.org/
- **Exemples Aiken**: https://github.com/aiken-lang/awesome-aiken
- **Documentation Cardano**: https://developers.cardano.org/

