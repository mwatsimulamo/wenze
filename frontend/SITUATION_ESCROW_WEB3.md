# Situation Escrow Web3 - Problème et Solutions

## 🔴 Problème Actuel

Nous développons un escrow Web3 pour Cardano Preprod, mais nous rencontrons un blocage technique :

1. **Aiken compile uniquement en PlutusV3** - Notre contrat escrow est compilé en PlutusV3
2. **lucid-cardano@0.10.11 ne supporte pas PlutusV3** - La bibliothèque ne peut pas convertir le script en adresse
3. **lucid-evolution n'existe pas** - Le package n'est pas disponible sur npm

## 📋 Solutions Possibles

### Option 1 : Calculer l'Adresse Manuellement (Workaround Technique)

Créer l'adresse à partir du hash du script en utilisant l'encodage Bech32.

**Hash du script** : `d5c214c90928733c8a8741b40de67ded41255290af2f4d88400a3d19`

**Avantages** :
- ✅ Solution immédiate
- ✅ Fonctionne avec le contrat compilé

**Inconvénients** :
- ⚠️ Nécessite d'installer `bech32`
- ⚠️ Calcul manuel complexe
- ⚠️ Si le contrat est recompilé, le hash change

**Implémentation** : Peut être faite avec la bibliothèque `bech32` ou `cardano-addresses`

### Option 2 : Utiliser un Service Externe

Utiliser une API externe pour convertir le hash du script en adresse Cardano.

**Avantages** :
- ✅ Pas besoin d'implémenter Bech32
- ✅ Solution rapide

**Inconvénients** :
- ⚠️ Dépendance externe
- ⚠️ Nécessite une connexion Internet
- ⚠️ Pas de contrôle sur le service

### Option 3 : Attendre une Mise à Jour de lucid-cardano

Surveiller les mises à jour de lucid-cardano pour le support PlutusV3.

**Avantages** :
- ✅ Solution la plus propre
- ✅ Pas de code de contournement

**Inconvénients** :
- ❌ Timing inconnu
- ❌ Peut prendre du temps

**Action** :
```bash
npm view lucid-cardano version  # Vérifier régulièrement
```

### Option 4 : Utiliser cardano-addresses (Alternative)

Utiliser la bibliothèque `cardano-addresses` pour créer l'adresse.

**Installation** :
```bash
npm install cardano-addresses
```

**Avantages** :
- ✅ Bibliothèque officielle Cardano
- ✅ Support des scripts

**Inconvénients** :
- ⚠️ Nécessite d'adapter le code
- ⚠️ API différente de Lucid

## 🎯 Recommandation

**Pour un escrow Web3 fonctionnel immédiatement** : **Option 1** (calculer l'adresse manuellement)

C'est la seule solution qui permettra de faire fonctionner l'escrow maintenant avec le contrat PlutusV3 compilé.

## 📝 Implémentation de l'Option 1

1. Installer `bech32` :
   ```bash
   npm install bech32
   ```

2. Utiliser le hash du script depuis `escrow.plutus.json` :
   ```json
   {
     "hash": "d5c214c90928733c8a8741b40de67ded41255290af2f4d88400a3d19"
   }
   ```

3. Calculer l'adresse avec Bech32 encoding pour Preprod testnet

---

**Date** : 2025-12-16
**Statut** : En attente de décision sur la solution à implémenter

