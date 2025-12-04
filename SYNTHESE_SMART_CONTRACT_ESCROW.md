# 📋 Synthèse : Smart Contract Escrow pour Wenze Marketplace

## 🎯 Vue d'ensemble

Ce document décrit l'architecture et le fonctionnement d'un **Smart Contract Escrow** sur la blockchain **Cardano** pour gérer les transactions de la marketplace Wenze. Le smart contract remplacera le système d'escrow simulé actuel (Web2) par une solution décentralisée et sécurisée.

**🎯 Choix Technologique : Aiken**  
Nous utilisons **Aiken** au lieu de Plutus car c'est un langage plus simple, plus léger et parfaitement adapté pour un projet de hackathon. Aiken nécessite moins de ressources machine et permet un développement rapide tout en restant sécurisé et efficace.

---

## 🏗️ Architecture Générale

### Composants Principaux

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  - ProductDetail.tsx                                         │
│  - OrderDetail.tsx                                           │
│  - Blockchain Integration Layer                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ API Calls + Wallet Interactions
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Smart Contract (Aiken)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Escrow Validator                                     │   │
│  │  - Lock Funds                                         │   │
│  │  - Release Funds                                      │   │
│  │  - Handle Disputes                                    │   │
│  │  - Refund Buyer                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ On-Chain State
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Cardano Blockchain                              │
│  - UTXO Model                                                │
│  - Transaction History                                       │
│  - Immutable Records                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Structure du Smart Contract

### Datum (État du Contrat)

Le **Datum** stocke l'état de chaque escrow :

```aiken
// types/escrow.ak
type EscrowStatus {
  Locked
  Shipped
  Completed
  Disputed
  Cancelled
}

type EscrowDatum {
  order_id: ByteArray,        // UUID de la commande (pour référence DB)
  buyer_address: Address,      // Adresse de l'acheteur
  seller_address: Address,     // Adresse du vendeur
  amount: Int,                 // Montant en Lovelace (1 ADA = 1,000,000 Lovelace)
  deadline: Int,               // Timestamp limite pour résolution
  status: EscrowStatus,        // État actuel de l'escrow
  dispute_address: Option<Address>,  // Adresse de l'arbitre (si litige)
}
```

### Redeemer (Actions)

Les **Redeemers** définissent les actions possibles :

```aiken
// types/escrow.ak
type EscrowAction {
  LockFunds
  ConfirmShipment
  ConfirmReceipt
  OpenDispute(dispute_address: Address)
  ResolveDispute(winner: Address)
  CancelOrder
  RefundBuyer
}
```

### Avantages d'Aiken pour un Hackathon

- ✅ **Syntaxe Simple** : Langage moderne et intuitif (inspiré de Rust/Elm)
- ✅ **Léger** : Pas besoin de GHC (Glasgow Haskell Compiler) lourd
- ✅ **Compilation Rapide** : Temps de build très courts
- ✅ **Débogage Facile** : Messages d'erreur clairs
- ✅ **IDE Support** : Support complet dans VS Code
- ✅ **Documentation Claire** : Apprentissage rapide

---

## 🔄 Workflow Complet

### 1️⃣ Achat Direct (Sans Négociation)

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│ Acheteur │         │ Frontend │         │  Smart   │         │ Vendeur  │
│          │         │          │         │ Contract │         │          │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │                    │
     │ 1. Clique "Acheter"│                    │                    │
     ├───────────────────►│                    │                    │
     │                    │                    │                    │
     │                    │ 2. Créer Order (DB)│                    │
     │                    │    status: pending │                    │
     │                    ├───────────────────►│                    │
     │                    │                    │                    │
     │                    │ 3. Préparer TX     │                    │
     │                    │    LockFunds       │                    │
     │                    ├───────────────────►│                    │
     │                    │                    │                    │
     │ 4. Signer TX       │                    │                    │
     │    (Wallet)        │                    │                    │
     ├───────────────────►│                    │                    │
     │                    │                    │                    │
     │                    │ 5. Soumettre TX    │                    │
     │                    ├───────────────────►│                    │
     │                    │                    │                    │
     │                    │ 6. TX Confirmée    │                    │
     │                    │◄───────────────────┤                    │
     │                    │                    │                    │
     │                    │ 7. Update DB       │                    │
     │                    │    status: escrow  │                    │
     │                    │    escrow_hash: TX │                    │
     │                    │                    │                    │
     │                    │ 8. Notifier        │                    │
     │                    ├────────────────────────────────────────►│
     │                    │                    │                    │
     │                    │                    │ 9. "Expédier"      │
     │                    │                    │◄───────────────────┤
     │                    │                    │                    │
     │                    │ 10. ConfirmShipment│                    │
     │                    ├───────────────────►│                    │
     │                    │                    │                    │
     │                    │ 11. Update DB      │                    │
     │                    │     status: shipped│                    │
     │                    │                    │                    │
     │ 12. "Confirmer     │                    │                    │
     │     réception"     │                    │                    │
     ├───────────────────►│                    │                    │
     │                    │                    │                    │
     │                    │ 13. ConfirmReceipt │                    │
     │                    ├───────────────────►│                    │
     │                    │                    │                    │
     │                    │ 14. Libérer fonds  │                    │
     │                    │     vers vendeur   │                    │
     │                    │                    │                    │
     │                    │ 15. Update DB      │                    │
     │                    │     status: completed│                  │
     │                    │                    │                    │
     │                    │ 16. Notifier       │                    │
     │                    ├────────────────────────────────────────►│
```

### 2️⃣ Achat avec Négociation

```
1. Acheteur propose un prix via modal
   └─► Frontend: Créer Order avec order_mode='negotiation', proposed_price=X

2. Vendeur accepte/refuse
   ├─► Si ACCEPTÉ:
   │   └─► Frontend: Update Order (final_price=X, escrow_status='open')
   │       └─► Acheteur peut maintenant payer
   │
   └─► Si REFUSÉ:
       └─► Acheteur peut proposer un nouveau prix (boucle)

3. Acheteur paie (après acceptation)
   └─► Même workflow que "Achat Direct" (étape 3-16)
       └─► Montant = final_price (au lieu du prix initial)
```

### 3️⃣ Gestion des Litiges

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Partie   │         │ Frontend │         │  Smart   │
│          │         │          │         │ Contract │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │ 1. Ouvrir litige   │                    │
     ├───────────────────►│                    │
     │                    │                    │
     │                    │ 2. OpenDispute     │
     │                    ├───────────────────►│
     │                    │                    │
     │                    │ 3. Update Datum    │
     │                    │    status: Disputed│
     │                    │    disputeAddress  │
     │                    │                    │
     │                    │ 4. Notifier arbitre│
     │                    │                    │
     │                    │ 5. Arbitre examine │
     │                    │                    │
     │                    │ 6. ResolveDispute  │
     │                    │    (winner)        │
     │                    ├───────────────────►│
     │                    │                    │
     │                    │ 7. Libérer fonds   │
     │                    │    vers gagnant    │
```

---

## 🔐 Logique de Validation (Aiken)

### Règles Principales

```aiken
// validators/escrow.ak
use aiken/hash.{Hash}
use aiken/list
use aiken/transaction.{ScriptContext}
use types/escrow.{EscrowDatum, EscrowAction, EscrowStatus(..)}

validator escrow_validator {
  fn spend(datum: EscrowDatum, redeemer: EscrowAction, ctx: ScriptContext) -> Bool {
    when redeemer is {
      LockFunds ->
        // Vérifier que l'acheteur signe la transaction
        transaction.signatories(ctx)
          |> list.has(datum.buyer_address)
      
      ConfirmShipment ->
        // Vérifier que le vendeur signe
        transaction.signatories(ctx)
          |> list.has(datum.seller_address)
          // Vérifier que l'escrow est en état "Locked"
          && datum.status == Locked
      
      ConfirmReceipt ->
        // Vérifier que l'acheteur signe
        transaction.signatories(ctx)
          |> list.has(datum.buyer_address)
          // Vérifier que l'escrow est en état "Shipped"
          && datum.status == Shipped
          // Vérifier que les fonds sont envoyés au vendeur
          && transaction.outputs(ctx)
            |> list.any(fn(output) {
                output.address == datum.seller_address
                  && output.value.ada == datum.amount
              })
      
      OpenDispute(dispute_address) ->
        // Vérifier que l'acheteur OU le vendeur signe
        (transaction.signatories(ctx) |> list.has(datum.buyer_address))
          || (transaction.signatories(ctx) |> list.has(datum.seller_address))
          // Vérifier que l'escrow n'est pas déjà en litige
          && datum.status != Disputed
      
      ResolveDispute(winner) ->
        // Vérifier que l'arbitre signe
        case datum.dispute_address {
          Some(arb_addr) ->
            transaction.signatories(ctx)
              |> list.has(arb_addr)
              // Vérifier que l'escrow est en litige
              && datum.status == Disputed
              // Vérifier que les fonds sont envoyés au gagnant
              && transaction.outputs(ctx)
                |> list.any(fn(output) {
                    output.address == winner
                      && output.value.ada == datum.amount
                  })
          None -> False
        }
      
      CancelOrder ->
        // Vérifier que la deadline est dépassée
        transaction.valid_range(ctx).to < datum.deadline
          // Vérifier que l'escrow n'est pas déjà complété
          && datum.status != Completed
          // Rembourser l'acheteur
          && transaction.outputs(ctx)
            |> list.any(fn(output) {
                output.address == datum.buyer_address
                  && output.value.ada == datum.amount
              })
      
      RefundBuyer ->
        // Vérifier que les fonds sont remboursés à l'acheteur
        transaction.outputs(ctx)
          |> list.any(fn(output) {
              output.address == datum.buyer_address
                && output.value.ada == datum.amount
            })
    }
  }
}
```

### Avantages de la Syntaxe Aiken

- ✅ **Pattern Matching** : Syntaxe claire avec `when` et `case`
- ✅ **Fonctions Pipelines** : Utilisation de `|>` pour chaîner les opérations
- ✅ **Type Safety** : Vérification de types à la compilation
- ✅ **Immutabilité** : Par défaut, toutes les valeurs sont immuables
- ✅ **Pas de Monades** : Code plus simple sans concepts Haskell avancés

---

## 🔌 Intégration Frontend

### Structure des Fichiers

```
frontend/src/blockchain/
├── contracts/
│   ├── EscrowContract.ts        # Interface TypeScript du contrat
│   └── escrow.contract.json     # ABI du contrat (généré)
├── utils/
│   ├── lucid.ts                 # Configuration Lucid
│   ├── wallet.ts                # Connexion wallet
│   └── validators.ts            # Helpers pour Datum/Redeemer
├── services/
│   ├── escrowService.ts         # Service principal d'escrow
│   └── transactionService.ts    # Gestion des transactions
└── types/
    └── escrow.ts                # Types TypeScript
```

### Exemple d'Implémentation

#### `escrowService.ts`

```typescript
import { Lucid, UTxO, Data } from 'lucid-cardano';
import { EscrowDatum, EscrowAction } from '../types/escrow';

export class EscrowService {
  private lucid: Lucid;
  private contractAddress: string;

  constructor(lucid: Lucid, contractAddress: string) {
    this.lucid = lucid;
    this.contractAddress = contractAddress;
  }

  /**
   * Verrouiller les fonds en escrow
   */
  async lockFunds(
    orderId: string,
    sellerAddress: string,
    amount: bigint,
    deadline: number
  ): Promise<string> {
    const buyerAddress = await this.lucid.wallet.address();
    
    const datum: EscrowDatum = {
      orderId: Buffer.from(orderId).toString('hex'),
      buyerAddress,
      sellerAddress,
      amount: Number(amount),
      deadline,
      status: 'Locked',
      disputeAddress: null,
    };

    const tx = await this.lucid
      .newTx()
      .payToContract(
        this.contractAddress,
        { inline: Data.to(datum, EscrowDatumSchema) },
        { lovelace: amount }
      )
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    return txHash;
  }

  /**
   * Confirmer la réception et libérer les fonds
   */
  async confirmReceipt(utxo: UTxO): Promise<string> {
    const datum = Data.from(utxo.datum, EscrowDatumSchema);
    
    const redeemer: EscrowAction = {
      action: 'ConfirmReceipt',
    };

    const tx = await this.lucid
      .newTx()
      .collectFrom([utxo], Data.to(redeemer, EscrowActionSchema))
      .payToAddress(datum.sellerAddress, { lovelace: BigInt(datum.amount) })
      .attachSpendingValidator(this.contractAddress)
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    return txHash;
  }

  /**
   * Ouvrir un litige
   */
  async openDispute(utxo: UTxO, arbitratorAddress: string): Promise<string> {
    const datum = Data.from(utxo.datum, EscrowDatumSchema);
    
    const newDatum: EscrowDatum = {
      ...datum,
      status: 'Disputed',
      disputeAddress: arbitratorAddress,
    };

    const redeemer: EscrowAction = {
      action: 'OpenDispute',
    };

    const tx = await this.lucid
      .newTx()
      .collectFrom([utxo], Data.to(redeemer, EscrowActionSchema))
      .payToContract(
        this.contractAddress,
        { inline: Data.to(newDatum, EscrowDatumSchema) },
        { lovelace: BigInt(datum.amount) }
      )
      .attachSpendingValidator(this.contractAddress)
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    return txHash;
  }
}
```

#### Intégration dans `OrderDetail.tsx`

```typescript
import { EscrowService } from '../blockchain/services/escrowService';
import { useLucid } from '../blockchain/utils/lucid';

const OrderDetail = () => {
  const { lucid, contractAddress } = useLucid();
  const escrowService = new EscrowService(lucid, contractAddress);

  const handlePayAfterNegotiation = async () => {
    try {
      setProcessing(true);
      
      // 1. Calculer le montant en Lovelace
      const amountLovelace = BigInt(
        Math.floor(parseFloat(order.final_price) * 1_000_000)
      );
      
      // 2. Calculer la deadline (7 jours)
      const deadline = Date.now() + 7 * 24 * 60 * 60 * 1000;
      
      // 3. Verrouiller les fonds
      const txHash = await escrowService.lockFunds(
        order.id,
        order.seller.wallet_address,
        amountLovelace,
        deadline
      );
      
      // 4. Mettre à jour la base de données
      await supabase
        .from('orders')
        .update({
          status: 'escrow',
          escrow_hash: txHash,
          escrow_status: 'open',
        })
        .eq('id', order.id);
      
      toast.success('Paiement effectué !', `Transaction: ${txHash}`);
      fetchOrder();
      
    } catch (error) {
      console.error('Error locking funds:', error);
      toast.error('Erreur', 'Impossible de verrouiller les fonds.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReceipt = async () => {
    try {
      setProcessing(true);
      
      // 1. Récupérer l'UTXO de l'escrow
      const utxo = await escrowService.getEscrowUTXO(order.escrow_hash);
      
      // 2. Confirmer la réception (libère les fonds)
      const txHash = await escrowService.confirmReceipt(utxo);
      
      // 3. Mettre à jour la base de données
      await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id);
      
      toast.success('Commande terminée !', `Fonds libérés: ${txHash}`);
      fetchOrder();
      
    } catch (error) {
      console.error('Error confirming receipt:', error);
      toast.error('Erreur', 'Impossible de confirmer la réception.');
    } finally {
      setProcessing(false);
    }
  };
};
```

---

## 🛡️ Sécurité et Considérations

### Sécurité

1. **Validation Stricte** : Toutes les actions sont validées par le smart contract
2. **Signatures Multiples** : Chaque action requiert la signature de la partie concernée
3. **Deadline** : Protection contre les fonds bloqués indéfiniment
4. **Arbitrage** : Système de litige avec arbitre de confiance
5. **Immutabilité** : Une fois confirmée, la transaction est irréversible

### Limitations et Solutions

| Limitation | Solution |
|------------|----------|
| **Frais de transaction** | Les frais sont minimes sur Cardano (~0.17 ADA) |
| **Temps de confirmation** | ~20 secondes (beaucoup plus rapide qu'Ethereum) |
| **Complexité du développement** | Utiliser des librairies comme Lucid pour simplifier |
| **Gestion des erreurs** | Implémenter des retry logic et notifications utilisateur |

### Coûts Estimés

- **Lock Funds** : ~0.17 ADA (frais de transaction)
- **Confirm Receipt** : ~0.17 ADA
- **Open Dispute** : ~0.17 ADA
- **Resolve Dispute** : ~0.17 ADA

**Total par transaction complète** : ~0.34 ADA (lock + release)

---

## 📊 Synchronisation Frontend ↔ Blockchain

### Stratégie de Synchronisation

```
1. Frontend crée Order dans Supabase (status: 'pending')
   └─► UUID généré: order-123

2. Frontend appelle Smart Contract (lockFunds)
   └─► TX Hash: abc123...
   └─► Frontend met à jour Supabase:
       - escrow_hash: 'abc123...'
       - status: 'escrow'

3. Frontend surveille la blockchain (polling ou WebSocket)
   └─► Vérifie que la TX est confirmée
   └─► Met à jour Supabase si nécessaire

4. Lors des actions suivantes (ship, confirm, dispute)
   └─► Même processus: TX → Update DB → Notify
```

### Service de Surveillance

```typescript
// blockchain/services/blockchainSync.ts
export class BlockchainSyncService {
  async syncOrderStatus(orderId: string, escrowHash: string) {
    // Vérifier l'état de la transaction sur la blockchain
    const txStatus = await this.lucid.awaitTx(escrowHash);
    
    if (txStatus) {
      // Récupérer l'UTXO actuel
      const utxo = await this.getEscrowUTXO(escrowHash);
      const datum = Data.from(utxo.datum, EscrowDatumSchema);
      
      // Synchroniser avec la base de données
      await supabase
        .from('orders')
        .update({
          status: this.mapStatus(datum.status),
        })
        .eq('id', orderId);
    }
  }
  
  private mapStatus(contractStatus: string): string {
    const mapping = {
      'Locked': 'escrow',
      'Shipped': 'shipped',
      'Completed': 'completed',
      'Disputed': 'disputed',
      'Cancelled': 'cancelled',
    };
    return mapping[contractStatus] || 'pending';
  }
}
```

---

## 🚀 Démarrage Rapide avec Aiken

### Installation (5 minutes)

```bash
# 1. Installer Rust (si pas déjà installé)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Installer Aiken
cargo install aiken

# 3. Vérifier l'installation
aiken --version
```

### Création du Projet Escrow

```bash
# 1. Créer un nouveau projet Aiken
aiken new escrow_contract
cd escrow_contract

# 2. Structure automatique créée :
# escrow_contract/
# ├── aiken.toml
# ├── lib/
# │   └── escrow_contract/
# │       └── validators.ak
# └── tests/
```

### Exemple de Code Minimal

```aiken
// lib/escrow_contract/types/escrow.ak
type EscrowDatum {
  buyer_address: Address,
  seller_address: Address,
  amount: Int,
}

type EscrowAction {
  LockFunds
  ConfirmReceipt
}

// lib/escrow_contract/validators/escrow.ak
use escrow_contract/types/escrow.{EscrowDatum, EscrowAction}
use aiken/list

validator escrow {
  fn spend(datum: EscrowDatum, redeemer: EscrowAction, ctx: ScriptContext) -> Bool {
    when redeemer is {
      LockFunds -> 
        transaction.signatories(ctx)
          |> list.has(datum.buyer_address)
      
      ConfirmReceipt ->
        transaction.signatories(ctx)
          |> list.has(datum.buyer_address)
    }
  }
}
```

### Compilation et Tests

```bash
# Compiler le contrat
aiken build

# Exécuter les tests
aiken test

# Générer l'uplc (pour déploiement)
aiken blueprint convert
```

### Intégration avec Lucid (Frontend)

**Important** : Lucid fonctionne avec **n'importe quel contrat Cardano**, qu'il soit compilé avec Aiken ou Plutus. Une fois le contrat Aiken compilé, vous obtenez :
- L'**adresse du contrat** (script hash)
- Le **bytecode** (pour l'attacher aux transactions)

Lucid utilise ces informations de la même manière, peu importe le langage source.

```typescript
// Le code frontend reste identique, que le contrat soit en Aiken ou Plutus
import { Lucid } from 'lucid-cardano';

const lucid = await Lucid.new(provider, "Preprod");
const contractAddress = "addr1..."; // Adresse générée par Aiken

// Utiliser le contrat comme d'habitude
const tx = await lucid
  .newTx()
  .payToContract(contractAddress, datum, assets)
  .complete();
```

---

## 🚀 Plan d'Implémentation (Optimisé Hackathon)

### Phase 1 : Setup Aiken (Jour 1)
- [ ] Installer Aiken (`cargo install aiken`)
- [ ] Créer le projet (`aiken new escrow_contract`)
- [ ] Configurer la structure de fichiers
- [ ] Installer `lucid-cardano` dans le frontend
- [ ] Obtenir des ADA de test sur Preprod

### Phase 2 : Développement Contrat (Jours 2-3)
- [ ] Définir les types (`EscrowDatum`, `EscrowAction`)
- [ ] Écrire le validateur principal
- [ ] Ajouter les tests unitaires
- [ ] Compiler et corriger les erreurs
- [ ] Générer le blueprint pour déploiement

### Phase 3 : Intégration Frontend (Jours 4-5)
- [ ] Implémenter `EscrowService` avec Lucid
- [ ] Intégrer dans `ProductDetail.tsx`
- [ ] Intégrer dans `OrderDetail.tsx`
- [ ] Déployer le contrat sur Preprod
- [ ] Tester le flow complet

### Phase 4 : Tests et Polish (Jour 6)
- [ ] Tests end-to-end
- [ ] Gestion d'erreurs
- [ ] Messages utilisateur clairs
- [ ] Documentation rapide

### Phase 5 : Présentation (Jour 7)
- [ ] Démo fonctionnelle
- [ ] Slides de présentation
- [ ] Code propre et commenté

---

## 🔗 Intégration Frontend (Lucid)

### Note Importante

**Lucid fonctionne avec tous les contrats Cardano**, qu'ils soient écrits en Aiken ou Plutus. Une fois votre contrat Aiken compilé, vous obtenez :
- L'**adresse du contrat** (script hash)
- Le **bytecode** du validateur

Ces informations sont suffisantes pour interagir avec le contrat depuis le frontend. Le code TypeScript reste identique, peu importe le langage source du contrat.

### Processus de Déploiement

1. **Compiler avec Aiken** :
   ```bash
   aiken build
   aiken blueprint convert
   ```

2. **Obtenir l'adresse du contrat** :
   ```bash
   aiken blueprint address
   # Output: addr1...
   ```

3. **Utiliser avec Lucid** :
   ```typescript
   // Le contrat Aiken est maintenant utilisable comme n'importe quel contrat Cardano
   const contractAddress = "addr1..."; // Adresse générée par Aiken
   
   // Créer une transaction
   const tx = await lucid
     .newTx()
     .payToContract(contractAddress, datum, assets)
     .attachSpendingValidator(contractAddress) // Utiliser l'adresse comme validator
     .complete();
   ```

---

## 📚 Ressources

### Documentation Aiken
- [Aiken Documentation](https://aiken-lang.org/) - Documentation officielle
- [Aiken Tutorial](https://aiken-lang.org/getting-started) - Guide de démarrage
- [Aiken Examples](https://github.com/aiken-lang/examples) - Exemples de code
- [Aiken Reference](https://aiken-lang.org/language-reference) - Référence du langage

### Documentation Cardano
- [Lucid Documentation](https://lucid.spacebudz.io/) - Librairie TypeScript pour Cardano
- [Cardano Developer Portal](https://developers.cardano.org/)
- [Cardano Smart Contracts Guide](https://developers.cardano.org/docs/smart-contracts/)

### Outils de Développement
- **Aiken CLI** : Compiler et tester les smart contracts (`cargo install aiken`)
- **Lucid** : Librairie TypeScript pour interagir avec Cardano depuis le frontend
- **Blockfrost API** : API pour interroger la blockchain Cardano
- **Cardano Testnet Faucet** : Obtenir des ADA de test pour développer

### Installation Rapide Aiken

```bash
# Installer Rust (si pas déjà installé)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Installer Aiken (compilation prend 5-10 minutes)
cargo install aiken

# Vérifier l'installation
aiken --version

# Créer un nouveau projet
aiken new escrow_contract
cd escrow_contract

# Compiler (prend seulement quelques secondes)
aiken build

# Tester
aiken test
```

### Exigences Machine Minimales (Hackathon)

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| **RAM** | 4 GB | 8 GB |
| **Disque** | 2 GB libre | 5 GB libre |
| **CPU** | Dual-core | Quad-core |
| **OS** | Windows/Mac/Linux | Linux/Mac |

**Pourquoi c'est léger ?**
- Pas besoin de GHC (Glasgow Haskell Compiler) qui fait ~2 GB
- Rust/Cargo est beaucoup plus léger
- Compilation rapide (quelques secondes vs minutes)
- Pas de Node.js lourd nécessaire pour les outils

### Structure d'un Projet Aiken

```
escrow_contract/
├── aiken.toml          # Configuration du projet
├── lib/
│   └── escrow_contract/
│       ├── validators/
│       │   └── escrow.ak    # Validateur principal
│       ├── types/
│       │   └── escrow.ak    # Types de données
│       └── utils/
│           └── helpers.ak   # Fonctions utilitaires
└── tests/
    └── escrow_test.ak  # Tests unitaires
```

---

## ✅ Avantages du Smart Contract Escrow

1. **Décentralisation** : Pas de tiers de confiance nécessaire
2. **Transparence** : Toutes les transactions sont publiques et vérifiables
3. **Sécurité** : Les fonds sont verrouillés de manière cryptographique
4. **Automatisation** : Exécution automatique selon les règles définies
5. **Immutabilité** : Les transactions ne peuvent pas être modifiées
6. **Confiance** : Les utilisateurs n'ont pas besoin de faire confiance à la plateforme

---

## 🔄 Migration depuis le Système Actuel

### Étapes de Migration

1. **Déploiement Parallèle** : Le smart contract fonctionne en parallèle avec le système Web2
2. **Migration Progressive** : Les nouvelles commandes utilisent le smart contract
3. **Anciennes Commandes** : Les commandes existantes restent sur le système Web2
4. **Dépréciation** : Une fois toutes les commandes terminées, le système Web2 est désactivé

### Compatibilité

- Les utilisateurs peuvent continuer à utiliser l'application normalement
- Le frontend détecte automatiquement si une commande utilise le smart contract
- Les deux systèmes peuvent coexister pendant la période de transition

---

---

## 🎓 Pourquoi Aiken pour un Hackathon ?

### Avantages Pratiques

| Aspect | Plutus/Haskell | Aiken |
|--------|----------------|-------|
| **Temps d'installation** | 30-60 min (GHC lourd) | 5-10 min (Rust/Cargo) |
| **Taille de compilation** | ~500 MB+ | ~50 MB |
| **Temps de compilation** | 30-120 secondes | 5-15 secondes |
| **Courbe d'apprentissage** | Raide (monades, types avancés) | Douce (syntaxe moderne) |
| **Débogage** | Messages d'erreur complexes | Messages clairs |
| **IDE Support** | Limité | Excellent (VS Code) |
| **Documentation** | Dispersée | Centralisée |

### Exemple de Comparaison

**Plutus/Haskell** (complexe):
```haskell
validateEscrow :: EscrowDatum -> EscrowAction -> ScriptContext -> Bool
validateEscrow datum action ctx = 
  traceIfFalse "Invalid signature" $
    case action of
      LockFunds -> 
        txSignedBy (buyerAddress datum) (txInfoSignatories ctx)
          && traceIfFalse "Amount mismatch" 
               (valuePaidTo ctx (buyerAddress datum) == amount datum)
```

**Aiken** (simple):
```aiken
validator escrow_validator {
  fn spend(datum: EscrowDatum, redeemer: EscrowAction, ctx: ScriptContext) -> Bool {
    when redeemer is {
      LockFunds ->
        transaction.signatories(ctx)
          |> list.has(datum.buyer_address)
    }
  }
}
```

### Résultat pour le Hackathon

- ⚡ **Développement Rapide** : Moins de temps perdu sur la configuration
- 💻 **Machine Légère** : Fonctionne sur n'importe quel ordinateur portable
- 📚 **Apprentissage Facile** : L'équipe peut être productive rapidement
- 🔧 **Outils Modernes** : Intégration VS Code, tests rapides
- 🚀 **Déploiement Simple** : Compilation et déploiement en quelques minutes

---

**Document créé le** : 2024  
**Version** : 2.0 (Aiken Edition)  
**Auteur** : Équipe Wenze Development  
**Technologie** : Aiken (Cardano Smart Contracts)


