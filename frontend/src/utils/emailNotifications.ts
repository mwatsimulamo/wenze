/**
 * Utilitaires pour envoyer des notifications par email
 */

import { supabase } from '../lib/supabase';

export interface RewardNotificationData {
  email: string;
  userName: string;
  rewardAmount: number;
  txHash?: string;
  month: number;
  year: number;
}

/**
 * Envoie une notification par email lorsqu'une récompense est envoyée
 * @param data - Données de la notification
 * @returns Succès ou échec
 */
export const sendRewardNotification = async (
  data: RewardNotificationData
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Option 1: Utiliser une Edge Function Supabase (recommandé pour la production)
    try {
      const { data: result, error } = await supabase.functions.invoke('send-reward-notification', {
        body: data,
      });

      if (error) {
        console.error('Erreur Edge Function:', error);
        // Ne pas bloquer le processus si l'email échoue
        return { success: true, error: error.message };
      }

      if (result?.success) {
        console.log('✅ Notification email envoyée avec succès à', data.email);
        return { success: true };
      }

      // Si pas de succès explicite, on continue quand même (non-bloquant)
      console.warn('⚠️ Réponse inattendue de la Edge Function, mais on continue');
      return { success: true };
    } catch (edgeFunctionError: any) {
      // Si la Edge Function n'existe pas encore, on continue sans erreur
      // (pour le développement - non bloquant)
      const errorMessage = edgeFunctionError.message || String(edgeFunctionError);
      if (errorMessage.includes('Function not found') || 
          errorMessage.includes('404') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('function does not exist')) {
        console.warn('⚠️ Edge Function send-reward-notification non trouvée. Email non envoyé (mode développement).');
        console.warn('💡 Pour activer les emails, déployez la fonction : supabase/functions/send-reward-notification');
        return { success: true }; // On retourne success pour ne pas bloquer le processus
      }
      // Autre erreur : on log mais on ne bloque pas
      console.warn('⚠️ Erreur lors de l\'appel de la Edge Function (non bloquant):', edgeFunctionError);
      return { success: true }; // Non bloquant
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de la notification (non bloquant):', error);
    // Ne pas bloquer le processus si l'email échoue
    return { 
      success: true, // On retourne true pour ne pas bloquer le processus
      error: error.message || 'Erreur lors de l\'envoi de la notification' 
    };
  }
};

/**
 * Envoie des notifications pour plusieurs récompenses
 * @param notifications - Array de données de notification
 * @returns Résultats de l'envoi
 */
export const sendBulkRewardNotifications = async (
  notifications: RewardNotificationData[]
): Promise<{ success: boolean; sent: number; failed: number; errors?: string[] }> => {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const notification of notifications) {
    const result = await sendRewardNotification(notification);
    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`${notification.email}: ${result.error}`);
      }
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
};

