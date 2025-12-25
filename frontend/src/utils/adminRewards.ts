/**
 * Utilitaires admin pour gérer les récompenses WZP
 */

import { supabase } from '../lib/supabase';
import { RewardClaim } from './wzpRewards';
import { sendRewardNotification } from './emailNotifications';

export interface RewardClaimWithUser extends RewardClaim {
  user?: {
    id: string;
    username: string | null;
    full_name: string | null;
    email: string | null;
  };
}

export interface RewardStats {
  totalClaims: number;
  pendingClaims: number;
  sentClaims: number;
  failedClaims: number;
  totalRewardAmount: number;
  pendingRewardAmount: number;
}

/**
 * Récupère toutes les réclamations avec les informations utilisateur
 * @param filters - Filtres optionnels (status, month, year)
 */
export const getAllRewardClaims = async (filters?: {
  status?: 'pending' | 'processing' | 'sent' | 'failed';
  month?: number;
  year?: number;
}): Promise<RewardClaimWithUser[]> => {
  try {
    let query = supabase
      .from('wzp_rewards_claims')
      .select(`
        *,
        profiles:user_id(id, username, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.month) {
      query = query.eq('month', filters.month);
    }
    if (filters?.year) {
      query = query.eq('year', filters.year);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des réclamations:', error);
      throw error;
    }

    return (data || []).map((claim: any) => ({
      ...claim,
      user: claim.profiles || undefined,
    })) as RewardClaimWithUser[];
  } catch (error: any) {
    console.error('Erreur lors de la récupération des réclamations:', error);
    throw error;
  }
};

/**
 * Met à jour le statut d'une réclamation
 * @param claimId - ID de la réclamation
 * @param status - Nouveau statut
 * @param txHash - Hash de transaction (optionnel, pour status 'sent')
 * @param sendEmail - Envoyer une notification email (par défaut: true pour status 'sent')
 */
export const updateRewardClaimStatus = async (
  claimId: string,
  status: 'pending' | 'processing' | 'sent' | 'failed',
  txHash?: string,
  sendEmail: boolean = true
): Promise<{ success: boolean; message?: string }> => {
  try {
    // Récupérer les données de la réclamation avant mise à jour (pour l'email)
    let claimData: RewardClaimWithUser | null = null;
    if (status === 'sent' && sendEmail) {
      const { data } = await supabase
        .from('wzp_rewards_claims')
        .select(`
          *,
          profiles:user_id(id, username, full_name, email)
        `)
        .eq('id', claimId)
        .single();
      
      if (data) {
        claimData = {
          ...data,
          user: data.profiles || undefined,
        } as RewardClaimWithUser;
      }
    }

    const updateData: any = { status };

    if (txHash && status === 'sent') {
      updateData.tx_hash = txHash;
    }

    const { error } = await supabase
      .from('wzp_rewards_claims')
      .update(updateData)
      .eq('id', claimId);

    if (error) {
      console.error('Erreur lors de la mise à jour de la réclamation:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour',
      };
    }

    // Envoyer la notification email si le statut est 'sent' et qu'on a les données
    if (status === 'sent' && sendEmail && claimData && claimData.user?.email) {
      sendRewardNotification({
        email: claimData.user.email,
        userName: claimData.user.full_name || claimData.user.username || 'Utilisateur',
        rewardAmount: claimData.reward_ada,
        txHash: txHash,
        month: claimData.month,
        year: claimData.year,
      }).catch(error => {
        console.error(`Erreur envoi email pour ${claimData.user?.email}:`, error);
        // Ne pas bloquer si l'email échoue
      });
    }

    return {
      success: true,
      message: 'Réclamation mise à jour avec succès',
    };
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la réclamation:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de la mise à jour',
    };
  }
};

/**
 * Met à jour plusieurs réclamations en batch
 * @param claimIds - IDs des réclamations
 * @param status - Nouveau statut
 */
export const bulkUpdateRewardClaimStatus = async (
  claimIds: string[],
  status: 'pending' | 'processing' | 'sent' | 'failed'
): Promise<{ success: boolean; message?: string; count?: number }> => {
  try {
    const { error, count } = await supabase
      .from('wzp_rewards_claims')
      .update({ status })
      .in('id', claimIds);

    if (error) {
      console.error('Erreur lors de la mise à jour en batch:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour',
      };
    }

    return {
      success: true,
      message: `${count || claimIds.length} réclamation(s) mise(s) à jour`,
      count: count || claimIds.length,
    };
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour en batch:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de la mise à jour',
    };
  }
};

/**
 * Récupère les statistiques des récompenses
 */
export const getRewardStats = async (): Promise<RewardStats> => {
  try {
    const { data, error } = await supabase
      .from('wzp_rewards_claims')
      .select('status, reward_ada');

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }

    const stats: RewardStats = {
      totalClaims: data?.length || 0,
      pendingClaims: 0,
      sentClaims: 0,
      failedClaims: 0,
      totalRewardAmount: 0,
      pendingRewardAmount: 0,
    };

    data?.forEach((claim: any) => {
      const rewardAda = parseFloat(claim.reward_ada?.toString() || '0');
      stats.totalRewardAmount += rewardAda;

      switch (claim.status) {
        case 'pending':
          stats.pendingClaims++;
          stats.pendingRewardAmount += rewardAda;
          break;
        case 'sent':
          stats.sentClaims++;
          break;
        case 'failed':
          stats.failedClaims++;
          break;
      }
    });

    return stats;
  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
};

/**
 * Récupère les réclamations groupées par mois/année
 */
export const getRewardClaimsByPeriod = async (): Promise<
  Array<{ month: number; year: number; count: number; totalAda: number }>
> => {
  try {
    const { data, error } = await supabase
      .from('wzp_rewards_claims')
      .select('month, year, reward_ada')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération par période:', error);
      throw error;
    }

    const periodMap = new Map<string, { count: number; totalAda: number }>();

    data?.forEach((claim: any) => {
      const key = `${claim.year}-${claim.month}`;
      const existing = periodMap.get(key) || { count: 0, totalAda: 0 };
      periodMap.set(key, {
        count: existing.count + 1,
        totalAda: existing.totalAda + parseFloat(claim.reward_ada?.toString() || '0'),
      });
    });

    return Array.from(periodMap.entries()).map(([key, value]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month,
        year,
        ...value,
      };
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération par période:', error);
    throw error;
  }
};

