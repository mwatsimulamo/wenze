-- Mise à jour des politiques RLS pour permettre aux admins de gérer les réclamations de récompenses
-- Option 1: Si vous avez un champ is_admin dans profiles (recommandé pour la production)
-- Décommentez ces lignes et commentez l'option 2 :

-- DROP POLICY IF EXISTS "Admins can view all reward claims" ON wzp_rewards_claims;
-- DROP POLICY IF EXISTS "Admins can update all reward claims" ON wzp_rewards_claims;

-- CREATE POLICY "Admins can view all reward claims" ON wzp_rewards_claims
--   FOR SELECT 
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles 
--       WHERE profiles.id = auth.uid() 
--       AND profiles.is_admin = true
--     )
--   );

-- CREATE POLICY "Admins can update all reward claims" ON wzp_rewards_claims
--   FOR UPDATE 
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles 
--       WHERE profiles.id = auth.uid() 
--       AND profiles.is_admin = true
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM profiles 
--       WHERE profiles.id = auth.uid() 
--       AND profiles.is_admin = true
--     )
--   );

-- Option 2: Pour le développement - permettre aux admins (basé sur is_admin)
-- Décommentez ces lignes pour utiliser le système is_admin :
DROP POLICY IF EXISTS "Admins can view all reward claims" ON wzp_rewards_claims;
DROP POLICY IF EXISTS "Admins can update all reward claims" ON wzp_rewards_claims;

CREATE POLICY "Admins can view all reward claims" ON wzp_rewards_claims
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update all reward claims" ON wzp_rewards_claims
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

