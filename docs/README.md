# 📚 Documentation - Système d'Administration des Récompenses WZP

Bienvenue dans la documentation du système d'administration des récompenses WZP.

---

## 🎯 Par où commencer ?

### ⭐ Nouveau sur le système ? → Commencez ici !

**[DEMARRAGE_RAPIDE_ADMIN.md](./DEMARRAGE_RAPIDE_ADMIN.md)**

Guide pas-à-pas pour :
- ✅ Installer le système
- ✅ Créer votre premier compte admin
- ✅ Tester l'interface
- ✅ Envoyer votre première récompense

**⏱️ Temps estimé : 10-15 minutes**

---

### 🤔 Quel guide utiliser ?

**[COMMENT_UTILISER_LES_GUIDES.md](./COMMENT_UTILISER_LES_GUIDES.md)**

Ce guide vous explique quel fichier lire selon votre besoin :
- Je veux créer un admin → Guide X
- Je veux comprendre l'interface → Guide Y
- J'ai un problème → Guide Z

---

## 📁 Tous les guides disponibles

| Guide | Description | Quand l'utiliser |
|-------|-------------|------------------|
| **[DEMARRAGE_RAPIDE_ADMIN.md](./DEMARRAGE_RAPIDE_ADMIN.md)** | ⭐ Installation complète pas-à-pas | Première fois que vous configurez le système |
| **[COMMENT_UTILISER_LES_GUIDES.md](./COMMENT_UTILISER_LES_GUIDES.md)** | 📖 Guide pour choisir le bon guide | Vous ne savez pas par où commencer |
| **[CREER_COMPTE_ADMIN.md](./CREER_COMPTE_ADMIN.md)** | 👤 Créer des comptes administrateurs | Vous voulez promouvoir un utilisateur en admin |
| **[GUIDE_ADMIN_REWARDS.md](./GUIDE_ADMIN_REWARDS.md)** | 📚 Documentation complète | Vous voulez tout comprendre en détail |
| **[GUIDE_ADMIN_REWARDS_RAPIDE.md](./GUIDE_ADMIN_REWARDS_RAPIDE.md)** | ⚡ Référence rapide | Vous utilisez l'interface et avez besoin d'une aide-mémoire |
| **[TABLE_PROFILES_ACTUALISEE.md](./TABLE_PROFILES_ACTUALISEE.md)** | 🗄️ Structure de la base de données | Vous voulez comprendre la structure technique |

---

## 🚀 Parcours recommandés

### Scénario 1 : Je dois installer le système pour la première fois

1. Lire **[DEMARRAGE_RAPIDE_ADMIN.md](./DEMARRAGE_RAPIDE_ADMIN.md)** complètement
2. Suivre chaque étape
3. Garder **[GUIDE_ADMIN_REWARDS_RAPIDE.md](./GUIDE_ADMIN_REWARDS_RAPIDE.md)** ouvert en référence

---

### Scénario 2 : Je dois créer un nouvel administrateur

1. Ouvrir **[CREER_COMPTE_ADMIN.md](./CREER_COMPTE_ADMIN.md)**
2. Suivre la Méthode 1 (Étapes 2 à 4)
3. ⏱️ Temps : 2 minutes

---

### Scénario 3 : Je dois former un nouvel admin utilisateur

1. Partager **[DEMARRAGE_RAPIDE_ADMIN.md](./DEMARRAGE_RAPIDE_ADMIN.md)** pour la configuration
2. Partager **[GUIDE_ADMIN_REWARDS.md](./GUIDE_ADMIN_REWARDS.md)** pour comprendre l'interface
3. Recommander **[GUIDE_ADMIN_REWARDS_RAPIDE.md](./GUIDE_ADMIN_REWARDS_RAPIDE.md)** comme référence

---

### Scénario 4 : J'utilise l'interface et j'ai besoin d'aide rapide

1. Ouvrir **[GUIDE_ADMIN_REWARDS_RAPIDE.md](./GUIDE_ADMIN_REWARDS_RAPIDE.md)**
2. Utiliser Ctrl+F pour chercher votre problème
3. Si pas trouvé, consulter **[GUIDE_ADMIN_REWARDS.md](./GUIDE_ADMIN_REWARDS.md)** section FAQ

---

## 💡 Comment utiliser ces guides

### Format des guides

Chaque guide suit cette structure :
- ✅ **Objectif clair** en haut
- ✅ **Instructions pas-à-pas**
- ✅ **Commandes SQL prêtes à copier-coller**
- ✅ **Résultats attendus**
- ✅ **Vérifications**
- ✅ **Dépannage**

### Astuces

1. **Copier-coller** : Toutes les commandes SQL sont prêtes à être copiées
2. **Recherche rapide** : Utilisez Ctrl+F (ou Cmd+F) pour chercher dans les guides
3. **Marquer les favoris** : Gardez les guides que vous utilisez souvent dans vos favoris
4. **Version imprimable** : Vous pouvez imprimer certains guides pour référence hors ligne

---

## 🔍 Recherche rapide

### Je veux...

- **...installer le système** → [DEMARRAGE_RAPIDE_ADMIN.md](./DEMARRAGE_RAPIDE_ADMIN.md)
- **...créer un admin** → [CREER_COMPTE_ADMIN.md](./CREER_COMPTE_ADMIN.md)
- **...comprendre l'interface** → [GUIDE_ADMIN_REWARDS.md](./GUIDE_ADMIN_REWARDS.md)
- **...aide rapide** → [GUIDE_ADMIN_REWARDS_RAPIDE.md](./GUIDE_ADMIN_REWARDS_RAPIDE.md)
- **...voir la structure DB** → [TABLE_PROFILES_ACTUALISEE.md](./TABLE_PROFILES_ACTUALISEE.md)
- **...savoir quel guide lire** → [COMMENT_UTILISER_LES_GUIDES.md](./COMMENT_UTILISER_LES_GUIDES.md)

---

## 📞 Support

Si vous avez des questions après avoir lu les guides :

1. Vérifiez la section **FAQ** dans [GUIDE_ADMIN_REWARDS.md](./GUIDE_ADMIN_REWARDS.md)
2. Consultez la section **Dépannage** dans [DEMARRAGE_RAPIDE_ADMIN.md](./DEMARRAGE_RAPIDE_ADMIN.md)
3. Contactez l'équipe de développement

---

## 📝 Mises à jour

Les guides sont mis à jour régulièrement. Vérifiez la date de "Dernière mise à jour" en bas de chaque guide.

**Dernière mise à jour globale :** Décembre 2024

---

## 📂 Fichiers SQL de migration

Les fichiers SQL nécessaires sont dans `supabase/migrations/` :

- `create_wzp_rewards_system.sql` - Crée la table et les fonctions de récompenses
- `add_is_admin_to_profiles.sql` - Ajoute le champ is_admin
- `update_wzp_rewards_admin_policies.sql` - Configure les permissions admin

**Ces fichiers sont expliqués dans [DEMARRAGE_RAPIDE_ADMIN.md](./DEMARRAGE_RAPIDE_ADMIN.md)**

---

**🎉 Bonne utilisation !**

