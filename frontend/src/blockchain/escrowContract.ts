/**
 * Smart Contract Escrow pour WENZE
 * 
 * Ce contrat permet de :
 * 1. Verrouiller les fonds d'une transaction
 * 2. Libérer les fonds au vendeur après confirmation de l'acheteur
 * 3. Récupérer les fonds si le délai expire (timeout)
 * 
 * Le contrat est écrit en Aiken (voir contracts/escrow/escrow.ak)
 * et compilé en Plutus pour être utilisé avec Lucid
 */

import { Lucid, Data, fromText, applyParamsToScript, UTxO } from 'lucid-cardano';
import { adaToLovelace, getLucid } from './lucidService';

/**
 * Datum du contrat escrow (correspond à EscrowDatum dans escrow.ak)
 */
export const EscrowDatum = Data.Object({
  order_id: Data.Bytes,
  buyer: Data.Bytes, // VerificationKeyHash
  seller: Data.Bytes, // VerificationKeyHash
  amount: Data.Integer,
  deadline: Data.Integer,
});

/**
 * Redeemer pour interagir avec le contrat (correspond à EscrowRedeemer dans escrow.ak)
 */
export const EscrowRedeemer = Data.Enum([
  Data.Object({ release: Data.Literal("release") }),
  Data.Object({ cancel: Data.Literal("cancel") }),
]);

/**
 * Charge le script validateur compilé depuis le fichier
 * Le contrat doit être compilé avec: cd contracts/escrow && aiken build
 */
export const loadEscrowValidator = async (): Promise<string> => {
  try {
    // En production, charger depuis le fichier compilé
    // const response = await fetch(ESCROW_CONTRACT_PATH);
    // const script = await response.text();
    // return script;
    
    // Pour l'instant, retourner un placeholder
    // TODO: Charger le script compilé réel une fois le contrat déployé
    throw new Error('Contrat escrow non encore compilé. Exécutez: cd contracts/escrow && aiken build');
  } catch (error) {
    console.error('Erreur lors du chargement du validateur:', error);
    throw error;
  }
};

/**
 * Obtient l'adresse du script validateur
 */
export const getEscrowAddress = async (lucid: Lucid, validator: string): Promise<string> => {
  return lucid.utils.validatorToAddress(validator);
};

/**
 * Crée une transaction pour verrouiller les fonds en escrow
 * 
 * @param orderId - ID de la commande
 * @param amountAda - Montant en ADA
 * @param buyerAddress - Adresse de l'acheteur (pour obtenir la clé de vérification)
 * @param sellerAddress - Adresse du vendeur (pour obtenir la clé de vérification)
 * @param deadline - Timestamp Unix en millisecondes (délai d'expiration)
 * @param lucidInstance - Instance Lucid optionnelle
 */
export const lockFundsInEscrow = async (
  orderId: string,
  amountAda: number,
  buyerAddress: string,
  sellerAddress: string,
  deadline: number = Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 jours par défaut
  lucidInstance?: Lucid | null
): Promise<{ txHash: string; escrowAddress: string; escrowUtxo: UTxO }> => {
  const lucid = lucidInstance || getLucid();
  const amountLovelace = adaToLovelace(amountAda);
  
  // Charger le validateur
  const validator = await loadEscrowValidator();
  
  // Obtenir l'adresse du contrat
  const escrowAddress = await getEscrowAddress(lucid, validator);
  
  // Obtenir les clés de vérification de l'acheteur et du vendeur
  const buyerVKeyHash = lucid.utils.getAddressDetails(buyerAddress).paymentCredential?.hash;
  const sellerVKeyHash = lucid.utils.getAddressDetails(sellerAddress).paymentCredential?.hash;
  
  if (!buyerVKeyHash || !sellerVKeyHash) {
    throw new Error('Impossible d\'obtenir les clés de vérification des adresses');
  }
  
  // Créer le datum
  const datum = Data.to({
    order_id: fromText(orderId),
    buyer: buyerVKeyHash,
    seller: sellerVKeyHash,
    amount: BigInt(amountLovelace),
    deadline: BigInt(deadline),
  }, EscrowDatum);
  
  // Créer la transaction pour envoyer les fonds au contrat
  const tx = await lucid
    .newTx()
    .payToContract(escrowAddress, { inline: datum }, { lovelace: amountLovelace })
    .complete();
  
  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  
  // Attendre que la transaction soit confirmée pour obtenir l'UTXO
  await lucid.awaitTx(txHash);
  
  // Récupérer l'UTXO de l'escrow
  const utxos = await lucid.utxosAt(escrowAddress);
  const escrowUtxo = utxos.find(utxo => 
    utxo.datum === datum && 
    utxo.assets.lovelace === amountLovelace
  );
  
  if (!escrowUtxo) {
    throw new Error('UTXO de l\'escrow non trouvé après la transaction');
  }
  
  return {
    txHash,
    escrowAddress,
    escrowUtxo,
  };
};

/**
 * Libère les fonds de l'escrow au vendeur
 * Doit être signé par l'acheteur
 * 
 * @param escrowUtxo - UTXO de l'escrow
 * @param sellerAddress - Adresse du vendeur (destinataire)
 * @param lucidInstance - Instance Lucid optionnelle
 */
export const releaseFundsFromEscrow = async (
  escrowUtxo: UTxO,
  sellerAddress: string,
  lucidInstance?: Lucid | null
): Promise<string> => {
  const lucid = lucidInstance || getLucid();
  
  // Créer le redeemer "release"
  const redeemer = Data.to({ release: "release" }, EscrowRedeemer);
  
  // Créer la transaction pour libérer les fonds
  const tx = await lucid
    .newTx()
    .collectFrom([escrowUtxo], redeemer)
    .payToAddress(sellerAddress, escrowUtxo.assets)
    .attachSpendingValidator(await loadEscrowValidator())
    .complete();
  
  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  
  return txHash;
};

/**
 * Annule l'escrow et récupère les fonds (si le délai est expiré)
 * 
 * @param escrowUtxo - UTXO de l'escrow
 * @param buyerAddress - Adresse de l'acheteur (destinataire du remboursement)
 * @param lucidInstance - Instance Lucid optionnelle
 */
export const cancelEscrow = async (
  escrowUtxo: UTxO,
  buyerAddress: string,
  lucidInstance?: Lucid | null
): Promise<string> => {
  const lucid = lucidInstance || getLucid();
  
  // Créer le redeemer "cancel"
  const redeemer = Data.to({ cancel: "cancel" }, EscrowRedeemer);
  
  // Créer la transaction pour annuler et récupérer les fonds
  const tx = await lucid
    .newTx()
    .collectFrom([escrowUtxo], redeemer)
    .payToAddress(buyerAddress, escrowUtxo.assets)
    .attachSpendingValidator(await loadEscrowValidator())
    .complete();
  
  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  
  return txHash;
};

/**
 * Récupère tous les UTXOs de l'escrow pour une commande donnée
 */
export const getEscrowUtxos = async (
  orderId: string,
  lucidInstance?: Lucid | null
): Promise<UTxO[]> => {
  const lucid = lucidInstance || getLucid();
  const validator = await loadEscrowValidator();
  const escrowAddress = await getEscrowAddress(lucid, validator);
  
  const utxos = await lucid.utxosAt(escrowAddress);
  
  // Filtrer les UTXOs qui correspondent à cette commande
  return utxos.filter(utxo => {
    if (!utxo.datum) return false;
    try {
      const datum = Data.from(utxo.datum, EscrowDatum);
      const orderIdBytes = fromText(orderId);
      return datum.order_id === orderIdBytes;
    } catch {
      return false;
    }
  });
};
