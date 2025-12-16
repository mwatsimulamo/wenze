/**
 * Libère les fonds de l'escrow au vendeur après confirmation de réception
 */

import { getLucid } from './lucidService';
import { releaseFundsFromEscrow, getEscrowUtxos } from './escrowContract';
import { Lucid } from 'lucid-cardano';

export interface ReleaseResult {
  success: boolean;
  txHash?: string;
  message: string;
  explorerUrl?: string;
}

/**
 * Libère les fonds de l'escrow au vendeur
 * 
 * @param orderId - ID de la commande
 * @param sellerAddress - Adresse du vendeur (destinataire)
 * @param lucidInstance - Instance Lucid optionnelle
 */
export const prepareAdaRelease = async (
  orderId: string,
  sellerAddress?: string,
  lucidInstance?: Lucid | null
): Promise<ReleaseResult> => {
  try {
    const lucid = lucidInstance || getLucid();
    
    // Si l'adresse du vendeur n'est pas fournie, essayer de la récupérer depuis la commande
    if (!sellerAddress) {
      throw new Error('Adresse du vendeur requise pour libérer les fonds');
    }

    // Récupérer l'UTXO de l'escrow pour cette commande
    const escrowUtxos = await getEscrowUtxos(orderId, lucid);
    
    if (escrowUtxos.length === 0) {
      return {
        success: false,
        message: 'Aucun fonds en escrow trouvé pour cette commande. Les fonds ont peut-être déjà été libérés ou l\'escrow n\'existe pas.'
      };
    }

    const escrowUtxo = escrowUtxos[0];
    
    console.log('🔓 Libération des fonds de l\'escrow...');
    console.log('📋 Détails:');
    console.log('   - ID Commande:', orderId);
    console.log('   - Vendeur (destinataire):', sellerAddress);
    console.log('   - Montant:', (Number(escrowUtxo.assets.lovelace) / 1_000_000).toFixed(6), 'ADA');

    // Libérer les fonds
    const txHash = await releaseFundsFromEscrow(escrowUtxo, sellerAddress, lucid);
    
    console.log('✅ Fonds libérés avec succès');
    console.log('📋 Hash de transaction:', txHash);

    // Obtenir l'URL de l'explorateur
    const network = lucid.network === 'Preprod' ? 'testnet' : 'mainnet';
    const explorerUrl = network === 'testnet' 
      ? `https://preprod.cardanoscan.io/transaction/${txHash}`
      : `https://cardanoscan.io/transaction/${txHash}`;

    return {
      success: true,
      txHash,
      message: 'Fonds libérés avec succès',
      explorerUrl
    };

  } catch (error: any) {
    console.error('❌ Erreur lors de la libération des fonds:', error);
    
    // Gérer spécifiquement les erreurs de signature
    if (error.message?.includes('declined') || error.message?.includes('user declined') || error.message?.includes('rejected')) {
      return {
        success: false,
        message: 'Transaction annulée. Vous avez refusé de signer la transaction dans votre wallet.'
      };
    }

    return {
      success: false,
      message: error.message || 'Erreur lors de la libération des fonds'
    };
  }
};



