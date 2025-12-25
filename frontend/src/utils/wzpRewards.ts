/**
 * Utilitaires pour le système de récompenses WZP mensuelles
 */

import { supabase } from '../lib/supabase';
import { getWZPLeaderboard, getUserRank } from './getWZPLeaderboard';

export interface RewardClaim {
  id: string;
  user_id: string;
  month: number;
  year: number;
  rank_position: number;
  wzp_points: number;
  reward_ada: number;
  cardano_address: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  tx_hash?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RewardEligibility {
  eligible: boolean;
  rank?: number;
  wzpPoints?: number;
  estimatedReward?: number;
  alreadyClaimed?: boolean;
  currentClaim?: RewardClaim;
  message?: string;
}

/**
 * Récupère le mois et l'année actuels pour la période de récompense
 */
export const getCurrentRewardPeriod = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // JavaScript: 0-11, nous voulons 1-12
    year: now.getFullYear(),
  };
};

/**
 * Calcule la récompense ADA estimée basée sur le rang et les WZP
 * @param rank - Position dans le classement (1-50)
 * @param wzpPoints - Total de points WZP
 * @returns Montant estimé en ADA
 */
export const calculateRewardADA = (rank: number, wzpPoints: number): number => {
  if (rank > 50 || rank < 1) {
    return 0;
  }

  // Récompense de base basée sur les WZP (1 WZP = 0.001 ADA)
  const baseReward = wzpPoints * 0.001;

  // Bonus selon le rang (le #1 reçoit plus)
  // Formule: (51 - rank) * 0.1 ADA
  // Le #1 reçoit 5 ADA de bonus, le #50 reçoit 0.1 ADA
  const rankBonus = (51 - rank) * 0.1;

  // Récompense totale (minimum 0.1 ADA)
  return Math.max(baseReward + rankBonus, 0.1);
};

/**
 * Vérifie si un utilisateur est éligible pour réclamer une récompense mensuelle
 * @param userId - ID de l'utilisateur
 * @returns Informations sur l'éligibilité
 */
export const checkRewardEligibility = async (
  userId: string
): Promise<RewardEligibility> => {
  try {
    const { month, year } = getCurrentRewardPeriod();

    // Vérifier si l'utilisateur a déjà réclamé ce mois
    const { data: existingClaim, error: claimError } = await supabase
      .from('wzp_rewards_claims')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    if (claimError && claimError.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification des réclamations:', claimError);
    }

    if (existingClaim) {
      return {
        eligible: false,
        alreadyClaimed: true,
        currentClaim: existingClaim as RewardClaim,
        message: 'Vous avez déjà réclamé votre récompense ce mois-ci',
      };
    }

    // Obtenir le rang de l'utilisateur dans le classement
    const rank = await getUserRank(userId);
    
    if (!rank || rank > 50) {
      return {
        eligible: false,
        message: `Vous devez être dans le Top 50 pour réclamer une récompense. Votre rang actuel: ${rank || 'N/A'}`,
      };
    }

    // Obtenir le total WZP de l'utilisateur
    const leaderboard = await getWZPLeaderboard(100);
    const userEntry = leaderboard.find((u) => u.id === userId);

    if (!userEntry) {
      return {
        eligible: false,
        message: 'Impossible de trouver vos informations dans le classement',
      };
    }

    const wzpPoints = userEntry.total_wzp;
    const estimatedReward = calculateRewardADA(rank, wzpPoints);

    return {
      eligible: true,
      rank,
      wzpPoints,
      estimatedReward,
      alreadyClaimed: false,
      message: `Vous êtes éligible ! Rang #${rank} avec ${wzpPoints.toFixed(1)} WZP`,
    };
  } catch (error: any) {
    console.error('Erreur lors de la vérification de l\'éligibilité:', error);
    return {
      eligible: false,
      message: `Erreur lors de la vérification: ${error.message || 'Erreur inconnue'}`,
    };
  }
};

/**
 * Crée une réclamation de récompense pour l'utilisateur
 * @param userId - ID de l'utilisateur
 * @param cardanoAddress - Adresse Cardano où recevoir la récompense
 * @returns La réclamation créée
 */
export const claimReward = async (
  userId: string,
  cardanoAddress: string
): Promise<{ success: boolean; claim?: RewardClaim; message?: string }> => {
  try {
    // Vérifier l'éligibilité d'abord
    const eligibility = await checkRewardEligibility(userId);

    if (!eligibility.eligible) {
      return {
        success: false,
        message: eligibility.message || 'Vous n\'êtes pas éligible pour réclamer une récompense',
      };
    }

    // Valider l'adresse Cardano
    if (!cardanoAddress || !cardanoAddress.startsWith('addr')) {
      return {
        success: false,
        message: 'Adresse Cardano invalide. L\'adresse doit commencer par "addr"',
      };
    }

    const { month, year } = getCurrentRewardPeriod();

    // Calculer la récompense
    const rewardADA = calculateRewardADA(eligibility.rank!, eligibility.wzpPoints!);

    // Créer la réclamation
    const { data: claim, error: insertError } = await supabase
      .from('wzp_rewards_claims')
      .insert({
        user_id: userId,
        month,
        year,
        rank_position: eligibility.rank!,
        wzp_points: eligibility.wzpPoints!,
        reward_ada: rewardADA,
        cardano_address: cardanoAddress,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur lors de la création de la réclamation:', insertError);
      return {
        success: false,
        message: `Erreur lors de la création de la réclamation: ${insertError.message}`,
      };
    }

    return {
      success: true,
      claim: claim as RewardClaim,
      message: `Récompense de ${rewardADA.toFixed(2)} ADA réclamée avec succès !`,
    };
  } catch (error: any) {
    console.error('Erreur lors de la réclamation:', error);
    return {
      success: false,
      message: `Erreur lors de la réclamation: ${error.message || 'Erreur inconnue'}`,
    };
  }
};

/**
 * Récupère les réclamations d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Liste des réclamations
 */
export const getUserRewardClaims = async (userId: string): Promise<RewardClaim[]> => {
  try {
    const { data, error } = await supabase
      .from('wzp_rewards_claims')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des réclamations:', error);
      return [];
    }

    return (data || []) as RewardClaim[];
  } catch (error) {
    console.error('Erreur lors de la récupération des réclamations:', error);
    return [];
  }
};

/**
 * Vérifie si une adresse Cardano est valide (format basique)
 */
export const isValidCardanoAddress = (address: string): boolean => {
  if (!address) return false;
  // Format basique: doit commencer par "addr" ou "addr_test"
  return /^addr(_test)?1[0-9a-z]+$/i.test(address.trim());
};

