# 🔧 Résolution : "supabase n'est pas reconnu"

Si vous obtenez l'erreur `Le terme «supabase» n'est pas reconnu`, voici comment résoudre le problème.

---

## ✅ Solution rapide : Recharger le PATH

Dans votre terminal PowerShell, exécutez cette commande :

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

Puis testez :
```powershell
supabase --version
```

---

## 🔄 Solution permanente : Fermer et rouvrir PowerShell

**Le plus simple :**

1. **Fermer complètement** votre fenêtre PowerShell
2. **Rouvrir** PowerShell (nouveau terminal)
3. Le PATH sera automatiquement rechargé avec tous les outils Scoop

---

## ✅ Vérifier que Supabase est dans le PATH

```powershell
$env:PATH -split ';' | Select-String scoop
```

Vous devriez voir : `C:\Users\PC\scoop\shims`

---

## 🔍 Vérifier que Supabase est bien installé

```powershell
Get-Command supabase
```

Vous devriez voir le chemin : `C:\Users\PC\scoop\shims\supabase.exe`

---

## 📝 Note

Scoop ajoute automatiquement `C:\Users\PC\scoop\shims` au PATH utilisateur, mais ce changement n'est pris en compte que dans les nouveaux terminaux. Si vous avez un terminal ouvert pendant l'installation, fermez-le et rouvrez-le.

