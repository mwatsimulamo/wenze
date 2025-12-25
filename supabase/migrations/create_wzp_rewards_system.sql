-- Table pour stocker les réclamations de récompenses mensuelles
CREATE TABLE IF NOT EXISTS wzp_rewards_claims (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  month INTEGER NOT NULL, -- Mois (1-12)
  year INTEGER NOT NULL, -- Année (ex: 2024)
  rank_position INTEGER NOT NULL, -- Position dans le classement ce mois-ci
  wzp_points NUMERIC NOT NULL, -- Total WZP au moment de la réclamation
  reward_ada NUMERIC NOT NULL, -- Montant de la récompense en ADA
  cardano_address TEXT NOT NULL, -- Adresse Cardano fournie par l'utilisateur
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed'
  tx_hash TEXT, -- Hash de la transaction de paiement (si envoyée)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Un utilisateur ne peut réclamer qu'une seule fois par mois
  UNIQUE(user_id, month, year)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_wzp_rewards_claims_user_month_year ON wzp_rewards_claims(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_wzp_rewards_claims_status ON wzp_rewards_claims(status);
CREATE INDEX IF NOT EXISTS idx_wzp_rewards_claims_month_year ON wzp_rewards_claims(year, month);

-- Enable RLS
ALTER TABLE wzp_rewards_claims ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- Supprimer les politiques existantes si elles existent (pour rendre la migration idempotente)
DROP POLICY IF EXISTS "Users can view own reward claims" ON wzp_rewards_claims;
DROP POLICY IF EXISTS "Users can create own reward claims" ON wzp_rewards_claims;
DROP POLICY IF EXISTS "Users can update own pending reward claims" ON wzp_rewards_claims;

-- Les utilisateurs peuvent voir leurs propres réclamations
CREATE POLICY "Users can view own reward claims" ON wzp_rewards_claims
  FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres réclamations
CREATE POLICY "Users can create own reward claims" ON wzp_rewards_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres réclamations en statut pending
CREATE POLICY "Users can update own pending reward claims" ON wzp_rewards_claims
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Fonction pour obtenir le mois et l'année actuels
CREATE OR REPLACE FUNCTION get_current_reward_period()
RETURNS TABLE (current_month INTEGER, current_year INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour calculer la récompense ADA basée sur le rang (Top 50 uniquement)
-- Formule : Récompense décroissante selon le rang (plus le rang est élevé, moins la récompense)
CREATE OR REPLACE FUNCTION calculate_wzp_reward(rank_pos INTEGER, total_wzp NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  base_reward NUMERIC;
  rank_bonus NUMERIC;
BEGIN
  -- Vérifier que le rang est dans le top 50
  IF rank_pos > 50 OR rank_pos < 1 THEN
    RETURN 0;
  END IF;
  
  -- Récompense de base basée sur les WZP (1 WZP = 0.001 ADA par exemple)
  base_reward := total_wzp * 0.001;
  
  -- Bonus selon le rang (le #1 reçoit plus)
  -- Formule: (51 - rank) * 0.1 ADA (le #1 reçoit 5 ADA de bonus, le #50 reçoit 0.1 ADA)
  rank_bonus := (51 - rank_pos) * 0.1;
  
  -- Récompense totale (minimum 0.1 ADA)
  RETURN GREATEST(base_reward + rank_bonus, 0.1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_wzp_rewards_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS wzp_rewards_claims_updated_at ON wzp_rewards_claims;

CREATE TRIGGER wzp_rewards_claims_updated_at
  BEFORE UPDATE ON wzp_rewards_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_wzp_rewards_claims_updated_at();

-- Permettre l'accès public aux fonctions
GRANT EXECUTE ON FUNCTION get_current_reward_period TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_wzp_reward TO anon, authenticated;

