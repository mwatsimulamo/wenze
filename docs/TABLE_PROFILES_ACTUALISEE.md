# Structure de la table `profiles` (Actualisée)

## 📋 Structure complète avec le champ `is_admin`

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  wallet_address TEXT, -- Placeholder for future Cardano wallet
  reputation_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false NOT NULL,  -- ⭐ NOUVEAU CHAMP
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 📊 Description des colonnes

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `id` | UUID | NOT NULL | - | Clé primaire, référence `auth.users.id` |
| `email` | TEXT | NULL | - | Adresse email de l'utilisateur |
| `username` | TEXT | NULL | - | Nom d'utilisateur unique |
| `full_name` | TEXT | NULL | - | Nom complet de l'utilisateur |
| `avatar_url` | TEXT | NULL | - | URL de l'avatar/profile picture |
| `wallet_address` | TEXT | NULL | - | Adresse du wallet Cardano |
| `reputation_score` | INTEGER | NULL | 0 | Score de réputation (points) |
| `is_verified` | BOOLEAN | NULL | false | Statut de vérification du compte |
| `is_admin` | BOOLEAN | NOT NULL | false | ⭐ **Statut administrateur** |
| `created_at` | TIMESTAMPTZ | NOT NULL | now() | Date de création du profil |

## 🔍 Index créés

```sql
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);
```

## 📝 Contraintes

- **Clé primaire** : `id` (UUID)
- **Clé étrangère** : `id` référence `auth.users(id)`
- **Non null** : `id`, `is_admin`, `created_at`
- **Valeur par défaut** :
  - `reputation_score` : `0`
  - `is_verified` : `false`
  - `is_admin` : `false`
  - `created_at` : `timezone('utc'::text, now())`

## 🔐 Politiques RLS (Row Level Security)

```sql
-- Les profils sont visibles par tous
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

-- Les utilisateurs peuvent créer leur propre profil
CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## ✅ Vérification de la structure

Pour vérifier que votre table `profiles` a bien le champ `is_admin` :

```sql
-- Vérifier la structure complète de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

Vous devriez voir `is_admin` dans les résultats avec :
- `data_type` : `boolean`
- `is_nullable` : `NO`
- `column_default` : `false`

## 🆕 Migration

Si le champ `is_admin` n'existe pas encore, exécutez :

```sql
-- Voir le fichier : supabase/migrations/add_is_admin_to_profiles.sql
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
COMMENT ON COLUMN profiles.is_admin IS 'Indique si l''utilisateur est un administrateur';
```

---

**Pour créer un compte admin, voir le guide : [CREER_COMPTE_ADMIN.md](./CREER_COMPTE_ADMIN.md)**

