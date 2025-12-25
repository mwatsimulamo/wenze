-- Vue pour le classement des utilisateurs par WZP
-- Cette vue calcule le total WZP pour chaque utilisateur
CREATE OR REPLACE VIEW wzp_leaderboard AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.is_verified,
  COALESCE(SUM(wt.amount), 0) as total_wzp
FROM profiles p
LEFT JOIN wzp_transactions wt ON p.id = wt.user_id
GROUP BY p.id, p.username, p.full_name, p.avatar_url, p.is_verified
HAVING COALESCE(SUM(wt.amount), 0) > 0
ORDER BY total_wzp DESC;

-- Permettre l'accès public à cette vue (lecture seule)
GRANT SELECT ON wzp_leaderboard TO anon, authenticated;

-- Ajouter une politique RLS pour permettre la lecture publique
-- Note: Les vues n'ont pas de RLS par défaut, donc on peut simplement accorder SELECT

-- Pour améliorer les performances, créons aussi une fonction qui peut être appelée avec des limites
-- NOTE: On utilise une sous-requête pour calculer d'abord total_wzp, puis le rang
CREATE OR REPLACE FUNCTION get_wzp_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN,
  total_wzp NUMERIC,
  rank_position BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    sub.id,
    sub.username,
    sub.full_name,
    sub.avatar_url,
    sub.is_verified,
    sub.total_wzp,
    ROW_NUMBER() OVER (ORDER BY sub.total_wzp DESC) as rank_position
  FROM (
    SELECT 
      p.id,
      p.username,
      p.full_name,
      p.avatar_url,
      p.is_verified,
      COALESCE(SUM(wt.amount), 0) as total_wzp
    FROM profiles p
    LEFT JOIN wzp_transactions wt ON p.id = wt.user_id
    GROUP BY p.id, p.username, p.full_name, p.avatar_url, p.is_verified
    HAVING COALESCE(SUM(wt.amount), 0) > 0
  ) sub
  ORDER BY sub.total_wzp DESC
  LIMIT limit_count;
$$;

-- Permettre l'accès public à cette fonction
GRANT EXECUTE ON FUNCTION get_wzp_leaderboard TO anon, authenticated;

