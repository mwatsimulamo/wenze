# Fonction Edge : send-reward-notification

Cette fonction envoie des emails de notification aux utilisateurs lorsqu'ils reçoivent leurs récompenses WZP via **Resend**.

## 🚀 Déploiement Rapide

### 1. Créer un compte Resend

1. Aller sur [resend.com](https://resend.com)
2. Créer un compte gratuit (3000 emails/mois)
3. Vérifier votre email
4. Aller dans "API Keys" → "Create API Key"
5. **Copier la clé API** (elle ne sera plus visible après)

### 2. Configurer dans Supabase

1. **Supabase Dashboard** → Votre projet
2. **Project Settings** → **Edge Functions** → **Secrets**
3. **Ajouter** :
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   ```
   (Remplacez par votre vraie clé)

4. **Optionnel** :
   ```
   RESEND_FROM_EMAIL=WENZE <noreply@votre-domaine.com>
   APP_URL=https://votre-domaine.com
   ```

### 3. Déployer la fonction

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet (remplacez par votre project-ref)
supabase link --project-ref votre-project-ref

# Déployer
supabase functions deploy send-reward-notification
```

**✅ C'est tout !** Les emails seront envoyés automatiquement.

## 📋 Variables d'environnement (Secrets)

Dans Supabase Dashboard → Project Settings → Edge Functions → Secrets :

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `RESEND_API_KEY` | ✅ Oui | Votre clé API Resend | `re_xxxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | ❌ Non | Email expéditeur (défaut: `onboarding@resend.dev`) | `WENZE <noreply@wenze.com>` |
| `APP_URL` | ❌ Non | URL de l'app (pour liens dans email) | `https://wenze.com` |

**⚠️ Important :** Après avoir ajouté/modifié des secrets, **redéployez la fonction** :
```bash
supabase functions deploy send-reward-notification
```

## ✅ Utilisation

La fonction est appelée **automatiquement** depuis le frontend quand :
- Une récompense est envoyée (statut = "sent")
- Via `updateRewardClaimStatus()` dans `adminRewards.ts`

**Aucune action manuelle nécessaire !**

## 🧪 Tester

1. Envoyez une récompense depuis `/admin/rewards`
2. Vérifiez les logs : Supabase Dashboard → Edge Functions → Logs
3. Vérifiez la boîte email de l'utilisateur

## 🆘 Dépannage

### "RESEND_API_KEY non configurée"

➡️ Ajoutez la clé dans Supabase Secrets et redéployez la fonction.

### "Resend API error"

➡️ Vérifiez :
- La clé API est valide sur resend.com
- Votre quota n'est pas dépassé (3000/mois en gratuit)
- L'adresse "from" est vérifiée dans Resend (ou utilisez `onboarding@resend.dev`)

### Les emails ne sont pas envoyés

➡️ Vérifiez les logs : Edge Functions → Logs → `send-reward-notification`

---

**Pour plus de détails, voir : `docs/CONFIGURATION_EMAIL_NOTIFICATIONS.md`**

