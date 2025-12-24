# Migrations de la base de données

## Problème : Erreur "column does not exist"

Si vous rencontrez une erreur indiquant que certaines colonnes n'existent pas dans la table `products`, vous devez exécuter les migrations SQL dans Supabase.

## Solution : Migration consolidée

Une migration consolidée a été créée pour simplifier le processus : `01_consolidate_all_product_columns.sql`

### Étapes pour exécuter la migration :

1. **Ouvrez votre projet Supabase**
   - Allez sur https://supabase.com
   - Sélectionnez votre projet

2. **Accédez à l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Cliquez sur "New query"

3. **Copiez et collez le contenu de la migration**
   - Ouvrez le fichier `supabase/migrations/01_consolidate_all_product_columns.sql`
   - Copiez tout son contenu
   - Collez-le dans l'éditeur SQL de Supabase

4. **Exécutez la migration**
   - Cliquez sur le bouton "Run" ou utilisez Ctrl+Enter (Cmd+Enter sur Mac)
   - Attendez que la migration se termine

5. **Vérifiez que tout s'est bien passé**
   - Vous devriez voir un message de succès
   - Les colonnes suivantes seront ajoutées à la table `products` :
     - `fashion_type` (TEXT)
     - `shoe_number` (TEXT)
     - `size` (TEXT)
     - `condition` (TEXT avec contrainte 'new' ou 'used')
     - `price_fc` (NUMERIC)
     - `price_type` (TEXT avec contrainte 'fixed' ou 'negotiable')
     - `price_min` (NUMERIC)
     - `price_max` (NUMERIC)
     - `contact_whatsapp` (TEXT)
     - `contact_email` (TEXT)
     - `is_available` (BOOLEAN)

## Notes importantes

- La migration utilise `IF NOT EXISTS`, donc vous pouvez l'exécuter plusieurs fois sans problème
- Cette migration est sûre et n'affecte pas les données existantes
- Les colonnes seront créées avec des valeurs par défaut appropriées si nécessaire

## Si vous préférez exécuter les migrations individuellement

Si vous préférez exécuter les migrations une par une, vous pouvez exécuter les fichiers suivants dans l'ordre :

1. `add_fashion_fields.sql` - Colonnes pour la mode
2. `add_product_size.sql` - Colonne size
3. `add_product_condition.sql` - Colonne condition (nouveau/occasion)
4. `add_price_fc_column.sql` - Colonne price_fc
5. `add_service_availability_and_price_type.sql` - Prix négociables et disponibilité
6. `add_contact_fields.sql` - Colonnes de contact

Mais la migration consolidée `01_consolidate_all_product_columns.sql` est recommandée car elle est plus simple et plus rapide.

