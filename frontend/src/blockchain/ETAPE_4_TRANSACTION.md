# 💰 Étape 4 : Créer la Première Transaction Simple

## 🎯 Objectif

Créer une transaction réelle avec Lucid pour envoyer de l'ADA. Pour l'instant, transaction simple (sans smart contract) pour tester.

## 📋 Ce qui a été fait

### ✅ Fonction `prepareAdaPayment` améliorée

La fonction peut maintenant :
- ✅ Utiliser Lucid pour créer une vraie transaction
- ✅ Vérifier le solde disponible
- ✅ Convertir ADA en Lovelace
- ✅ Créer, signer et envoyer la transaction
- ✅ Retourner le hash de la transaction

### ⚠️ Pour l'escrow

Pour un vrai escrow, les fonds doivent aller dans un **smart contract**, pas directement au vendeur. 

**Pour le moment** : Transaction simple au vendeur (pour tester)
**Plus tard** : Transaction vers le smart contract escrow (une fois déployé)

## 🔄 Prochaines Actions

### 1. Obtenir l'adresse du vendeur

Pour créer une vraie transaction, il faut l'adresse Cardano du vendeur. Elle peut être :
- Stockée dans `profiles.wallet_address`
- Ou récupérée depuis le wallet connecté du vendeur

### 2. Modifier les pages pour passer l'adresse

Mettre à jour `ProductDetail.tsx` et `OrderDetail.tsx` pour :
- Récupérer l'adresse du vendeur
- Passer l'adresse à `prepareAdaPayment`

### 3. Tester la transaction

- Connecter un wallet testnet
- Obtenir des ADA de test
- Créer une commande et tester le paiement

## ⚠️ Note Importante

Pour un **vrai escrow**, les fonds doivent aller dans le **smart contract**, pas directement au vendeur. La version actuelle est une transaction simple pour tester le flux.

Une fois le smart contract déployé, nous modifierons pour envoyer les fonds au contrat escrow.

## ✅ Checklist

- [x] Fonction `prepareAdaPayment` créée avec Lucid
- [ ] Récupérer l'adresse du vendeur
- [ ] Modifier les pages pour passer l'adresse
- [ ] Tester la transaction sur Preprod Testnet




