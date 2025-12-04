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
        // Lucid n'est pas disponible - retourner une simulation
        console.warn('⚠️ Lucid non disponible. Transaction simulée.', lucidError?.message);
        console.info('💡 Vérifiez que :');
        console.info('   1. Blockfrost est configuré dans .env (VITE_BLOCKFROST_PROJECT_ID)');
        console.info('   2. Le wallet est connecté');
        console.info('   3. Le serveur a été redémarré après la configuration de .env');
        return {
          txHash: `simulated_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          status: 'pending',
          network: 'Preprod Testnet',
          message: 'Transaction simulée - Lucid non disponible. Vérifiez la configuration Blockfrost et la connexion du wallet.'
        };
      }
    }

    // Si l'adresse du vendeur n'est pas fournie, on ne peut pas créer la transaction
    // Pour le moment, on retourne une simulation
    if (!sellerAddress) {
      console.warn('⚠️ Adresse du vendeur non fournie. Transaction simulée.');
      return {
        txHash: `simulated_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        status: 'pending',
        network: 'Preprod Testnet',
        message: 'Transaction simulée - Adresse vendeur requise'
      };
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

    // Créer la transaction
    const tx = await lucid
      .newTx()
      .payToAddress(sellerAddress, { lovelace: amountLovelace })
      .complete();

    // Signer la transaction
    const signedTx = await tx.sign().complete();

    // Envoyer la transaction
    const txHash = await signedTx.submit();

    console.log('✅ Transaction envoyée avec succès:', txHash);

    // Déterminer le réseau
    const network = lucid.network === 'Preprod' ? 'Preprod Testnet' : 'Mainnet';

    // Obtenir l'URL de l'explorateur
    const explorerUrl = getExplorerUrl(txHash, lucid.network === 'Preprod' ? 'testnet' : 'mainnet');

    return {
      txHash,
      status: 'success',
      network,
      explorerUrl,
      message: 'Transaction envoyée avec succès'
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

    return {
      txHash: '',
      status: 'failed',
      network,
      message: error.message || 'Erreur lors de la création de la transaction'
    };
  }
};
