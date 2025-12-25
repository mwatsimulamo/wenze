/**
 * Fonction pour envoyer des récompenses ADA aux utilisateurs
 * Utilise Lucid pour créer et signer des transactions
 */

import { Lucid, toUnit } from 'lucid-cardano';
import { getLucid } from './lucidService';

/**
 * Convertit un montant ADA en Lovelace
 */
export const adaToLovelace = (ada: number): bigint => {
  return BigInt(Math.floor(ada * 1_000_000));
};

/**
 * Envoie une récompense ADA à une adresse Cardano
 * @param recipientAddress - Adresse Cardano du destinataire (format Bech32)
 * @param amountAda - Montant en ADA à envoyer
 * @param lucidInstance - Instance Lucid optionnelle (si non fournie, utilise getLucid())
 * @returns Hash de la transaction
 */
export const sendRewardPayment = async (
  recipientAddress: string,
  amountAda: number,
  lucidInstance?: Lucid | null
): Promise<{ txHash: string; success: boolean; error?: string }> => {
  try {
    const lucid = lucidInstance || getLucid();
    
    if (!lucid) {
      throw new Error('Lucid n\'est pas initialisé. Veuillez connecter votre wallet.');
    }

    if (!lucid.wallet) {
      throw new Error('Aucun wallet connecté dans Lucid.');
    }

    // Valider l'adresse
    if (!recipientAddress || (!recipientAddress.startsWith('addr') && !recipientAddress.startsWith('addr_test'))) {
      throw new Error('Adresse Cardano invalide. L\'adresse doit commencer par "addr" ou "addr_test".');
    }

    // Valider le montant
    if (amountAda <= 0) {
      throw new Error('Le montant doit être supérieur à zéro.');
    }

    const amountLovelace = adaToLovelace(amountAda);

    console.log(`💸 Envoi de ${amountAda} ADA (${amountLovelace.toString()} Lovelace) à ${recipientAddress}`);

    // Construire la transaction
    const tx = await lucid
      .newTx()
      .payToAddress(recipientAddress, { lovelace: amountLovelace })
      .complete();

    console.log('✅ Transaction construite, signature en cours...');

    // Signer la transaction
    const signedTx = await tx.sign().complete();
    
    console.log('✅ Transaction signée, soumission au réseau...');

    // Soumettre la transaction
    const txHash = await signedTx.submit();
    
    console.log(`✅ Transaction soumise avec succès: ${txHash}`);

    return {
      txHash,
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de la récompense:', error);
    return {
      txHash: '',
      success: false,
      error: error.message || 'Erreur lors de l\'envoi de la récompense',
    };
  }
};

/**
 * Envoie plusieurs récompenses en une seule transaction (batching)
 * @param payments - Liste des paiements à effectuer
 * @param lucidInstance - Instance Lucid optionnelle
 * @returns Hash de la transaction
 */
export const sendBulkRewardPayments = async (
  payments: Array<{ address: string; amountAda: number }>,
  lucidInstance?: Lucid | null
): Promise<{ txHash: string; success: boolean; error?: string; failedPayments?: number }> => {
  try {
    const lucid = lucidInstance || getLucid();
    
    if (!lucid) {
      throw new Error('Lucid n\'est pas initialisé. Veuillez connecter votre wallet.');
    }

    if (!lucid.wallet) {
      throw new Error('Aucun wallet connecté dans Lucid.');
    }

    if (payments.length === 0) {
      throw new Error('Aucun paiement à effectuer.');
    }

    // Valider tous les paiements
    for (const payment of payments) {
      if (!payment.address || (!payment.address.startsWith('addr') && !payment.address.startsWith('addr_test'))) {
        throw new Error(`Adresse invalide: ${payment.address}`);
      }
      if (payment.amountAda <= 0) {
        throw new Error(`Montant invalide pour l'adresse ${payment.address}: ${payment.amountAda}`);
      }
    }

    console.log(`💸 Envoi en batch de ${payments.length} récompenses...`);

    // Calculer le total
    const totalAda = payments.reduce((sum, p) => sum + p.amountAda, 0);
    console.log(`💰 Total à envoyer: ${totalAda} ADA`);

    // Construire la transaction avec tous les paiements
    let tx = lucid.newTx();
    
    for (const payment of payments) {
      const amountLovelace = adaToLovelace(payment.amountAda);
      tx = tx.payToAddress(payment.address, { lovelace: amountLovelace });
    }

    const completedTx = await tx.complete();

    console.log('✅ Transaction batch construite, signature en cours...');

    // Signer la transaction
    const signedTx = await completedTx.sign().complete();
    
    console.log('✅ Transaction batch signée, soumission au réseau...');

    // Soumettre la transaction
    const txHash = await signedTx.submit();
    
    console.log(`✅ Transaction batch soumise avec succès: ${txHash}`);

    return {
      txHash,
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi en batch:', error);
    return {
      txHash: '',
      success: false,
      error: error.message || 'Erreur lors de l\'envoi en batch',
    };
  }
};

