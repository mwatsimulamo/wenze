# Problème de Compatibilité : lucid-cardano 0.10.11 et PlutusV3

## 🔴 Problème Identifié

**lucid-cardano version 0.10.11** ne supporte **PAS** les scripts **PlutusV3** compilés par **Aiken v1.1.21**.

### Erreur
```
No variant matched
```

Cette erreur se produit lors de l'appel à `lucid.utils.validatorToAddress()` avec un script PlutusV3.

## 📊 État Actuel

- **lucid-cardano installé** : 0.10.11 (dernière version disponible)
- **Aiken** : v1.1.21+42babe5
- **Plutus Version** : V3 (requis par Aiken moderne)
- **Hash du script escrow** : `d5c214c90928733c8a8741b40de67ded41255290af2f4d88400a3d19`

## 🔍 Cause

Aiken moderne compile uniquement en **PlutusV3**, mais **lucid-cardano 0.10.11** ne reconnaît pas le format CBOR des scripts PlutusV3 compilés par Aiken.

## ✅ Solutions Possibles

### Solution 1 : Attendre une Mise à Jour de lucid-cardano (Recommandé)

Surveillez les nouvelles versions :

```bash
npm view lucid-cardano version
```

Ou vérifiez le repository GitHub :
- https://github.com/spacebudz/lucid
- Recherchez les issues liées à "PlutusV3" ou "Aiken"

### Solution 2 : Utiliser une Version Beta/Preview (Si Disponible)

```bash
npm install lucid-cardano@beta
# ou
npm install lucid-cardano@next
```

**Note** : Les versions beta peuvent être instables.

### Solution 3 : Créer l'Adresse Manuellement (Workaround Complexe)

Si vous avez besoin d'une solution immédiate, vous pouvez calculer l'adresse manuellement à partir du hash du script :

```
Hash: d5c214c90928733c8a8741b40de67ded41255290af2f4d88400a3d19
```

Cela nécessite :
1. Conversion du hash en bytes
2. Création des données d'adresse avec les bons flags
3. Encodage Bech32 avec le préfixe `addr_test` (pour testnet Preprod)

C'est complexe et nécessite des bibliothèques de hachage et d'encodage Bech32.

### Solution 4 : Utiliser une API Externe (Temporaire)

Certaines APIs peuvent calculer l'adresse à partir du hash :
- Blockfrost API (si disponible)
- Services Cardano tiers

## 📋 Impact

- ❌ **Transactions escrow** : Non fonctionnelles
- ✅ **Autres fonctionnalités** : Continuent de fonctionner
- ⚠️ **Fonctionnalités blockchain** : Limitées sans support PlutusV3

## 🔄 Workaround Temporaire

Pour l'instant, vous pouvez :

1. **Désactiver temporairement** les fonctionnalités escrow dans l'UI
2. **Afficher un message** informant les utilisateurs que l'escrow blockchain est temporairement indisponible
3. **Utiliser l'escrow Web2** (base de données) en attendant

## 📝 Suivi

- [ ] Vérifier régulièrement : `npm view lucid-cardano version`
- [ ] Surveiller : https://github.com/spacebudz/lucid/issues
- [ ] Documenter toute solution de contournement trouvée

## 🆘 Support

Si vous trouvez une solution ou une mise à jour de lucid-cardano qui résout le problème :

1. Mettez à jour : `npm install lucid-cardano@latest`
2. Testez à nouveau les transactions escrow
3. Vérifiez que `getEscrowAddress()` fonctionne sans erreur

---

**Dernière vérification** : $(Get-Date -Format "yyyy-MM-dd")
**Version lucid-cardano** : 0.10.11
**Statut** : ⚠️ En attente de mise à jour

