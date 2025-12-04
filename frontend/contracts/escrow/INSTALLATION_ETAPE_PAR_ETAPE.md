# 🚀 Installation Étape par Étape - Aiken

## Étape 1 : Installer Rust

### Méthode A : Installation automatique (Recommandée)

1. **Ouvrez votre navigateur** et allez sur : https://rustup.rs/
2. **Téléchargez** `rustup-init.exe` pour Windows
3. **Exécutez** le fichier téléchargé
4. **Suivez** les instructions (appuyez sur Entrée pour accepter les options par défaut)
5. **Redémarrez** votre terminal PowerShell après l'installation

### Méthode B : Via winget (Windows Package Manager)

```powershell
winget install Rustlang.Rustup
```

### Vérifier l'installation

Après l'installation, **fermez et rouvrez** votre terminal PowerShell, puis :

```powershell
rustc --version
cargo --version
```

Vous devriez voir les versions de Rust et Cargo.

---

## Étape 2 : Installer Aiken

Une fois Rust installé, installez Aiken :

```powershell
cargo install aiken
```

Cette commande peut prendre quelques minutes (5-10 minutes).

### Vérifier l'installation

```powershell
aiken --version
```

Vous devriez voir la version d'Aiken (ex: `aiken 1.x.x`).

---

## Étape 3 : Compiler le contrat

Une fois Aiken installé :

```powershell
cd frontend/contracts/escrow
aiken build
```

---

## ⚠️ Si vous avez des problèmes

### Rust ne s'installe pas
- Assurez-vous d'avoir les droits administrateur
- Vérifiez votre connexion Internet
- Essayez la méthode B (winget)

### Aiken ne s'installe pas
- Attendez que la compilation se termine (peut prendre du temps)
- Vérifiez que Rust est bien installé : `cargo --version`
- Redémarrez le terminal après l'installation de Rust

### Aiken non reconnu après installation
- Fermez et rouvrez le terminal
- Vérifiez que le chemin Cargo est dans le PATH : `$env:USERPROFILE\.cargo\bin`
- Redémarrez l'ordinateur si nécessaire

