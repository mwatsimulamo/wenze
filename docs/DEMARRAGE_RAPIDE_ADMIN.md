# 🚀 Démarrage Rapide - Système d'Administration des Récompenses

Ce guide vous explique **exactement** quoi faire, étape par étape, pour mettre en place le système d'administration des récompenses.

---

## 📋 Ce que vous allez faire

1. ✅ Exécuter les migrations SQL (créer les tables)
2. ✅ Créer un compte administrateur
3. ✅ Tester l'accès à l'interface admin
4. ✅ Envoyer vos premières récompenses

**Temps estimé : 10-15 minutes**

---

## ÉTAPE 1 : Exécuter les migrations SQL

### Qu'est-ce qu'une migration SQL ?
C'est un fichier SQL qui crée ou modifie des éléments dans votre base de données (tables, colonnes, etc.).

### Fichiers à exécuter (dans l'ordre) :

#### 1.1. Créer la table de récompenses
**Fichier :** `supabase/migrations/create_wzp_rewards_system.sql`

**Comment faire :**
1. Ouvrez Supabase → SQL Editor
2. Cliquez sur "New query"
3. Ouvrez le fichier `supabase/migrations/create_wzp_rewards_system.sql`
4. Copiez TOUT le contenu
5. Collez dans l'éditeur SQL
6. Cliquez sur **"Run"** (ou Ctrl+Enter)

**✅ Résultat attendu :** Message "Success" (peut prendre quelques secondes)

---

#### 1.2. Ajouter le champ is_admin
**Fichier :** `supabase/migrations/add_is_admin_to_profiles.sql`

**Comment faire :**
1. Nouvelle requête SQL dans Supabase
2. Ouvrez le fichier `supabase/migrations/add_is_admin_to_profiles.sql`
3. Copiez TOUT le contenu
4. Collez dans l'éditeur SQL
5. Cliquez sur **"Run"**

**✅ Résultat attendu :** Message "Success"

---

#### 1.3. Configurer les permissions admin
**Fichier :** `supabase/migrations/update_wzp_rewards_admin_policies.sql`

**Comment faire :**
1. Nouvelle requête SQL dans Supabase
2. Ouvrez le fichier `supabase/migrations/update_wzp_rewards_admin_policies.sql`
3. Copiez TOUT le contenu
4. Collez dans l'éditeur SQL
5. Cliquez sur **"Run"**

**✅ Résultat attendu :** Message "Success"

---

## ÉTAPE 2 : Créer votre premier compte admin

### 2.1. Trouver votre email/ID

**Dans Supabase SQL Editor, exécutez :**

```sql
SELECT id, email, full_name, username
FROM profiles
WHERE email = 'VOTRE_EMAIL_ICI';
```

**Remplacez `VOTRE_EMAIL_ICI` par votre email réel :**
```sql
SELECT id, email, full_name, username
FROM profiles
WHERE email = 'monemail@gmail.com';
```

**✅ Résultat :** Vous verrez une ligne avec votre ID (un UUID comme `550e8400-e29b-41d4-a716-446655440000`)

**📝 Action :** Copiez cet ID quelque part, vous en aurez besoin !

---

### 2.2. Promouvoir votre compte en admin

**Dans Supabase SQL Editor, nouvelle requête :**

```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = 'COLLEZ_VOTRE_ID_ICI';
```

**Exemple concret :**
```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

**✅ Résultat attendu :** Message "Success. No rows returned"

---

### 2.3. Vérifier que ça a fonctionné

```sql
SELECT id, email, full_name, is_admin
FROM profiles
WHERE id = 'VOTRE_ID_ICI';
```

**✅ Vous devez voir :** `is_admin` = `true` (ou `t` dans certains cas)

---

## ÉTAPE 3 : Tester l'accès à l'interface admin

### 3.1. Se connecter à l'application

1. Ouvrez votre application WENZE dans le navigateur
2. **IMPORTANT : Déconnectez-vous** si vous êtes déjà connecté
3. Reconnectez-vous avec votre compte (celui que vous venez de promouvoir admin)

### 3.2. Accéder à l'interface admin

1. Dans votre navigateur, allez à l'URL :
   ```
   http://localhost:5173/admin/rewards
   ```
   (Remplacez par votre URL de production si déployé)

2. **✅ Si tout fonctionne :** Vous verrez l'interface d'administration avec les statistiques

3. **❌ Si vous voyez "Accès refusé" :**
   - Vérifiez que `is_admin = true` dans la base de données (étape 2.3)
   - Déconnectez-vous et reconnectez-vous
   - Videz le cache du navigateur (Ctrl+Shift+R)

---

## ÉTAPE 4 : Connecter votre wallet (pour envoyer des récompenses)

### 4.1. Prérequis

- Avoir un wallet Cardano installé (Nami, Eternl, etc.)
- Avoir des fonds ADA dans le wallet (sur testnet si vous êtes en développement)

### 4.2. Connexion

1. Sur la page `/admin/rewards`, cliquez sur **"Connecter Wallet"** (en haut à droite)

2. Sélectionnez votre wallet dans la liste

3. Approuvez la connexion dans votre extension wallet

4. **✅ Résultat :** Vous verrez :
   - "Wallet connecté" avec une coche verte
   - Votre adresse (tronquée)
   - Votre solde en ADA

---

## ÉTAPE 5 : Envoyer votre première récompense (Test)

### 5.1. Préparer un test

**Option A : Créer une réclamation de test**

Dans Supabase SQL Editor, créez une réclamation de test :

```sql
INSERT INTO wzp_rewards_claims (
  user_id,
  month,
  year,
  rank_position,
  wzp_points,
  reward_ada,
  cardano_address,
  status
) VALUES (
  'UN_USER_ID_QUI_EXISTE',  -- Remplacez par un ID utilisateur réel
  EXTRACT(MONTH FROM CURRENT_DATE),  -- Mois actuel
  EXTRACT(YEAR FROM CURRENT_DATE),   -- Année actuelle
  1,  -- Rang #1
  1000.0,  -- 1000 points WZP
  5.5,  -- 5.5 ADA de récompense
  'addr_test1qq...',  -- Remplacez par une adresse Cardano testnet valide
  'pending'  -- Statut en attente
);
```

**⚠️ Important :** Remplacez les valeurs entre guillemets par des valeurs réelles !

**Option B : Utiliser une réclamation existante**

Si vous avez déjà des utilisateurs qui ont réclamé des récompenses, passez à l'étape 5.2.

---

### 5.2. Envoyer la récompense

1. Dans l'interface `/admin/rewards`, vous verrez la liste des réclamations

2. Trouvez la réclamation avec le statut **"En attente"** (badge jaune)

3. Cliquez sur le bouton **"Envoyer"** (bouton violet avec icône avion)

4. Une confirmation apparaît, cliquez sur **"OK"**

5. Votre wallet s'ouvre :
   - Vérifiez le montant
   - Vérifiez l'adresse de destination
   - Cliquez sur **"Confirmer"** ou **"Signer"** dans le wallet

6. **✅ Résultat :**
   - La transaction est soumise
   - Le statut passe automatiquement à "Envoyée" (badge vert)
   - Un lien vers Cardanoscan apparaît pour suivre la transaction

---

## ✅ Vérification finale

### Checklist

- [ ] Les 3 migrations SQL ont été exécutées avec succès
- [ ] Mon compte a `is_admin = true` dans la base de données
- [ ] Je peux accéder à `/admin/rewards` sans erreur
- [ ] Mon wallet est connecté
- [ ] J'ai réussi à envoyer une récompense de test

---

## 🆘 En cas de problème

### Problème : "Accès refusé" sur /admin/rewards

**Solution :**
1. Vérifiez que `is_admin = true` :
   ```sql
   SELECT is_admin FROM profiles WHERE email = 'votre-email@exemple.com';
   ```
2. Si c'est `false`, exécutez :
   ```sql
   UPDATE profiles SET is_admin = true WHERE email = 'votre-email@exemple.com';
   ```
3. Déconnectez-vous et reconnectez-vous
4. Rafraîchissez la page

---

### Problème : "column 'is_admin' does not exist"

**Solution :** Vous n'avez pas exécuté la migration `add_is_admin_to_profiles.sql`. Retournez à l'ÉTAPE 1.2.

---

### Problème : Wallet ne se connecte pas

**Solution :**
1. Vérifiez que l'extension wallet est installée
2. Vérifiez que le wallet est déverrouillé
3. Essayez de rafraîchir la page et réessayer
4. Essayez avec un autre wallet (Nami, Eternl, etc.)

---

### Problème : "Lucid n'est pas initialisé"

**Solution :**
1. Vérifiez que Blockfrost est configuré dans votre `.env` :
   ```
   VITE_BLOCKFROST_PROJECT_ID=votre-project-id
   ```
2. Redémarrez le serveur de développement :
   ```bash
   npm run dev
   ```

---

## 📚 Fichiers de référence

Pour plus de détails, consultez :

- **GUIDE_ADMIN_REWARDS.md** - Guide complet de l'interface admin
- **GUIDE_ADMIN_REWARDS_RAPIDE.md** - Référence rapide
- **CREER_COMPTE_ADMIN.md** - Guide détaillé pour créer des admins
- **TABLE_PROFILES_ACTUALISEE.md** - Structure de la table profiles

---

**🎉 Félicitations ! Vous êtes maintenant prêt à gérer les récompenses WZP !**

Pour toute question, consultez les guides détaillés dans le dossier `docs/`.

