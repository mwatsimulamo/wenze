/**
 * Récupère le classement des utilisateurs par total WZP
 */

import { supabase } from '../lib/supabase';

export interface LeaderboardUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  total_wzp: number;
  rank_position?: number;
}

/**
 * Récupère le classement des utilisateurs par WZP
 * @param limit - Nombre maximum d'utilisateurs à retourner (défaut: 200)
 * @returns Liste des utilisateurs classés par WZP décroissant
 */
export const getWZPLeaderboard = async (limit: number = 200): Promise<LeaderboardUser[]> => {
  try {
    // Utiliser la fonction PostgreSQL pour obtenir le classement
    const { data, error } = await supabase.rpc('get_wzp_leaderboard', {
      limit_count: limit
    });

    if (error) {
      // Si la fonction n'existe pas, utiliser une requête alternative
      if (error.code === '42883' || error.message?.includes('function')) {
        console.warn('Fonction get_wzp_leaderboard non trouvée, utilisation de la vue wzp_leaderboard');
        return getWZPLeaderboardFallback(limit);
      }
      console.error('Erreur lors de la récupération du classement:', error);
      return [];
    }

    // Mapper et trier par total_wzp décroissant pour garantir l'ordre correct
    const mapped = (data || []).map((user: any) => ({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      is_verified: user.is_verified || false,
      total_wzp: parseFloat(user.total_wzp?.toString() || '0'),
      rank_position: user.rank_position || 0
    }));

    // Tri de sécurité par total_wzp décroissant, puis réassignation des rangs
    const sorted = mapped.sort((a, b) => {
      // D'abord trier par total_wzp décroissant
      if (b.total_wzp !== a.total_wzp) {
        return b.total_wzp - a.total_wzp;
      }
      // En cas d'égalité, utiliser l'id pour un tri stable
      return a.id.localeCompare(b.id);
    });

    // Réassigner les rangs correctement après le tri
    return sorted.map((user, index) => ({
      ...user,
      rank_position: index + 1
    }));
  } catch (error: any) {
    console.error('Erreur lors de la récupération du classement WZP:', error);
    return [];
  }
};

/**
 * Méthode de repli utilisant la vue wzp_leaderboard ou une requête directe
 */
const getWZPLeaderboardFallback = async (limit: number): Promise<LeaderboardUser[]> => {
  try {
    // Essayer d'utiliser la vue
    const { data: viewData, error: viewError } = await supabase
      .from('wzp_leaderboard')
      .select('*')
      .order('total_wzp', { ascending: false })
      .limit(limit);

    if (!viewError && viewData) {
      // Trier par total_wzp décroissant pour garantir l'ordre correct
      const sorted = [...viewData].sort((a: any, b: any) => {
        const aTotal = parseFloat(a.total_wzp?.toString() || '0');
        const bTotal = parseFloat(b.total_wzp?.toString() || '0');
        if (bTotal !== aTotal) {
          return bTotal - aTotal;
        }
        // En cas d'égalité, utiliser l'id pour un tri stable
        return (a.id || '').localeCompare(b.id || '');
      });

      return sorted.map((user: any, index: number) => ({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified || false,
        total_wzp: parseFloat(user.total_wzp?.toString() || '0'),
        rank_position: index + 1
      }));
    }

    // Si la vue n'existe pas, utiliser une requête directe avec agrégation
    // Note: Cette approche nécessite que les politiques RLS permettent la lecture des profils
    // et au moins la lecture des montants WZP agrégés
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        is_verified,
        wzp_transactions!inner(amount)
      `)
      .limit(limit);

    if (profilesError) {
      console.error('Erreur lors de la récupération des profils:', profilesError);
      return [];
    }

    // Grouper et calculer les totaux côté client
    const userMap = new Map<string, LeaderboardUser>();

    profilesData?.forEach((profile: any) => {
      const userId = profile.id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          is_verified: profile.is_verified || false,
          total_wzp: 0,
          rank_position: 0
        });
      }

      const user = userMap.get(userId)!;
      const transactions = profile.wzp_transactions || [];
      const total = transactions.reduce(
        (sum: number, t: any) => sum + (parseFloat(t.amount?.toString() || '0')),
        0
      );
      user.total_wzp += total;
    });

    // Convertir en tableau, trier et ajouter les rangs
    const leaderboard = Array.from(userMap.values())
      .filter(user => user.total_wzp > 0)
      .sort((a, b) => b.total_wzp - a.total_wzp)
      .map((user, index) => ({
        ...user,
        rank_position: index + 1
      }));

    return leaderboard.slice(0, limit);
  } catch (error: any) {
    console.error('Erreur dans getWZPLeaderboardFallback:', error);
    return [];
  }
};

/**
 * Récupère la position d'un utilisateur dans le classement
 * @param userId - ID de l'utilisateur
 * @returns Position dans le classement (0 si non trouvé ou pas de WZP)
 */
export const getUserRank = async (userId: string): Promise<number> => {
  try {
    const leaderboard = await getWZPLeaderboard(1000);
    const userIndex = leaderboard.findIndex(user => user.id === userId);
    return userIndex >= 0 ? userIndex + 1 : 0;
  } catch (error) {
    console.error('Erreur lors de la récupération du rang:', error);
    return 0;
  }
};

