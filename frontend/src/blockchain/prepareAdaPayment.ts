/**
 * Prépare et exécute une transaction de paiement ADA avec Lucid
 * Utilise le smart contract escrow pour verrouiller les fonds
 */

import { getLucid, adaToLovelace, getExplorerUrl } from './lucidService';
import { lockFundsInEscrow } from './escrowContract';
import { Lucid } from 'lucid-cardano';

export interface PaymentResult {
  txHash: string;
  status: 'success' | 'pending' | 'failed';
  network: 'Preprod Testnet' | 'Mainnet';
  explorerUrl?: string;
  message?: string;
}

/**
 * Prépare et exécute un paiement ADA
 * 
 * @param orderId - ID de la commande (pour référence)
 * @param amountAda - Montant en ADA à envoyer
 * @param sellerAddress - Adresse Cardano du vendeur (Bech32)
 * @param lucidInstance - Instance Lucid optionnelle (depuis le contexte)
 * @returns Résultat de la transaction avec le hash
 */
export const prepareAdaPayment = async (
  orderId: string,
  amountAda: number,
  sellerAddress?: string,
  lucidInstance?: Lucid | null
): Promise<PaymentResult> => {
  try {
    // Essayer de récupérer Lucid depuis l'instance fournie, ou depuis l'instance globale
    let lucid: Lucid | null = lucidInstance || null;
    
    if (!lucid) {
      try {
        lucid = getLucid();
      } catch (lucidError: any) {
        // Si Lucid n'est pas disponible, on ne peut pas faire de transaction réelle
        // On retourne une erreur au lieu d'une simulation pour forcer la configuration
        console.error('❌ Lucid non disponible. Transaction réelle impossible.', lucidError?.message);
        throw new Error('Lucid non disponible. Vérifiez que Blockfrost est configuré (VITE_BLOCKFROST_PROJECT_ID) et que le wallet est connecté.');
      }
    }

    // Si l'adresse du vendeur n'est pas fournie, on ne peut pas créer la transaction réelle
    if (!sellerAddress) {
      throw new Error('Adresse du vendeur requise. Le vendeur doit connecter son wallet Cardano pour recevoir les paiements.');
    }

    // Convertir ADA en Lovelace
    const amountLovelace = adaToLovelace(amountAda);
    
    // Vérifier le solde disponible
    const utxos = await lucid.wallet.getUtxos();
    const balance = utxos.reduce((sum, utxo) => {
      const lovelace = utxo.assets?.lovelace || 0n;
      return sum + lovelace;
    }, 0n);

    // Vérifier que le solde est suffisant (avec marge pour les frais ~0.17 ADA)
    const estimatedFees = 170000n; // ~0.17 ADA en lovelace
    if (balance < amountLovelace + estimatedFees) {
      throw new Error(`Solde insuffisant. Nécessaire: ${(Number(amountLovelace + estimatedFees) / 1_000_000).toFixed(6)} ADA, Disponible: ${(Number(balance) / 1_000_000).toFixed(6)} ADA`);
    }

    // Log des informations de transaction
    console.log('👤 Vendeur (destinataire):', sellerAddress);
    console.log('💰 Montant:', amountAda, 'ADA (', amountLovelace.toString(), 'Lovelace)');
    console.log('💳 Solde disponible:', (Number(balance) / 1_000_000).toFixed(6), 'ADA');

    // Obtenir l'adresse de l'acheteur (wallet connecté)
    const buyerAddress = await lucid.wallet.address();
    if (!buyerAddress) {
      throw new Error('Impossible d\'obtenir l\'adresse du wallet connecté');
    }

    console.log('🔒 Création de la transaction escrow...');
    console.log('📋 Détails de la transaction:');
    console.log('   - Acheteur:', buyerAddress.substring(0, 20) + '...');
    console.log('   - Vendeur:', sellerAddress);
    console.log('   - Montant:', amountAda, 'ADA');
    console.log('   - ID Commande:', orderId);
    
    let txHash: string;
    
    try {
      // Utiliser lockFundsInEscrow pour verrouiller les fonds dans le smart contract
      console.log('⚙️ Préparation de la transaction escrow (calcul des frais, sélection des UTXOs)...');
      
      // Définir le délai (7 jours par défaut)
      const deadline = Date.now() + 7 * 24 * 60 * 60 * 1000;
      
      const escrowResult = await lockFundsInEscrow(
        orderId,
        amountAda,
        buyerAddress,
        sellerAddress,
        deadline,
        lucid
      );
      
      txHash = escrowResult.txHash;
      console.log('✅ Transaction escrow soumise avec succès sur la blockchain');
      console.log('📋 Hash de transaction:', txHash);
      console.log('📍 Adresse escrow:', escrowResult.escrowAddress);
      
    } catch (escrowError: any) {
      // Gérer spécifiquement les erreurs de signature
      if (escrowError.message?.includes('declined') || escrowError.message?.includes('user declined') || escrowError.message?.includes('rejected')) {
        console.error('❌ Transaction refusée par l\'utilisateur dans le wallet');
        throw new Error('Transaction annulée. Vous avez refusé de signer la transaction dans votre wallet. Veuillez approuver la transaction lorsque votre wallet vous le demande.');
      }
      console.error('❌ Erreur lors de la création de la transaction escrow:', escrowError);
      throw escrowError;
    }

    // Déterminer le réseau
    const network = lucid.network === 'Preprod' ? 'Preprod Testnet' : 'Mainnet';

    // Obtenir l'URL de l'explorateur
    const explorerUrl = getExplorerUrl(txHash, lucid.network === 'Preprod' ? 'testnet' : 'mainnet');

    console.log(`✅ Transaction ${network} envoyée avec succès:`, txHash);
    console.log(`🔗 Explorateur: ${explorerUrl}`);
    console.log(`💰 Montant: ${amountAda} ADA vers ${sellerAddress.substring(0, 20)}...`);

    return {
      txHash,
      status: 'success',
      network,
      explorerUrl,
      message: `Transaction ${network} envoyée avec succès`
    };

  } catch (error: any) {
    console.error('❌ Erreur lors de la création de la transaction:', error);
    
    // Déterminer le réseau depuis Lucid (si disponible)
    let network: 'Preprod Testnet' | 'Mainnet' = 'Preprod Testnet';
    try {
      const lucid = getLucid();
      network = lucid.network === 'Preprod' ? 'Preprod Testnet' : 'Mainnet';
    } catch {
      // Lucid non disponible
    }

    // Gérer spécifiquement le cas où l'utilisateur refuse de signer
    let errorMessage = error.message || 'Erreur lors de la création de la transaction';
    if (error.message?.includes('declined') || error.message?.includes('user declined') || error.message?.includes('rejected')) {
      errorMessage = 'Transaction annulée. Vous avez refusé de signer la transaction dans votre wallet.';
    } else if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
      errorMessage = 'Solde insuffisant. Vérifiez que vous avez assez d\'ADA dans votre wallet pour couvrir le montant et les frais de transaction.';
    }

    return {
      txHash: '',
      status: 'failed',
      network,
      message: errorMessage
    };
  }
};
