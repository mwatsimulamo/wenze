# 🔐 Configuration Resend - Vérification de Domaine

Si vous recevez l'erreur :

```
You can only send testing emails to your own email address. 
To send emails to other recipients, please verify a domain at resend.com/domains
```

---

## 📋 Explication

**Resend en mode gratuit/test** permet d'envoyer des emails uniquement :
- ✅ À votre propre adresse email (celle avec laquelle vous vous êtes inscrit)
- ❌ Pas aux autres destinataires

Pour envoyer des emails à n'importe quel destinataire, vous devez **vérifier un domaine**.

---

## ✅ Solution 1 : Vérifier un Domaine (Recommandé pour Production)

### Étape 1 : Aller sur Resend

1. Connectez-vous sur [resend.com](https://resend.com)
2. Allez dans **"Domains"** (menu de gauche)
3. Cliquez sur **"Add Domain"**

### Étape 2 : Ajouter votre Domaine

1. **Entrez votre domaine** (ex: `wenze.com` ou `mail.wenze.com`)
2. **Cliquez sur "Add"**

### Étape 3 : Configurer les DNS

Resend vous donnera des **enregistrements DNS à ajouter** dans votre hébergeur de domaine :

**Exemples d'enregistrements à ajouter :**

```
Type    Name    Value
TXT     @       resend._domainkey=... (votre clé DKIM)
TXT     @       v=spf1 include:resend.com ~all
MX      @       feedback-smtp.resend.com (priority: 10)
```

### Étape 4 : Vérifier le Domaine

1. **Ajoutez les enregistrements DNS** dans votre hébergeur (Cloudflare, GoDaddy, etc.)
2. **Attendez quelques minutes** (propagation DNS : 5-60 minutes)
3. **Retournez sur Resend** → Domains
4. **Cliquez sur "Verify"**

**✅ Statut :** Une fois vérifié, le statut passera à "Verified"

### Étape 5 : Mettre à jour la Configuration

Dans **Supabase Dashboard** → **Edge Functions** → **Secrets**, mettez à jour :

```
RESEND_FROM_EMAIL=WENZE <noreply@votre-domaine-verifie.com>
```

**Remplacez `votre-domaine-verifie.com`** par votre domaine vérifié.

---

## 🔧 Solution 2 : Utiliser le Domaine de Test Resend (Temporaire)

Si vous n'avez pas encore de domaine, vous pouvez utiliser le domaine de test de Resend, mais **vous ne pourrez envoyer qu'à votre propre email**.

### Configuration

Dans **Supabase Dashboard** → **Edge Functions** → **Secrets** :

```
RESEND_FROM_EMAIL=WENZE <onboarding@resend.dev>
```

⚠️ **Limitation :** Vous ne pourrez envoyer des emails qu'à l'adresse email avec laquelle vous vous êtes inscrit sur Resend.

---

## 🧪 Solution 3 : Mode Test (Développement)

Pour les tests en développement, vous pouvez :

### Option A : Envoyer uniquement à votre email

Modifiez temporairement le code pour forcer l'envoi à votre email de test.

### Option B : Utiliser un service d'email de test

- [Mailtrap](https://mailtrap.io) - Pour les tests d'emails
- [Mailhog](https://github.com/mailhog/MailHog) - Serveur SMTP de test local

---

## 📝 Guide Complet : Vérifier un Domaine

### Exemple : Vérifier avec Cloudflare

1. **Aller sur Cloudflare** → Votre domaine
2. **DNS** → **Add record**
3. **Ajouter les enregistrements fournis par Resend :**

   **Enregistrement 1 - DKIM :**
   ```
   Type: TXT
   Name: @
   Content: resend._domainkey=... (copiez depuis Resend)
   ```

   **Enregistrement 2 - SPF :**
   ```
   Type: TXT
   Name: @
   Content: v=spf1 include:resend.com ~all
   ```

   **Enregistrement 3 - MX :**
   ```
   Type: MX
   Name: @
   Mail server: feedback-smtp.resend.com
   Priority: 10
   ```

4. **Sauvegarder** et attendre la propagation (5-60 min)
5. **Retourner sur Resend** → Cliquer sur "Verify"

---

### Exemple : Vérifier avec GoDaddy

1. **Aller sur GoDaddy** → My Products → DNS
2. **Ajouter les enregistrements** fournis par Resend
3. **Sauvegarder** et attendre la propagation
4. **Vérifier sur Resend**

---

## ✅ Vérification

Une fois le domaine vérifié :

1. **Mettre à jour le secret** `RESEND_FROM_EMAIL` dans Supabase
2. **Tester l'envoi** depuis l'interface admin
3. **Vérifier que l'email est bien reçu** par n'importe quel destinataire

---

## 🆘 Dépannage

### Le domaine reste "Pending"

**Causes possibles :**
- Les enregistrements DNS ne sont pas encore propagés (attendez jusqu'à 24h)
- Les enregistrements sont incorrects (vérifiez l'orthographe)
- Vous avez fait une erreur dans les valeurs (copiez-collez exactement depuis Resend)

**Solution :**
- Utilisez un outil comme [mxtoolbox.com](https://mxtoolbox.com) pour vérifier vos enregistrements DNS
- Vérifiez que les valeurs correspondent exactement à celles fournies par Resend

### Erreur 403 même après vérification

**Vérifiez :**
- Le secret `RESEND_FROM_EMAIL` utilise bien votre domaine vérifié
- Vous avez redéployé la fonction Edge après avoir changé le secret
- Le domaine est bien "Verified" dans Resend

---

## 💡 Conseils

- ✅ **Pour la production :** Vérifiez toujours un domaine
- ✅ **Pour les tests :** Utilisez votre propre email
- ✅ **Un domaine vérifié** améliore aussi la délivrabilité (moins de spams)

---

**Besoin d'aide ?** Consultez la documentation Resend : [resend.com/docs](https://resend.com/docs)

