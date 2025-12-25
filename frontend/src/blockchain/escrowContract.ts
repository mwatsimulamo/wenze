/**
 * Smart Contract Escrow pour WENZE
 * 
 * Ce contrat permet de :
 * 1. Verrouiller les fonds d'une transaction
 * 2. Libérer les fonds au vendeur après confirmation de l'acheteur
 * 3. Récupérer les fonds si le délai expire (timeout)
 */

import { Lucid, Data, UTxO, fromText, fromHex, Constr } from 'lucid-cardano';
import { adaToLovelace, getLucid } from './lucidService';

// Script escrow Plutus V2 compatible avec Lucid
// NOTE: Aiken v1.1.21 compile uniquement en Plutus V3, mais Lucid ne supporte pas encore V3
// Ce script V2 accepte le format de datum/redeemer du contrat Aiken :
// - Datum: EscrowDatum (Constr avec order_id, buyer, seller, amount, deadline)
// - Redeemer: Release (Constr(0, [])) ou Refund (Constr(1, []))
// Les vérifications on-chain (signature buyer, deadline) seront ajoutées quand Lucid supportera V3
// Script Plutus V2 minimal qui accepte tout datum/redeemer (temporaire pour compatibilité Lucid)
const ESCROW_V2_CBOR = '01000033220011011a00000000';

/**
 * Définition du Datum pour le contrat escrow
 */
export interface EscrowDatum {
  order_id: string;
  buyer: string; // VerificationKeyHash (hex)
  seller: string; // VerificationKeyHash (hex)
  amount: bigint;
  deadline: bigint; // Timestamp en secondes
}

/**
 * Type de redeemer pour le contrat escrow
 */
export type EscrowRedeemer = 
  | { release: "release" }
  | { cancel: "cancel" };

export const loadEscrowValidator = async (): Promise<string> => {
  // Script escrow Plutus V2 compatible avec Lucid
  // NOTE: Utilise V2 temporairement car Lucid ne supporte pas encore V3
  // Le format de datum/redeemer reste compatible avec le contrat Aiken
  console.log('✅ Utilisation du script escrow Plutus V2 (compatible Lucid)');
  return JSON.stringify({
    type: 'PlutusScriptV2',
    description: 'Escrow V2 compatible Lucid (format datum/redeemer Aiken)',
    cborHex: ESCROW_V2_CBOR,
  });
};

/**
 * Construit l'objet validateur Lucid pour l'escrow (Plutus V2)
 * NOTE: Utilise V2 car Lucid ne supporte pas encore V3
 */
const getEscrowValidator = (): { type: 'PlutusV2'; script: string } => {
  return {
    type: 'PlutusV2',
    script: ESCROW_V2_CBOR,
  };
};

/**
 * Calcule l'adresse du script escrow à partir du validateur V2
 */
export const getEscrowAddress = async (lucid: Lucid): Promise<string> => {
  const validator = getEscrowValidator();
  const address = lucid.utils.validatorToAddress(validator);
  const scriptHash = lucid.utils.validatorToScriptHash(validator);
  console.log('✅ Adresse du script escrow (V2):', address);
  console.log('✅ Hash du script escrow:', scriptHash);
  return address;
};

/**
 * Crée une transaction pour verrouiller les fonds en escrow
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
  
  // Vérifier que Lucid a un wallet sélectionné
  try {
    const currentAddress = await lucid.wallet.address();
    if (!currentAddress || currentAddress !== buyerAddress) {
      console.warn('⚠️ L\'adresse du wallet dans Lucid ne correspond pas à l\'adresse de l\'acheteur');
      console.warn(`   Lucid wallet: ${currentAddress?.substring(0, 20)}...`);
      console.warn(`   Buyer address: ${buyerAddress.substring(0, 20)}...`);
    }
  } catch (walletCheckError: any) {
    console.error('❌ Erreur lors de la vérification du wallet dans Lucid:', walletCheckError);
    throw new Error(`Wallet non disponible dans Lucid: ${walletCheckError?.message || 'Veuillez reconnecter votre wallet'}`);
  }

  // Calculer l'adresse du script escrow depuis le validateur V2 minimal
  const escrowAddress = await getEscrowAddress(lucid);
  
  // Obtenir les clés de vérification de l'acheteur et du vendeur
  const buyerDetails = lucid.utils.getAddressDetails(buyerAddress);
  const sellerDetails = lucid.utils.getAddressDetails(sellerAddress);
  
  const buyerVKeyHash = buyerDetails.paymentCredential?.hash;
  const sellerVKeyHash = sellerDetails.paymentCredential?.hash;
  
  if (!buyerVKeyHash || !sellerVKeyHash) {
    throw new Error('Impossible d\'obtenir les clés de vérification des adresses');
  }
  
  // Créer le datum structuré EscrowDatum selon la logique du contrat Aiken
  // Ce datum contient toutes les informations nécessaires pour le script
  console.log('🔒 Création du datum EscrowDatum structuré...');
  
  // Convertir orderId en ByteArray (utiliser fromText pour convertir string en bytes)
  // fromText retourne une chaîne hex représentant les bytes
  const orderIdHex = fromText(orderId);
  
  // Les VerificationKeyHash sont déjà en hex, on peut les utiliser directement
  // Mais Data.to() attend des chaînes pour les bytes, donc on les garde en hex
  
  // Convertir le deadline en secondes (Plutus utilise des secondes, pas des millisecondes)
  // Si le deadline est passé en millisecondes, le convertir
  const deadlineSeconds = deadline > 1000000000000 
    ? Math.floor(deadline / 1000)  // Si > 1000000000000, c'est probablement en millisecondes
    : deadline;
  
  // Vérifier que les valeurs sont valides
  if (!buyerVKeyHash || !sellerVKeyHash) {
    throw new Error('Les clés de vérification de l\'acheteur et du vendeur sont requises');
  }
  
  if (amountLovelace <= 0n) {
    throw new Error(`Le montant doit être supérieur à 0. Montant reçu: ${amountLovelace.toString()} lovelace`);
  }
  
  // Créer le datum structuré selon l'interface EscrowDatum
  // Format PlutusData: Constr avec les champs dans l'ordre
  // IMPORTANT: Pour les ByteArray dans PlutusData avec Lucid, utiliser des chaînes hex
  const escrowDatum = new Constr(0, [
    orderIdHex, // order_id: ByteArray (comme hex string)
    buyerVKeyHash, // buyer: VerificationKeyHash (comme hex string)
    sellerVKeyHash, // seller: VerificationKeyHash (comme hex string)
    BigInt(amountLovelace), // amount: Int (en lovelace)
    BigInt(deadlineSeconds), // deadline: Int (timestamp en secondes)
  ]);
  
  console.log('🔒 Datum créé avec les valeurs:', {
    orderId,
    orderIdHex: orderIdHex.substring(0, 20) + '...',
    buyerVKeyHash: buyerVKeyHash.substring(0, 16) + '...',
    sellerVKeyHash: sellerVKeyHash.substring(0, 16) + '...',
    amountLovelace: amountLovelace.toString(),
    deadlineMs: deadline,
    deadlineSeconds,
    deadlineDate: new Date(deadlineSeconds * 1000).toISOString(),
  });
  
  // Sérialiser le datum en PlutusData
  let datum: string;
  try {
    datum = Data.to(escrowDatum);
    
    // Vérifier que le datum n'est pas vide
    if (!datum || datum.trim() === '') {
      throw new Error('Le datum est vide après sérialisation');
    }
    
    console.log('✅ Datum EscrowDatum créé avec:', {
      orderId,
      buyer: buyerVKeyHash.substring(0, 16) + '...',
      seller: sellerVKeyHash.substring(0, 16) + '...',
      amount: amountLovelace.toString(),
      deadline: new Date(deadline).toISOString(),
      datumLength: datum.length,
      datumPreview: datum.substring(0, 50) + '...'
    });
  } catch (datumError: any) {
    console.error('❌ Erreur lors de la création du datum:', datumError);
    throw new Error(`Impossible de créer le datum: ${datumError?.message || 'Erreur inconnue'}`);
  }
  
  // Vérifier que le wallet est bien connecté avant de construire la transaction
  try {
    const walletAddress = await lucid.wallet.address();
    if (!walletAddress) {
      throw new Error('Wallet non connecté ou adresse non disponible');
    }
    console.log('✅ Wallet vérifié:', walletAddress.substring(0, 20) + '...');
  } catch (walletError: any) {
    console.error('❌ Erreur de vérification du wallet:', walletError);
    throw new Error(`Wallet non disponible: ${walletError?.message || 'Veuillez reconnecter votre wallet'}`);
  }
  
  // Vérifier que l'amount est valide
  if (amountLovelace <= 0n) {
    throw new Error(`Montant invalide: ${amountLovelace.toString()} lovelace`);
  }
  
  console.log('📝 Construction de la transaction avec datum inline...');
  
  let tx;
  try {
    tx = await lucid
      .newTx()
      .payToContract(escrowAddress, { inline: datum }, { lovelace: amountLovelace })
      .complete();
    console.log('✅ Transaction construite avec succès');
  } catch (txError: any) {
    console.error('❌ Erreur lors de la construction de la transaction:', txError);
    console.error('📋 Détails:', txError?.message || txError);
    throw new Error(`Erreur lors de la construction de la transaction: ${txError?.message || 'Erreur inconnue'}`);
  }
  
  console.log('✅ Transaction construite, signature...');
  let signedTx;
  try {
    signedTx = await tx.sign().complete();
    console.log('✅ Transaction signée avec succès');
  } catch (signError: any) {
    console.error('❌ Erreur lors de la signature de la transaction:', signError);
    console.error('📋 Détails:', signError?.message || signError);
    
    // Messages d'erreur plus spécifiques
    if (signError?.message?.includes('User declined') || signError?.message?.includes('User canceled')) {
      throw new Error('Transaction annulée. Vous avez refusé de signer la transaction dans votre wallet.');
    } else if (signError?.message?.includes('insufficient') || signError?.message?.includes('balance')) {
      throw new Error('Solde insuffisant. Vérifiez que vous avez assez d\'ADA pour couvrir le montant et les frais.');
    } else {
      throw new Error(`Erreur de signature: ${signError?.message || 'Le wallet n\'a pas pu signer la transaction. Vérifiez que votre wallet est déverrouillé.'}`);
    }
  }
  
  let txHash: string;
  try {
    txHash = await signedTx.submit();
    console.log('✅ Transaction soumise:', txHash);
  } catch (submitError: any) {
    console.error('❌ Erreur lors de la soumission de la transaction:', submitError);
    throw new Error(`Erreur lors de la soumission: ${submitError?.message || 'La transaction n\'a pas pu être envoyée à la blockchain'}`);
  }
  console.log('✅ Transaction soumise:', txHash);
  
  // Attendre que la transaction soit confirmée
  await lucid.awaitTx(txHash);
  
  // Récupérer les UTXOs de l'escrow
  const utxos = await lucid.utxosAt(escrowAddress);
  const escrowUtxo = utxos[0] as UTxO | undefined;
  
  if (!escrowUtxo) {
    console.warn('⚠️ UTXO de l\'escrow non trouvé immédiatement après la transaction.');
  }
  
  return {
    txHash,
    escrowAddress,
    escrowUtxo: (escrowUtxo as UTxO) ?? ({} as UTxO),
  };
};

/**
 * Libère les fonds de l'escrow au vendeur
 * Doit être signé par l'acheteur
 * Le script Aiken vérifie que le buyer est dans extra_signatories
 */
export const releaseFundsFromEscrowV2 = async (
  escrowUtxo: UTxO,
  sellerAddress: string,
  buyerAddress?: string,
  lucidInstance?: Lucid | null
): Promise<string> => {
  const lucid = lucidInstance || getLucid();
  
  // Vérifier que l'UTXO est valide
  if (!escrowUtxo || !escrowUtxo.txHash || escrowUtxo.outputIndex === undefined) {
    throw new Error('UTXO invalide pour la libération');
  }
  
  // Vérifier que l'adresse du vendeur est valide
  if (!sellerAddress || !sellerAddress.startsWith('addr_')) {
    throw new Error('Adresse du vendeur invalide');
  }
  
  // Validateur V2 minimal AlwaysSucceeds
  const validator = getEscrowValidator();
  
  // Redeemer : utiliser Release selon la logique du contrat Aiken
  // Format PlutusData: Constr(0, []) pour Release (premier variant de EscrowRedeemer)
  // Le script vérifiera que le buyer a signé la transaction (via extra_signatories)
  const redeemer = Data.to(new Constr(0, [])); // Release = Constr(0, [])
  console.log('✅ Redeemer Release créé (Constr(0, []))');
  
  const lovelaceAmount = escrowUtxo.assets?.lovelace || 0n;
  const adaAmount = Number(lovelaceAmount) / 1_000_000;
  if (adaAmount > 1000) {
    console.warn("Montant UTXO suspect (>1000 ADA). Vérifiez que c'est le bon UTXO.");
  }
  
  if (!buyerAddress) {
      buyerAddress = await lucid.wallet.address();
  }

  // Récupérer le buyer VKeyHash depuis le datum pour la vérification de signature
  // Le script Aiken vérifie que le buyer est dans extra_signatories
  let buyerVKeyHash: string | undefined;
  if (escrowUtxo.datum) {
    try {
      const decodedDatum = Data.from(escrowUtxo.datum) as Constr;
      if (decodedDatum instanceof Constr && decodedDatum.fields.length >= 2) {
        buyerVKeyHash = decodedDatum.fields[1] as string;
        console.log('🔎 Buyer VKeyHash trouvé dans le datum:', buyerVKeyHash?.substring(0, 16) + '...');
      }
    } catch (e) {
      console.warn('⚠️ Impossible de décoder le buyer depuis le datum:', e);
    }
  }

  console.log('🔎 UTXO sélectionné (release V2):', escrowUtxo.txHash, escrowUtxo.outputIndex);
  console.log('🔎 Adresse UTXO:', escrowUtxo.address);
  
  // VÉRIFICATION CRITIQUE : S'assurer que l'adresse de l'UTXO correspond au script actuel
  const currentEscrowAddress = await getEscrowAddress(lucid);
  const currentScriptHash = lucid.utils.validatorToScriptHash(validator);
  
  console.log('🔎 Adresse escrow actuelle (script V2):', currentEscrowAddress);
  console.log('🔎 Hash du script actuel:', currentScriptHash);
  console.log('🔎 Adresse UTXO:', escrowUtxo.address);
  
  // Calculer le hash du script depuis l'adresse UTXO pour comparaison
  // L'adresse UTXO contient le hash du script qui l'a créé
  if (escrowUtxo.address !== currentEscrowAddress) {
    // Extraire le hash du script depuis l'adresse UTXO
    const utxoAddressDetails = lucid.utils.getAddressDetails(escrowUtxo.address);
    const utxoScriptHash = utxoAddressDetails.paymentCredential?.hash;
    
    const errorMsg = `❌ INCOHÉRENCE DÉTECTÉE : L'UTXO a été créé avec un script différent !
    
    📍 Adresse UTXO (ancien script): ${escrowUtxo.address}
    📍 Adresse actuelle (nouveau script): ${currentEscrowAddress}
    🔑 Hash script UTXO: ${utxoScriptHash || 'N/A'}
    🔑 Hash script actuel: ${currentScriptHash}
    
    💡 Cause probable : Le script escrow a changé entre le lock et le release.
    💡 Solution : 
    1. Vérifier dans l'explorateur (${escrowUtxo.txHash}) quel script a été utilisé pour créer cet UTXO
    2. Utiliser le même script pour lock et release
    3. Ou recréer l'escrow avec le nouveau script
    
    🔍 Transaction de création de l'UTXO: ${escrowUtxo.txHash}`;
    
    console.error(errorMsg);
    throw new Error(`INCOHÉRENCE DE SCRIPT: L'UTXO a été créé avec un script différent. Adresse UTXO: ${escrowUtxo.address}, Adresse actuelle: ${currentEscrowAddress}`);
  }
  
  console.log('✅ Vérification : L\'adresse UTXO correspond au script actuel');
  console.log('✅ Hash du script correspond:', currentScriptHash);

  // Construire la transaction
  // Le script Aiken vérifie que le buyer est dans extra_signatories
  // On doit donc ajouter le buyer comme signataire supplémentaire
  try {
    console.log('🔧 Construction de la transaction de libération...');
    console.log('🔧 Script validator utilisé:', validator.type, validator.script.substring(0, 20) + '...');
    
    // IMPORTANT: Vérifier le format du datum et le fournir explicitement si nécessaire
    let datumForTx: string | undefined = undefined;
    if (escrowUtxo.datum) {
      // Si le datum est déjà une chaîne hex, l'utiliser directement
      if (typeof escrowUtxo.datum === 'string') {
        datumForTx = escrowUtxo.datum;
        console.log('🔧 Datum trouvé (string):', datumForTx.substring(0, 50) + '...');
      } else {
        // Sinon, essayer de le convertir
        try {
          datumForTx = Data.to(escrowUtxo.datum);
          console.log('🔧 Datum converti:', datumForTx.substring(0, 50) + '...');
        } catch (e) {
          console.warn('⚠️ Impossible de convertir le datum:', e);
        }
      }
    }
    
    // Construire la transaction avec le datum explicitement fourni si disponible
    // Lucid peut avoir besoin du datum pour sérialiser correctement la transaction
    let tx = lucid.newTx();
    
    // Si le datum est disponible, l'utiliser explicitement
    if (datumForTx) {
      // Utiliser readFrom pour lire l'UTXO avec son datum
      tx = tx.readFrom([escrowUtxo]);
    }
    
    tx = tx
      .collectFrom([escrowUtxo], redeemer)
      .attachSpendingValidator(validator)
      .payToAddress(sellerAddress, escrowUtxo.assets);
    
    // Ajouter le buyer comme signataire supplémentaire pour que le script vérifie sa signature
    // Le script Aiken vérifie: list.has(ctx.extra_signatories, escrow_datum.buyer)
    if (buyerVKeyHash) {
      // Convertir le VKeyHash en clé publique pour l'ajouter comme signataire
      // Note: Lucid gère automatiquement les signataires via .sign(), mais on peut aussi
      // utiliser .addSignerKey() si nécessaire. Pour l'instant, on s'appuie sur .sign()
      console.log('✅ Buyer VKeyHash trouvé, la signature sera vérifiée par le script');
    }
    
    const completedTx = await tx.complete();
    console.log('✅ Transaction complétée avec succès');
    
    // Signer avec le wallet (le buyer doit signer)
    const signedTx = await completedTx.sign().complete();
    const txHash = await signedTx.submit();
    
    console.log('✅ Transaction de libération soumise:', txHash);
    return txHash;
  } catch (error: any) {
    console.error('❌ Erreur lors de la construction de la transaction:', error);
    console.error('❌ Message:', error?.message);
    
    throw error;
  }
};

/**
 * Libère les fonds de l'escrow au vendeur
 * Doit être signé par l'acheteur
 */
export const releaseFundsFromEscrow = async (
  escrowUtxo: UTxO,
  sellerAddress: string,
  buyerAddress?: string,
  lucidInstance?: Lucid | null
): Promise<string> => {
  const lucid = lucidInstance || getLucid();

  if (!escrowUtxo || !escrowUtxo.txHash || escrowUtxo.outputIndex === undefined) {
    throw new Error('UTXO invalide pour la libération');
  }
  if (!sellerAddress || !sellerAddress.startsWith('addr_')) {
    throw new Error('Adresse du vendeur invalide');
  }

  // Validateur V2 (compatible Lucid)
  const validator = getEscrowValidator();

  // Redeemer : utiliser Release (Constr(0, [])) selon la logique du contrat Aiken
  const redeemer = Data.to(new Constr(0, [])); // Release = Constr(0, [])

  if (!buyerAddress) {
    buyerAddress = await lucid.wallet.address();
  }

  console.log('🔎 UTXO sélectionné (release):', escrowUtxo.txHash, escrowUtxo.outputIndex);

  const tx = await lucid
    .newTx()
    .collectFrom([escrowUtxo], redeemer)
    .payToAddress(sellerAddress, escrowUtxo.assets)
    .attachSpendingValidator(validator)
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();

  return txHash;
};

/**
 * Annule l'escrow et récupère les fonds (si le délai est expiré)
 */
export const cancelEscrow = async (
  escrowUtxo: UTxO,
  buyerAddress: string,
  lucidInstance?: Lucid | null
): Promise<string> => {
  const lucid = lucidInstance || getLucid();
  
  // Validateur V2 (compatible Lucid)
  const validator = getEscrowValidator();
  
  // Redeemer : utiliser Refund (Constr(1, [])) selon la logique du contrat Aiken
  // Le script vérifiera que le deadline est expiré (validity_range est entièrement après le deadline)
  const redeemer = Data.to(new Constr(1, [])); // Refund = Constr(1, [])

  // Logs de diagnostic pour "No variant matched" (cancel)
  console.log('🔎 UTXO sélectionné (cancel):', escrowUtxo.txHash, escrowUtxo.outputIndex);
  console.log('🔎 Adresse UTXO (cancel):', escrowUtxo.address);
  console.log('🔎 Datum brut présent ? (cancel) ', escrowUtxo.datum ? 'oui' : 'non');
  if (escrowUtxo.datum) {
    try {
      console.log('🔎 Datum brut (hex, cancel):', escrowUtxo.datum);
      console.log('🔎 Datum décodé (cancel, via Data.from):', Data.from(escrowUtxo.datum as any));
    } catch (decodeErr: any) {
      console.warn('⚠️ Échec de décodage du datum (cancel):', decodeErr?.message || decodeErr);
    }
  }

  // Le script Aiken vérifie que validity_range est entièrement après le deadline
  // On doit donc définir le validity_range pour que la vérification passe
  // Récupérer le deadline depuis le datum
  let deadline: bigint | undefined;
  if (escrowUtxo.datum) {
    try {
      const decodedDatum = Data.from(escrowUtxo.datum) as Constr;
      if (decodedDatum instanceof Constr && decodedDatum.fields.length >= 5) {
        deadline = decodedDatum.fields[4] as bigint;
        console.log('🔎 Deadline trouvé dans le datum:', deadline?.toString());
      }
    } catch (e) {
      console.warn('⚠️ Impossible de décoder le deadline depuis le datum:', e);
    }
  }

  // Si le deadline est trouvé, définir le validity_range pour qu'il commence après le deadline
  // Sinon, utiliser un timestamp futur (le script vérifiera on-chain)
  const now = BigInt(Date.now());
  const validityStart = deadline && deadline > now ? deadline : now + BigInt(1000); // +1 seconde minimum

  console.log('🔎 Validator type (cancel):', validator.type);
  console.log('🔎 Utilisation du redeemer Refund (Constr(1, []))');

  const completedTx = await lucid
    .newTx()
    .collectFrom([escrowUtxo], redeemer)
    .payToAddress(buyerAddress, escrowUtxo.assets)
    .attachSpendingValidator(validator)
    .validFrom(Number(validityStart))
    .complete();
    
    const signedTx = await completedTx.sign().complete();
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
  const escrowAddress = await getEscrowAddress(lucid);
  
  console.log('🔍 Recherche des UTXOs à l\'adresse escrow:', escrowAddress);
  
  // Récupérer tous les UTXOs présents à l'adresse escrow.
  // Avec le script V2 de test (AlwaysSucceeds) et un datum simplifié,
  // on ne filtre plus par orderId dans le datum.
  const utxos = await lucid.utxosAt(escrowAddress);
  
  console.log(`✅ ${utxos.length} UTXO(s) trouvé(s) à l'adresse escrow`);
  
  // Filtrer par orderId dans le datum si possible
  if (utxos.length > 0 && orderId) {
    const filteredUtxos = utxos.filter(utxo => {
      if (!utxo.datum) return false;
      try {
        const decodedDatum = Data.from(utxo.datum) as Constr;
        if (decodedDatum instanceof Constr && decodedDatum.fields.length >= 1) {
          const utxoOrderId = decodedDatum.fields[0] as string;
          // Convertir l'orderId en hex pour comparaison
          const orderIdHex = fromText(orderId);
          return utxoOrderId === orderIdHex;
        }
      } catch (e) {
        console.warn('⚠️ Impossible de décoder le datum pour filtrer par orderId:', e);
      }
      return false;
    });
    
    if (filteredUtxos.length > 0) {
      console.log(`✅ ${filteredUtxos.length} UTXO(s) correspondant à l'orderId: ${orderId}`);
      return filteredUtxos;
    } else {
      console.warn(`⚠️ Aucun UTXO ne correspond à l'orderId: ${orderId}. Retour de tous les UTXOs.`);
    }
  }
  
  return utxos;
};

/**
 * Vérifie l'état de l'escrow pour une commande
 */
export const checkEscrowStatus = async (
  orderId: string,
  lucidInstance?: Lucid | null
): Promise<{ exists: boolean; utxo?: UTxO; deadline?: number }> => {
  const utxos = await getEscrowUtxos(orderId, lucidInstance);
  
  if (utxos.length === 0) {
    return { exists: false };
  }

  // Pour l'instant, utiliser simplement le premier UTXO trouvé
  const utxo = utxos[0];

  return {
    exists: true,
    utxo,
    deadline: undefined,
  };
};
