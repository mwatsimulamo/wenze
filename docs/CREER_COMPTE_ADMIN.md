# Guide : Créer un compte administrateur

Ce guide vous explique étape par étape comment promouvoir un utilisateur au statut d'administrateur.

## 📋 Structure de la table `profiles`

> 📖 **Pour la structure complète et détaillée, voir : [TABLE_PROFILES_ACTUALISEE.md](./TABLE_PROFILES_ACTUALISEE.md)**

Voici la structure actuelle de la table `profiles` après ajout du champ `is_admin` :

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  wallet_address TEXT,
  reputation_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false NOT NULL,  -- ⭐ NOUVEAU CHAMP
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Champ `is_admin`
- **Type** : `BOOLEAN`
- **Valeur par défaut** : `false`
- **Non null** : `true`
- **Description** : Indique si l'utilisateur a les droits d'administration
- **Index** : `idx_profiles_is_admin` créé pour optimiser les requêtes

---

## 🎯 Méthode 1 : Via l'éditeur SQL de Supabase (Recommandé)

### 📍 Étape 1 : Accéder à l'éditeur SQL de Supabase

1. **Connectez-vous à Supabase**
   - Allez sur [https://supabase.com](https://supabase.com)
   - Connectez-vous avec votre compte

2. **Sélectionnez votre projet**
   - Choisissez le projet WENZE dans votre dashboard

3. **Ouvrez l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Ou cliquez sur **"New query"** si vous avez déjà l'éditeur ouvert

---

### 🔍 Étape 2 : Trouver l'ID de l'utilisateur

Vous devez d'abord trouver l'ID (UUID) de l'utilisateur à promouvoir admin.

#### Option A : Si vous connaissez l'email (Le plus simple)

**Copiez-collez cette commande dans l'éditeur SQL et remplacez l'email :**

```sql
SELECT id, email, full_name, username, is_admin
FROM profiles
WHERE email = 'votre-email@exemple.com';
```

**Exemple concret :**
```sql
SELECT id, email, full_name, username, is_admin
FROM profiles
WHERE email = 'admin@wenze.com';
```

**Résultat attendu :**
```
id                                   | email            | full_name | username | is_admin
-------------------------------------|------------------|-----------|----------|----------
550e8400-e29b-41d4-a716-446655440000| admin@wenze.com  | Admin User| admin    | false
```

➡️ **Copiez l'ID** (la première colonne) : `550e8400-e29b-41d4-a716-446655440000`

---

#### Option B : Lister tous les utilisateurs

Si vous ne connaissez pas l'email exact :

```sql
SELECT id, email, full_name, username, is_admin
FROM profiles
ORDER BY created_at DESC;
```

Vous verrez tous les utilisateurs avec leurs informations.

---

#### Option C : Chercher par nom

```sql
SELECT id, email, full_name, username, is_admin
FROM profiles
WHERE full_name ILIKE '%nom%' OR username ILIKE '%nom%';
```

**Exemple :**
```sql
SELECT id, email, full_name, username, is_admin
FROM profiles
WHERE full_name ILIKE '%jean%' OR username ILIKE '%jean%';
```

---

### ✅ Étape 3 : Promouvoir l'utilisateur en admin

**⚠️ IMPORTANT : Remplacez `'VOTRE_USER_ID_ICI'` par l'ID réel que vous avez copié à l'étape 2**

**Copiez-collez cette commande dans une NOUVELLE requête SQL :**

```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = 'VOTRE_USER_ID_ICI';
```

**Exemple concret avec un ID réel :**
```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

**📝 Instructions :**
1. Copiez la commande ci-dessus
2. Remplacez `'550e8400-e29b-41d4-a716-446655440000'` par l'ID que vous avez trouvé
3. Collez dans l'éditeur SQL
4. Cliquez sur **"Run"** ou appuyez sur `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

**✅ Vous devriez voir :**
```
Success. No rows returned
```

Cela signifie que la commande a réussi ! ✅

---

### 🔍 Étape 4 : Vérifier que ça a fonctionné

**Exécutez cette commande pour vérifier :**

```sql
SELECT id, email, full_name, username, is_admin
FROM profiles
WHERE id = 'VOTRE_USER_ID_ICI';
```

**Exemple :**
```sql
SELECT id, email, full_name, username, is_admin
FROM profiles
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

**✅ Résultat attendu :**
```
id                                   | email            | full_name | username | is_admin
-------------------------------------|------------------|-----------|----------|----------
550e8400-e29b-41d4-a716-446655440000| admin@wenze.com  | Admin User| admin    | true  ✅
```

➡️ **Vérifiez que `is_admin` est maintenant `true`** ✅

---

### 🎉 Étape 5 : Tester l'accès

1. **L'utilisateur doit se déconnecter et se reconnecter**
   - Dans l'application WENZE
   - Se déconnecter complètement
   - Se reconnecter avec son compte

2. **Accéder à l'interface admin**
   - Aller sur : `/admin/rewards`
   - Si tout est correct, l'utilisateur verra l'interface d'administration
   - Si "Accès refusé" apparaît, vérifiez que `is_admin = true` dans la base de données

---

## 🔧 Méthode 2 : Promouvoir directement par email

Si vous connaissez l'email de l'utilisateur, vous pouvez le promouvoir directement :

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'admin@exemple.com';
```

**Vérification :**
```sql
SELECT id, email, full_name, is_admin
FROM profiles
WHERE email = 'admin@exemple.com';
```

---

## 📝 Méthode 3 : Script SQL complet (copier-coller)

Voici un script complet que vous pouvez utiliser :

```sql
-- 1. Trouver l'utilisateur (remplacez l'email)
SELECT id, email, full_name, username, is_admin
FROM profiles
WHERE email = 'email@exemple.com';

-- 2. Une fois l'ID trouvé, exécutez cette commande (remplacez l'ID)
-- UPDATE profiles SET is_admin = true WHERE id = 'ID_TROUVE';

-- 3. Vérifier que ça a fonctionné
-- SELECT id, email, full_name, is_admin FROM profiles WHERE id = 'ID_TROUVE';
```

---

## ✅ Exemples pratiques

### Exemple 1 : Promouvoir votre propre compte
```sql
-- 1. Trouver votre ID
SELECT id, email, full_name, is_admin
FROM profiles
WHERE email = 'votre-email@gmail.com';

-- 2. Promouvoir (remplacez par votre ID)
UPDATE profiles 
SET is_admin = true 
WHERE id = 'votre-id-ici';

-- 3. Vérifier
SELECT id, email, full_name, is_admin
FROM profiles
WHERE id = 'votre-id-ici';
```

### Exemple 2 : Promouvoir plusieurs utilisateurs
```sql
-- Promouvoir plusieurs utilisateurs en une fois
UPDATE profiles 
SET is_admin = true 
WHERE email IN (
  'admin1@exemple.com',
  'admin2@exemple.com',
  'admin3@exemple.com'
);
```

### Exemple 3 : Lister tous les admins
```sql
SELECT id, email, full_name, username, created_at
FROM profiles
WHERE is_admin = true
ORDER BY created_at DESC;
```

### Exemple 4 : Retirer les droits admin
```sql
-- Retirer les droits admin d'un utilisateur
UPDATE profiles 
SET is_admin = false 
WHERE id = 'ID_UTILISATEUR';
```

---

## 🚨 Vérifications de sécurité

### Vérifier qu'un utilisateur est bien admin
```sql
SELECT 
  id, 
  email, 
  full_name, 
  is_admin,
  CASE 
    WHEN is_admin = true THEN '✅ Admin'
    ELSE '❌ Utilisateur normal'
  END as statut
FROM profiles
WHERE email = 'email@exemple.com';
```

### Lister tous les admins avec leurs informations
```sql
SELECT 
  id,
  email,
  full_name,
  username,
  is_verified,
  is_admin,
  created_at
FROM profiles
WHERE is_admin = true
ORDER BY created_at DESC;
```

### Compter le nombre d'admins
```sql
SELECT COUNT(*) as nombre_admins
FROM profiles
WHERE is_admin = true;
```

---

## 📍 Où exécuter ces commandes dans Supabase

1. **Aller sur votre projet Supabase**
   - Connectez-vous à [supabase.com](https://supabase.com)
   - Sélectionnez votre projet

2. **Ouvrir l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Ou allez sur : `https://supabase.com/dashboard/project/[votre-projet]/sql`

3. **Créer une nouvelle requête**
   - Cliquez sur **"New query"**
   - Collez votre commande SQL
   - Cliquez sur **"Run"** (ou `Ctrl+Enter`)

4. **Vérifier les résultats**
   - Les résultats s'affichent en dessous
   - Vérifiez que `is_admin = true` pour votre utilisateur

---

## ⚠️ Notes importantes

1. **UUID Format**
   - L'ID est un UUID (ex: `550e8400-e29b-41d4-a716-446655440000`)
   - Assurez-vous de garder les guillemets simples autour de l'ID

2. **Permissions**
   - Seul un super-admin Supabase ou un utilisateur avec les bonnes permissions peut exécuter ces commandes
   - Si vous utilisez l'éditeur SQL de Supabase, vous avez normalement les permissions nécessaires

3. **Sécurité**
   - Ne partagez jamais les IDs des utilisateurs publiquement
   - Limitez le nombre d'admins au strict nécessaire
   - Vérifiez régulièrement la liste des admins

4. **Après la promotion**
   - L'utilisateur doit se déconnecter et se reconnecter pour que les changements prennent effet
   - Ou rafraîchir la page `/admin/rewards`

---

## 🔍 Dépannage

### Erreur : "permission denied"
**Solution** : Vous devez être connecté en tant que super-admin dans Supabase, ou utiliser l'éditeur SQL avec les bonnes permissions.

### Erreur : "column 'is_admin' does not exist"
**Solution** : Vous devez d'abord exécuter la migration `add_is_admin_to_profiles.sql` :
```sql
-- Vérifier si la colonne existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_admin';

-- Si elle n'existe pas, exécutez la migration
-- (voir supabase/migrations/add_is_admin_to_profiles.sql)
```

### L'utilisateur ne peut toujours pas accéder à /admin/rewards
**Solutions** :
1. Vérifier que `is_admin = true` dans la base de données
2. Demander à l'utilisateur de se déconnecter et se reconnecter
3. Vider le cache du navigateur
4. Vérifier les politiques RLS (voir `update_wzp_rewards_admin_policies.sql`)

---

## 📚 Commandes SQL utiles

### Commandes de gestion
```sql
-- Promouvoir un admin
UPDATE profiles SET is_admin = true WHERE id = 'ID';

-- Retirer les droits admin
UPDATE profiles SET is_admin = false WHERE id = 'ID';

-- Lister tous les admins
SELECT * FROM profiles WHERE is_admin = true;

-- Vérifier un utilisateur spécifique
SELECT id, email, full_name, is_admin FROM profiles WHERE email = 'email@exemple.com';
```

---

**Dernière mise à jour :** Décembre 2024

