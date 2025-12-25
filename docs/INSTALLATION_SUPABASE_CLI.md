# 🔧 Installation de Supabase CLI

Guide étape par étape pour installer Supabase CLI sur Windows.

---

## 📋 Prérequis

- **Node.js** installé (version 16 ou supérieure)
- **npm** (inclu avec Node.js)
- **PowerShell** ou **Invite de commandes (CMD)**

### Vérifier si Node.js est installé

Ouvrez PowerShell ou CMD et tapez :

```bash
node --version
npm --version
```

Si ces commandes ne fonctionnent pas, installez Node.js d'abord :
- Télécharger depuis [nodejs.org](https://nodejs.org/)
- Installer la version LTS (Long Term Support)
- Redémarrer votre terminal après l'installation

---

## 🚀 Méthode 1 : Installation via Scoop (Recommandée pour Windows)

⚠️ **Note importante :** Supabase CLI ne supporte plus l'installation globale via npm. Utilisez Scoop pour Windows.

### Étape 1 : Installer Scoop (si pas déjà installé)

Ouvrez PowerShell et exécutez :

```powershell
irm get.scoop.sh | iex
```

**✅ Résultat attendu :**
```
Scoop was installed successfully!
```

**Si vous avez une erreur de politique d'exécution :**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Puis réessayez l'installation de Scoop.

### Étape 2 : Ajouter le bucket Supabase

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
```

**✅ Résultat attendu :**
```
The supabase bucket was added successfully.
```

### Étape 3 : Installer Supabase CLI

```powershell
scoop install supabase
```

**⏱️ Temps d'installation :** 1-2 minutes (télécharge ~28 MB)

**✅ Résultat attendu :**
```
'supabase' (2.x.x) was installed successfully!
```

### Étape 4 : Vérifier l'installation

```powershell
supabase --version
```

**✅ Résultat attendu :**
```
2.x.x
```

---

## 🔄 Méthode 2 : Installation via npm (npx - Alternative)

Si vous préférez utiliser npm sans installation globale :

### Installation locale dans votre projet

```bash
npm install supabase --save-dev
```

### Utilisation avec npx

Au lieu d'utiliser `supabase` directement, utilisez `npx supabase` :

```bash
npx supabase --version
npx supabase login
npx supabase functions deploy send-reward-notification
```

⚠️ **Note :** Vous devrez préfixer toutes les commandes avec `npx`.

---

## 🔄 Méthode 3 : Installation via Chocolatey (Alternative)

Si vous avez Chocolatey installé :

```bash
choco install supabase
```

---

## ✅ Vérification complète de l'installation

Exécutez ces commandes pour vérifier que tout fonctionne :

```bash
# Vérifier la version
supabase --version

# Voir l'aide
supabase --help

# Voir les commandes disponibles
supabase
```

---

## 🔑 Se connecter à Supabase

### Étape 1 : Se connecter

```bash
supabase login
```

### Étape 2 : Suivre les instructions

1. Une fenêtre de navigateur s'ouvre automatiquement
2. Connectez-vous avec votre compte Supabase
3. Autorisez l'accès à Supabase CLI
4. Le terminal affiche : **"✓ Logged in as votre-email@example.com"**

**✅ Résultat attendu :**
```
✓ Logged in as votre-email@example.com
```

---

## 🔗 Lier votre projet Supabase

### Étape 1 : Trouver votre Project Reference ID

1. **Aller sur [supabase.com/dashboard](https://supabase.com/dashboard)**
2. **Sélectionner votre projet** WENZE
3. **Project Settings** (icône de roue dentée en bas à gauche)
4. **General** (dans le menu)
5. **Copier le "Reference ID"** (format : `abcdefghijklmnop`)

### Étape 2 : Lier le projet

Dans PowerShell, tapez :

```bash
supabase link --project-ref VOTRE_PROJECT_REF_ID
```

**Remplacez `VOTRE_PROJECT_REF_ID`** par votre vrai Reference ID.

**Exemple :**
```bash
supabase link --project-ref abcdefghijklmnop
```

### Étape 3 : Entrer votre Database Password

1. Si demandé, entrez le mot de passe de votre base de données Supabase
2. Si vous ne le connaissez pas :
   - Supabase Dashboard → Project Settings → Database
   - Cherchez "Database Password" ou "Reset Database Password"

**✅ Résultat attendu :**
```
Finished supabase link.
```

---

## 📦 Déployer la fonction Edge (send-reward-notification)

Une fois que vous êtes connecté et que le projet est lié :

### Vérifier que vous êtes dans le bon répertoire

```bash
cd C:\Users\PC\wenze
```

### Déployer la fonction

```bash
supabase functions deploy send-reward-notification
```

**✅ Résultat attendu :**
```
Deploying function send-reward-notification...
Function send-reward-notification deployed successfully.
```

---

## 🆘 Problèmes courants

### Erreur : "supabase: command not found" ou "'supabase' n'est pas reconnu"

**Solution :**

1. **Vérifier que Node.js est installé :**
   ```bash
   node --version
   ```

2. **Réinstaller Supabase CLI :**
   ```bash
   npm uninstall -g supabase
   npm install -g supabase
   ```

3. **Fermer et rouvrir PowerShell**

4. **Vérifier le PATH :**
   - Les outils npm globaux sont généralement dans : `C:\Users\VOTRE_NOM\AppData\Roaming\npm`
   - Vérifiez que ce chemin est dans votre PATH système

### Erreur : "EACCES: permission denied"

**Solution :**

1. **Ouvrir PowerShell en tant qu'administrateur** (voir Méthode 1, Étape 1)
2. **Réessayer l'installation**

### Erreur : "npm ERR! code EACCES"

**Solution :**

1. **Changer le répertoire npm global :**
   ```bash
   npm config set prefix "C:\Users\VOTRE_NOM\npm-global"
   ```

2. **Ajouter au PATH :**
   - Ouvrir "Variables d'environnement" (Windows + R → `sysdm.cpl` → Avancé → Variables d'environnement)
   - Ajouter `C:\Users\VOTRE_NOM\npm-global` au PATH utilisateur

3. **Fermer et rouvrir PowerShell**

4. **Réinstaller :**
   ```bash
   npm install -g supabase
   ```

### Erreur lors de "supabase login" : Le navigateur ne s'ouvre pas

**Solution :**

1. **Copier l'URL affichée** dans le terminal
2. **L'ouvrir manuellement** dans votre navigateur
3. **Se connecter** et autoriser

### Erreur : "Error: Project not found" lors de "supabase link"

**Solutions :**

1. **Vérifier le Project Reference ID** dans Supabase Dashboard
2. **Vérifier que vous êtes connecté :**
   ```bash
   supabase login
   ```
3. **Vérifier que vous utilisez le bon compte** (celui qui a accès au projet)

### Erreur : "Error: Database password required"

**Solution :**

1. **Aller dans Supabase Dashboard** → Project Settings → Database
2. **Réinitialiser le mot de passe** si nécessaire
3. **Réessayer la commande `supabase link`**

---

## 📚 Commandes utiles

### Voir toutes les fonctions déployées

```bash
supabase functions list
```

### Voir les logs d'une fonction

```bash
supabase functions logs send-reward-notification
```

### Supprimer une fonction

```bash
supabase functions delete send-reward-notification
```

### Voir l'aide

```bash
supabase --help
supabase functions --help
```

---

## ✅ Checklist d'installation

- [ ] Node.js installé et vérifié (`node --version`)
- [ ] npm installé et vérifié (`npm --version`)
- [ ] Supabase CLI installé (`npm install -g supabase`)
- [ ] Version vérifiée (`supabase --version`)
- [ ] Connecté à Supabase (`supabase login`)
- [ ] Projet lié (`supabase link --project-ref ...`)
- [ ] Fonction déployée (`supabase functions deploy send-reward-notification`)

---

## 🎉 Prochaines étapes

Une fois Supabase CLI installé et configuré :

1. **Déployer la fonction email** (voir `docs/GUIDE_DEPLOIEMENT_EMAIL_RESEND.md`)
2. **Configurer Resend** (voir `docs/GUIDE_DEPLOIEMENT_EMAIL_RESEND.md`)
3. **Tester l'envoi d'emails**

---

**Besoin d'aide ?** Consultez la documentation officielle : [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)

