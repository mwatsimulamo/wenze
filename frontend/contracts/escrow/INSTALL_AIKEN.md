# Installation d'Aiken sur Windows

## Option 1: Installation via Cargo (Recommandé)

### Prérequis: Installer Rust

1. **Télécharger Rust** :
   - Allez sur https://rustup.rs/
   - Téléchargez et exécutez `rustup-init.exe`
   - Suivez les instructions d'installation

2. **Vérifier l'installation** :
   ```powershell
   rustc --version
   cargo --version
   ```

### Installer Aiken

```powershell
cargo install aiken
```

### Ajouter au PATH (si nécessaire)

Si `aiken` n'est pas reconnu après l'installation, ajoutez le chemin Cargo au PATH :
```powershell
# Ajouter au PATH utilisateur
$env:Path += ";$env:USERPROFILE\.cargo\bin"
```

## Option 2: Installation via Binaries (Plus rapide)

1. **Télécharger Aiken** :
   - Allez sur https://github.com/aiken-lang/aiken/releases
   - Téléchargez la dernière version pour Windows (`aiken-x.x.x-x86_64-pc-windows-msvc.zip`)

2. **Extraire et installer** :
   - Extrayez le fichier ZIP
   - Copiez `aiken.exe` dans un dossier dans votre PATH (ex: `C:\Windows\System32` ou créez un dossier `C:\Tools\Aiken` et ajoutez-le au PATH)

3. **Vérifier l'installation** :
   ```powershell
   aiken --version
   ```

## Vérification

Après l'installation, vérifiez que tout fonctionne :

```powershell
aiken --version
aiken --help
```

## Problèmes courants

### "aiken n'est pas reconnu"
- Vérifiez que le chemin est dans le PATH
- Redémarrez le terminal après l'installation
- Sur Windows, vous devrez peut-être redémarrer l'ordinateur

### Erreurs de compilation Rust
- Assurez-vous que Rust est correctement installé
- Vérifiez que vous avez les outils de build Visual Studio (pour Windows)






