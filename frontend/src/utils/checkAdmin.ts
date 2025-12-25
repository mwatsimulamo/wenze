/**
 * Utilitaires pour vérifier si un utilisateur est admin
 */

import { supabase } from '../lib/supabase';

/**
 * Vérifie si l'utilisateur actuel est un administrateur
 * @param userId - ID de l'utilisateur (optionnel, utilise auth.uid() par défaut)
 * @returns true si l'utilisateur est admin, false sinon
 */
export const isAdmin = async (userId?: string): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    const uid = userId || session.data.session?.user?.id;

    if (!uid) {
      return false;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', uid)
      .single();

    if (error || !data) {
      console.error('Erreur lors de la vérification du statut admin:', error);
      return false;
    }

    return data.is_admin === true;
  } catch (error) {
    console.error('Erreur lors de la vérification du statut admin:', error);
    return false;
  }
};

/**
 * Récupère le statut admin de l'utilisateur actuel
 * @returns is_admin depuis le profil
 */
export const getAdminStatus = async (): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    const uid = session.data.session?.user?.id;

    if (!uid) {
      return false;
    }

    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', uid)
      .single();

    return data?.is_admin === true || false;
  } catch (error) {
    console.error('Erreur lors de la récupération du statut admin:', error);
    return false;
  }
};

