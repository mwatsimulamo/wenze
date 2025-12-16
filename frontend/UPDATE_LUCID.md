# Guide de Mise à Jour de lucid-cardano

Ce guide explique comment mettre à jour `lucid-cardano` pour résoudre le problème de compatibilité avec les scripts PlutusV3 compilés par Aiken.

## 🎯 Problème

L'erreur `No variant matched` indique que votre version de `lucid-cardano` (0.10.11) ne reconnaît pas le format des scripts PlutusV3 compilés par Aiken.

## 🚀 Solution : Mise à jour de lucid-cardano

### Option 1 : Utiliser le Script Automatique (Recommandé)

#### Sur Windows (PowerShell) :
```powershell
.\update_lucid.ps1
```

#### Sur Linux/Mac :
```bash
chmod +x update_lucid.sh
./update_lucid.sh
```

### Option 2 : Mise à Jour Manuelle

1. **Ouvrez un terminal** dans le dossier `frontend`

2. **Vérifiez la version actuelle** :
   ```bash
   npm list lucid-cardano
   ```

3. **Vérifiez la dernière version disponible** :
   ```bash
   npm view lucid-cardano version
   ```

4. **Mettez à jour lucid-cardano** :
   ```bash
   npm install lucid-cardano@latest
   ```

5. **Vérifiez la nouvelle version** :
   ```bash
   npm list lucid-cardano
   ```

## ✅ Après la Mise à Jour

1. **Redémarrez votre serveur de développement** :
   ```bash
   npm run dev
   ```

2. **Testez à nouveau la transaction escrow**

3. **Si le problème persiste** :
   - Consultez la [documentation officielle de lucid-cardano](https://lucid.spacebudz.io/)
   - Vérifiez les [issues GitHub](https://github.com/spacebudz/lucid/issues) pour les problèmes connus avec PlutusV3
   - Vérifiez la compatibilité entre votre version d'Aiken et lucid-cardano

## 📋 Versions Testées

- **Aiken** : v1.1.21+42babe5
- **Plutus Version** : V3
- **lucid-cardano actuel** : 0.10.11
- **lucid-cardano recommandé** : Dernière version disponible (vérifier avec `npm view lucid-cardano version`)

## 🔍 Vérification de la Compatibilité

Après la mise à jour, vérifiez que :

1. ✅ Le contrat se compile avec Aiken : `aiken build`
2. ✅ Le fichier `public/contracts/escrow.plutus.json` existe
3. ✅ L'adresse du validateur peut être créée sans erreur
4. ✅ Les transactions escrow fonctionnent correctement

## 📝 Notes Importantes

- La mise à jour de `lucid-cardano` peut nécessiter de mettre à jour d'autres dépendances
- Si vous rencontrez des erreurs après la mise à jour, consultez les logs détaillés dans la console du navigateur (F12)
- Assurez-vous que votre environnement Node.js est à jour (Node.js 18+ recommandé)

## 🆘 Support

Si le problème persiste après la mise à jour :

1. Vérifiez les logs de la console du navigateur (F12)
2. Vérifiez que le contrat est bien compilé : `cd contracts/escrow && aiken build`
3. Vérifiez que le fichier `public/contracts/escrow.plutus.json` existe et contient le bon CBOR
4. Consultez la documentation de lucid-cardano pour les changements de version

---

**Dernière mise à jour** : $(Get-Date -Format "yyyy-MM-dd")
