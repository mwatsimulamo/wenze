# 📧 Configuration des Notifications Email

Ce guide explique comment configurer le système de notifications par email pour les récompenses WZP.

---

## 🎯 Fonctionnement

Lorsqu'une récompense est envoyée (statut = "sent"), un email de notification est automatiquement envoyé à l'utilisateur à son adresse email enregistrée.

---

## ⚙️ Options de Configuration

### Option 1 : Utiliser Supabase Edge Functions avec Resend (✅ ACTIF)

Cette option est maintenant configurée et prête à utiliser avec Resend.

#### 1.1. Créer un compte Resend

1. **Aller sur [resend.com](https://resend.com)**
2. **Créer un compte gratuit** (3000 emails/mois gratuits)
3. **Vérifier votre email** pour activer le compte
4. **Aller dans "API Keys"** dans le dashboard
5. **Créer une nouvelle API key** :
   - Nom : `WENZE Production` (ou autre nom)
   - Permissions : Full access
   - **⚠️ IMPORTANT : Copiez la clé immédiatement** (elle ne sera plus visible après)

#### 1.2. Configurer Resend dans Supabase

1. **Aller dans Supabase Dashboard** → Votre projet
2. **Project Settings** → **Edge Functions** → **Secrets**
3. **Ajouter les secrets suivants** :
   
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   ```
   
   (Remplacez par votre vraie clé API Resend)

4. **Optionnel** : Ajouter aussi :
   
   ```
   RESEND_FROM_EMAIL=WENZE <noreply@votre-domaine.com>
   APP_URL=https://votre-domaine.com
   ```
   
   - `RESEND_FROM_EMAIL` : L'adresse email d'expéditeur (par défaut : `WENZE <onboarding@resend.dev>`)
   - `APP_URL` : L'URL de votre application (pour les liens dans l'email)

#### 1.3. Déployer la fonction Edge

```bash
# Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier votre projet Supabase
supabase link --project-ref votre-project-ref
# (Trouvez votre project-ref dans Supabase Dashboard → Project Settings → General)

# Déployer la fonction
supabase functions deploy send-reward-notification
```

**✅ Résultat attendu :** 
```
Deploying function send-reward-notification...
Function send-reward-notification deployed successfully
```

#### 1.4. Vérifier le déploiement

1. **Dans Supabase Dashboard** → **Edge Functions**
2. Vous devriez voir `send-reward-notification` dans la liste
3. **Tester** : Envoyez une récompense depuis l'interface admin
4. **Vérifier les logs** : Edge Functions → Logs → `send-reward-notification`

---

### Option 2 : Solution Simplifiée (Pour développement/test)

Si vous ne voulez pas configurer les Edge Functions immédiatement :

1. **Le système fonctionnera quand même** - Les emails ne seront pas envoyés, mais le reste du système fonctionne
2. **Les erreurs sont silencieuses** - Le processus d'envoi de récompense ne sera pas bloqué si l'email échoue
3. **Pour activer plus tard** : Suivez l'Option 1 ci-dessus

---

## 📋 Contenu de l'Email

L'email contient :
- ✅ Message de félicitations
- ✅ Montant de la récompense en ADA
- ✅ Période (mois et année)
- ✅ Hash de transaction (lien vers Cardanoscan)
- ✅ Instructions pour vérifier le wallet
- ✅ Lien vers le classement WZP

---

## ✅ Configuration déjà intégrée !

**Bonne nouvelle !** Le code est déjà configuré pour utiliser Resend. Il vous suffit de :

1. ✅ Créer un compte Resend
2. ✅ Ajouter votre clé API dans Supabase Secrets
3. ✅ Déployer la fonction Edge

**Aucune modification de code nécessaire !**

---

## ✅ Vérification

### Tester l'envoi d'email

1. **Envoyer une récompense** via l'interface admin
2. **Vérifier les logs** :
   - Supabase Dashboard → Edge Functions → Logs
   - Chercher "send-reward-notification"
3. **Vérifier la boîte email** de l'utilisateur

---

## 🆘 Dépannage

### Les emails ne sont pas envoyés

1. **Vérifier que la Edge Function est déployée** :
   ```bash
   supabase functions list
   ```
   - Vous devriez voir `send-reward-notification` dans la liste

2. **Vérifier les secrets dans Supabase** :
   - Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Vérifier que `RESEND_API_KEY` est bien configurée
   - ⚠️ Après avoir ajouté/modifié un secret, redéployez la fonction :
     ```bash
     supabase functions deploy send-reward-notification
     ```

3. **Vérifier les logs** :
   - Supabase Dashboard → Edge Functions → Logs
   - Sélectionner `send-reward-notification`
   - Rechercher les erreurs (en rouge) ou les messages de succès (✅)

4. **Vérifier votre clé API Resend** :
   - Aller sur [resend.com/dashboard](https://resend.com/dashboard) → API Keys
   - Vérifier que la clé est active
   - Si nécessaire, créer une nouvelle clé et mettre à jour dans Supabase

5. **Vérifier que l'email de l'utilisateur est valide** :
   ```sql
   SELECT email FROM profiles WHERE id = 'USER_ID';
   ```

### Erreur "Function not found"

1. **Déployer la fonction** :
   ```bash
   supabase functions deploy send-reward-notification
   ```

2. **Vérifier le déploiement** :
   - Supabase Dashboard → Edge Functions
   - La fonction doit apparaître dans la liste

### Erreur "RESEND_API_KEY non configurée"

1. **Ajouter la clé dans Supabase** :
   - Dashboard → Project Settings → Edge Functions → Secrets
   - Ajouter : `RESEND_API_KEY=votre-clé-api`

2. **Redéployer la fonction** (important après modification des secrets) :
   ```bash
   supabase functions deploy send-reward-notification
   ```

### Erreur "Resend API error"

1. **Vérifier que votre clé API est valide** sur resend.com
2. **Vérifier votre quota Resend** (3000 emails/mois en gratuit)
3. **Vérifier que l'adresse "from" est vérifiée** dans Resend (ou utiliser `onboarding@resend.dev` pour les tests)

---

## 📝 Notes importantes

- ⚠️ **En développement** : Les emails ne sont pas envoyés si la Edge Function n'existe pas (pas d'erreur bloquante)
- ✅ **En production** : Configurez un service d'email pour activer les notifications
- 💡 **Alternative** : Vous pouvez aussi créer un webhook ou utiliser un service comme Zapier

---

**Dernière mise à jour :** Décembre 2024

