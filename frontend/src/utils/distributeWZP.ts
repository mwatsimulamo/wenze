/**
 * Distribution automatique des WZP (Wenze Points) après une transaction ADA réussie
 * Règle : 1 ADA = 0.5 WZP
 * Les WZP sont distribués à l'acheteur et au vendeur après une transaction réussie
 */

import { supabase } from '../lib/supabase';

export interface WZPDistributionResult {
  success: boolean;
  buyerWZP?: number;
  sellerWZP?: number;
  message?: string;
}

/**
 * Distribue les WZP après une transaction ADA réussie
 * @param orderId - ID de la commande
 * @param buyerId - ID de l'acheteur
 * @param sellerId - ID du vendeur
 * @param amountAda - Montant de la transaction en ADA
 * @returns Résultat de la distribution
 */
export const distributeWZPAfterTransaction = async (
  orderId: string,
  buyerId: string,
  sellerId: string,
  amountAda: number
): Promise<WZPDistributionResult> => {
  try {
    // Calculer le montant de WZP : 1 ADA = 0.5 WZP
    const wzpAmount = parseFloat((amountAda * 0.5).toFixed(2));

    console.log(`💎 Distribution WZP : ${amountAda} ADA = ${wzpAmount} WZP pour chaque partie`);

    // Vérifier si la table wzp_transactions existe en tentant une insertion
    // Si la table n'existe pas, on retourne un succès silencieux pour ne pas bloquer le flux
    try {
      // Insérer les transactions WZP pour l'acheteur et le vendeur
      const { error: insertError } = await supabase
        .from('wzp_transactions')
        .insert([
          {
            user_id: buyerId,
            amount: wzpAmount,
            type: 'earn_buy',
            reference_id: orderId
          },
          {
            user_id: sellerId,
            amount: wzpAmount,
            type: 'earn_sell',
            reference_id: orderId
          }
        ]);

      if (insertError) {
        // Si la table n'existe pas, ignorer l'erreur silencieusement
        if (
          insertError.message?.includes('does not exist') ||
          insertError.code === '42P01' ||
          (insertError.message?.includes('relation') && insertError.message?.includes('does not exist'))
        ) {
          console.info('ℹ️ Table wzp_transactions n\'existe pas - WZP non distribués');
          return {
            success: true,
            message: 'WZP non distribués (table n\'existe pas)'
          };
        }
        
        // Autre erreur (permissions, contraintes, etc.)
        console.error('❌ Erreur lors de l\'insertion WZP:', insertError);
        throw insertError;
      }

      console.log(`✅ WZP distribués avec succès : ${wzpAmount} WZP pour l'acheteur et ${wzpAmount} WZP pour le vendeur`);
      
      return {
        success: true,
        buyerWZP: wzpAmount,
        sellerWZP: wzpAmount,
        message: `${wzpAmount} WZP distribués à l'acheteur et au vendeur`
      };

    } catch (tableError: any) {
      // Si la table n'existe pas, ignorer silencieusement
      if (
        tableError.message?.includes('does not exist') ||
        tableError.code === '42P01' ||
        (tableError.message?.includes('relation') && tableError.message?.includes('does not exist'))
      ) {
        console.info('ℹ️ Table wzp_transactions n\'existe pas - WZP non distribués');
        return {
          success: true,
          message: 'WZP non distribués (table n\'existe pas)'
        };
      }
      throw tableError;
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la distribution des WZP:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de la distribution des WZP'
    };
  }
};

