/**
 * Calcule le total des points WZP d'un utilisateur
 */

import { supabase } from '../lib/supabase';

/**
 * Récupère le total des points WZP d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Total des points WZP (0 si erreur ou table inexistante)
 */
export const getWZPTotal = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('wzp_transactions')
      .select('amount')
      .eq('user_id', userId);

    if (error) {
      // Si la table n'existe pas, retourner 0 silencieusement
      if (
        error.message?.includes('does not exist') ||
        error.code === '42P01' ||
        (error.message?.includes('relation') && error.message?.includes('does not exist'))
      ) {
        return 0;
      }
      console.error('Erreur lors de la récupération des WZP:', error);
      return 0;
    }

    // Calculer la somme de tous les montants
    const total = data?.reduce((sum, transaction) => sum + (parseFloat(transaction.amount.toString()) || 0), 0) || 0;
    return parseFloat(total.toFixed(2));
  } catch (error: any) {
    console.error('Erreur lors du calcul du total WZP:', error);
    return 0;
  }
};






