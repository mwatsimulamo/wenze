# Guide d'Intégration de l'Escrow - WENZE

## ✅ État Actuel

L'intégration de l'escrow est maintenant **fonctionnelle** dans l'application. Le système utilise des smart contracts Cardano pour sécuriser les transactions.

## 📋 Ce qui a été implémenté

### 1. **Fonctions Escrow** (`frontend/src/blockchain/escrowContract.ts`)
- ✅ `lockFundsInEscrow()` - Verrouille les fonds dans le contrat escrow
- ✅ `releaseFundsFromEscrow()` - Libère les fonds au vendeur
- ✅ `cancelEscrow()` - Annule l'escrow si le délai expire
- ✅ `getEscrowUtxos()` - Récupère les UTXOs d'une commande
- ✅ `checkEscrowStatus()` - Vérifie l'état de l'escrow

### 2. **Intégration dans le Flux**
- ✅ **Achat** (`ProductDetail.tsx`) : Utilise `lockFundsInEscrow` lors du paiement
- ✅ **Libération** (`OrderDetail.tsx`) : Utilise `releaseFundsFromEscrow` lors de la confirmation de réception
- ✅ **Gestion des erreurs** : Messages d'erreur clairs et gestion des échecs

### 3. **Contrat Escrow**

Le contrat utilise actuellement un contrat inline minimal (AlwaysSucceeds) pour les **tests de développement**.

⚠️ **IMPORTANT** : Pour la production, vous DEVEZ compiler le contrat Aiken et le remplacer !

## 🔧 Compilation du Contrat Aiken

### Option 1 : Utiliser le contrat compilé (Recommandé pour Production)

1. **Compiler le contrat Aiken** :
   ```bash
   cd frontend/contracts/escrow
   aiken build
   ```

2. **Copier le contrat compilé** :
   - Le contrat compilé sera généré dans `plutus.json`
   - Copiez-le dans `frontend/public/contracts/escrow.plutus.json`

3. **Le système chargera automatiquement** le contrat compilé lors de l'exécution

### Option 2 : Contrat inline (Tests uniquement)

Le système utilise actuellement un contrat minimal pour les tests. **Ne l'utilisez PAS en production !**

## 📝 Structure du Datum

```typescript
{
  order_id: string,      // ID de la commande (converti en bytes)
  buyer: string,         // Hash de la clé de vérification de l'acheteur
  seller: string,        // Hash de la clé de vérification du vendeur
  amount: bigint,        // Montant en Lovelace
  deadline: bigint       // Timestamp Unix en secondes
}
```

## 🔄 Flux d'une Transaction Escrow

### 1. **Achat (lockFundsInEscrow)**
```
Utilisateur → Clic "Acheter"
  ↓
Création commande (status: 'pending')
  ↓
lockFundsInEscrow()
  ↓
Transaction vers contrat escrow
  ↓
Mise à jour commande (status: 'escrow_web2', escrow_hash: txHash)
```

### 2. **Confirmation Expédition**
```
Vendeur → Clic "Confirmer la commande"
  ↓
Mise à jour commande (status: 'shipped')
```

### 3. **Libération des Fonds (releaseFundsFromEscrow)**
```
Acheteur → Clic "Confirmer la réception"
  ↓
releaseFundsFromEscrow()
  ↓
Transaction de libération (redeemer: "release")
  ↓
Fonds envoyés au vendeur
  ↓
Mise à jour commande (status: 'completed')
```

### 4. **Annulation (cancelEscrow) - Si délai expiré**
```
Acheteur → Délai expiré
  ↓
cancelEscrow()
  ↓
Transaction d'annulation (redeemer: "cancel")
  ↓
Fonds renvoyés à l'acheteur
```

## ⚙️ Configuration Requise

### Variables d'Environnement
```env
VITE_BLOCKFROST_PROJECT_ID=votre_cle_blockfrost
VITE_BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0
```

### Prérequis
- ✅ Wallet Cardano connecté (Nami, Eternl, Lace, etc.)
- ✅ Lucid initialisé avec Blockfrost
- ✅ Vendeur et acheteur avec wallets connectés

## 🧪 Tests

Pour tester l'escrow :

1. **Connectez un wallet** (Preprod Testnet)
2. **Créez un produit** comme vendeur
3. **Achetez le produit** avec un autre compte
4. **Vérifiez la transaction** sur [CardanoScan Preprod](https://preprod.cardanoscan.io)
5. **Confirmez l'expédition** (vendeur)
6. **Confirmez la réception** (acheteur) - Les fonds sont libérés

## ⚠️ Notes Importantes

1. **Contrat de Test** : Le contrat actuel (AlwaysSucceeds) accepte toutes les transactions. C'est uniquement pour les tests !

2. **Compilation Aiken** : Pour la production, compilez le contrat Aiken et placez-le dans `public/contracts/escrow.plutus.json`

3. **Délai par défaut** : 7 jours (modifiable dans `lockFundsInEscrow`)

4. **Frais de transaction** : Les utilisateurs paient les frais Cardano (~0.17 ADA par transaction)

5. **Sécurité** : Avec le contrat compilé, seul l'acheteur peut libérer les fonds, et l'annulation n'est possible qu'après le délai

## 🚀 Prochaines Étapes

1. [ ] Compiler le contrat Aiken pour la production
2. [ ] Tester sur Preprod avec le contrat compilé
3. [ ] Ajouter une interface pour gérer les annulations (timeout)
4. [ ] Ajouter des notifications pour les délais proches d'expiration
5. [ ] Migrer vers Mainnet après tests complets

---

*Fait à Goma - WENZE Team*


