-- Ajouter le champ is_admin à la table profiles
-- Par défaut, tous les utilisateurs sont non-admins (false)

-- Vérifier si la colonne existe déjà avant de l'ajouter
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
    
    -- Commentaire pour documenter
    COMMENT ON COLUMN profiles.is_admin IS 'Indique si l''utilisateur est un administrateur';
  END IF;
END $$;

-- Pour créer un admin manuellement (à exécuter séparément si nécessaire) :
-- UPDATE profiles SET is_admin = true WHERE id = 'VOTRE_USER_ID_ICI';

