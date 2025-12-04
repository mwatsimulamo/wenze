/**
 * Prépare et exécute une transaction de paiement ADA avec Lucid
 * Pour le moment : transaction simple (sans smart contract)
 * Plus tard : intégration avec smart contract escrow
 */

import { getLucid, adaToLovelace, getExplorerUrl } from './lucidService';
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

    // Créer une transaction SIMPLE : juste envoyer de l'ADA du wallet connecté au vendeur
    // Pas d'escrow, pas de smart contract, juste un transfert direct
    console.log('🔨 Création de la transaction simple (sans escrow)...');
    console.log('📋 Détails de la transaction:');
    console.log('   - De: Wallet connecté');
    console.log('   - Vers:', sellerAddress);
    console.log('   - Montant:', amountAda, 'ADA');
    
    let txHash: string;
    
    try {
      // Construire la transaction de manière simple
      const tx = lucid
        .newTx()
        .payToAddress(sellerAddress, { lovelace: amountLovelace });
      
      // Compléter la transaction (calcule les frais, sélectionne les UTXOs, etc.)
      console.log('⚙️ Préparation de la transaction (calcul des frais, sélection des UTXOs)...');
      const completedTx = await tx.complete();
      
      // Afficher les informations de la transaction complétée
      console.log('📄 Transaction préparée. Détails:');
      console.log('   - Frais estimés:', completedTx.fee ? (Number(completedTx.fee) / 1_000_000).toFixed(6) + ' ADA' : 'calcul en cours...');
      
      // Signer la transaction (le wallet demandera confirmation à l'utilisateur)
      console.log('📝 Signature de la transaction en cours...');
      console.log('⚠️ IMPORTANT: Votre wallet va ouvrir une popup. Veuillez:');
      console.log('   1. Vérifier le montant et le destinataire');
      console.log('   2. Cliquer sur "Approuver" ou "Sign" dans votre wallet');
      console.log('   3. NE PAS cliquer sur "Annuler" ou "Reject"');
      
      const signedTx = await completedTx.sign().complete();
      console.log('✅ Transaction signée par le wallet');

      // Envoyer la transaction
      console.log('📤 Envoi de la transaction sur la blockchain Preprod...');
      txHash = await signedTx.submit();
      console.log('✅ Transaction soumise avec succès sur la blockchain');
      console.log('📋 Hash de transaction:', txHash);
      
      // Attendre un peu pour que la transaction soit propagée
      console.log('⏳ Attente de la propagation de la transaction...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (signError: any) {
      // Gérer spécifiquement les erreurs de signature
      if (signError.message?.includes('declined') || signError.message?.includes('user declined') || signError.message?.includes('rejected')) {
        console.error('❌ Transaction refusée par l\'utilisateur dans le wallet');
        throw new Error('Transaction annulée. Vous avez refusé de signer la transaction dans votre wallet. Veuillez approuver la transaction lorsque votre wallet vous le demande.');
      }
      throw signError;
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
