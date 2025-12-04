# 💰 Étape 4 : Transaction Simple avec Lucid

## 🎯 Objectif

Créer une transaction réelle avec Lucid pour tester le flux. Pour l'escrow complet, nous utiliserons le smart contract une fois déployé.

## 📋 Approche Progressive

### Phase 1 : Transaction Simple (Maintenant)

Pour tester que tout fonctionne :
- Transaction directe : Acheteur → Vendeur
- Utilise Lucid pour créer, signer et envoyer
- Vérifie le solde, les frais, etc.

### Phase 2 : Escrow avec Smart Contract (Plus Tard)

Une fois le smart contract déployé :
- Transaction : Acheteur → Smart Contract Escrow
- Les fonds sont verrouillés dans le contrat
- Libération après confirmation

## ⚠️ Important

Pour un **vrai escrow**, les fonds doivent aller dans le **smart contract**, pas directement au vendeur. La version actuelle est pour tester le flux de base.

Une fois le smart contract déployé, nous modifierons pour utiliser le contrat.

## ✅ Prochaine Action

Créer la fonction `prepareAdaPayment` qui :
1. Utilise Lucid depuis le contexte
2. Crée une transaction réelle
3. Pour l'instant, envoie au vendeur (test)
4. Plus tard, enverra au smart contract



