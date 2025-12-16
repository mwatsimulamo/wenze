# Installation Directe d'Aiken (Sans Rust)

## Méthode Simple : Télécharger les Binaires

### Étape 1 : Télécharger Aiken

1. **Ouvrez votre navigateur** et allez sur :
   https://github.com/aiken-lang/aiken/releases

2. **Téléchargez** le fichier pour Windows :
   - Cherchez la dernière version (ex: `v1.x.x`)
   - Téléchargez `aiken-x.x.x-x86_64-pc-windows-msvc.zip`

### Étape 2 : Extraire et Installer

1. **Extrayez** le fichier ZIP téléchargé
2. **Copiez** `aiken.exe` dans un dossier accessible :
   - Option A : `C:\Windows\System32` (accessible partout)
   - Option B : Créez `C:\Tools\Aiken` et ajoutez-le au PATH

### Étape 3 : Ajouter au PATH (Option B)

Si vous avez choisi l'Option B :

1. **Ouvrez** les Variables d'environnement :
   - Appuyez sur `Win + R`
   - Tapez `sysdm.cpl` et appuyez sur Entrée
   - Cliquez sur "Variables d'environnement"

2. **Ajoutez** le chemin :
   - Dans "Variables utilisateur", trouvez "Path"
   - Cliquez sur "Modifier"
   - Cliquez sur "Nouveau"
   - Ajoutez `C:\Tools\Aiken` (ou votre chemin)
   - Cliquez sur "OK" partout

3. **Redémarrez** votre terminal PowerShell

### Étape 4 : Vérifier

```powershell
aiken --version
```

Vous devriez voir la version d'Aiken !

---

## Alternative : Installation Rapide dans le Dossier du Projet

Si vous ne voulez pas modifier le PATH :

1. **Téléchargez** Aiken depuis GitHub
2. **Extrayez** `aiken.exe`
3. **Copiez** `aiken.exe` dans `frontend/contracts/escrow/`
4. **Utilisez** `.\aiken.exe` au lieu de `aiken` dans ce dossier






