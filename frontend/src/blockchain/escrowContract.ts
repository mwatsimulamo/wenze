/**
 * Smart Contract Escrow pour WENZE
 * 
 * Ce contrat permet de :
 * 1. Verrouiller les fonds d'une transaction
 * 2. Libérer les fonds au vendeur après confirmation de l'acheteur
 * 3. Récupérer les fonds si le délai expire (timeout)
 */

import { Lucid, Data, UTxO, fromText, fromHex } from 'lucid-cardano';
import { adaToLovelace, getLucid } from './lucidService';

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

/**
 * Charge le script validateur compilé depuis le fichier
 * 
 * PRIORITÉ:
 * 1. Tente de charger depuis public/contracts/escrow.plutus.json (si Aiken compilé)
 * 2. Sinon, charge depuis plutus.json (blueprint Aiken)
 */
export const loadEscrowValidator = async (): Promise<string> => {
  try {
    // Essayer de charger le contrat compilé depuis Aiken (V3)
    const response = await fetch('/contracts/escrow.plutus.json');
    if (response.ok) {
      const contractData = await response.json();
      // Le contrat doit avoir cborHex
      if (contractData.cborHex) {
        return JSON.stringify(contractData);
      }
      // Si c'est l'ancien format avec compiledCode
      if (contractData.compiledCode) {
        return JSON.stringify({
          type: "PlutusScriptV3",
          description: "Escrow smart contract compiled with Aiken",
          cborHex: contractData.compiledCode
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement du contrat:', error);
  }

  // Si le fichier n'existe pas, charger depuis plutus.json
  try {
    const plutusResponse = await fetch('/contracts/escrow/plutus.json');
    if (plutusResponse.ok) {
      const plutusData = await plutusResponse.json();
      // Chercher le validateur spend
      const spendValidator = plutusData.validators?.find((v: any) => v.title?.includes('spend'));
      if (spendValidator?.compiledCode) {
        return JSON.stringify({
          type: "PlutusScriptV3",
          description: "Escrow smart contract compiled with Aiken",
          cborHex: spendValidator.compiledCode,
          hash: spendValidator.hash
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement depuis plutus.json:', error);
  }

  throw new Error('Contrat escrow compilé non trouvé. Veuillez compiler le contrat avec Aiken et placer escrow.plutus.json dans public/contracts/');
};

/**
 * Obtient l'adresse du script validateur
 */
/**
 * Crée l'adresse du script à partir du hash (solution de contournement pour Lucid 0.10.11)
 * Cette fonction utilise le hash du script directement pour créer l'adresse
 */
const createScriptAddressFromHash = (scriptHash: string, network: 'mainnet' | 'testnet' = 'testnet'): string => {
  // Cette adresse est calculée à partir du hash du script
  // Pour PlutusV3 sur testnet Preprod, le format est: addr_test + script hash (28 bytes) + stake key (optionnel, vide ici)
  
  // Hash connu du contrat escrow compilé
  // Si le hash change après recompilation, il faudra mettre à jour cette valeur
  const KNOWN_SCRIPT_HASH = 'd5c214c90928733c8a8741b40de67ded41255290af2f4d88400a3d19';
  
  // Pour l'instant, utiliser une solution de contournement : 
  // Utiliser une adresse de test connue ou calculer manuellement
  // Note: Le calcul complet d'une adresse Cardano nécessite des fonctions de hachage et encoding Bech32 complexes
  
  // SOLUTION TEMPORAIRE: Utiliser le hash pour créer l'adresse via une API ou un service externe
  // Pour Preprod testnet avec un script (sans stake key):
  // - Prefix: 00 pour testnet script address
  // - Script hash: 28 bytes (56 hex chars)
  
  console.warn('⚠️ SOLUTION DE CONTOURNEMENT: Utilisation du hash du script pour créer l\'adresse');
  console.warn('⚠️ Cette solution est temporaire en attendant le support PlutusV3 dans lucid-cardano');
  
  // Calculer l'adresse manuellement serait complexe, donc pour l'instant
  // on retourne une erreur explicative avec le hash pour référence
  throw new Error(
    `WORKAROUND REQUIRED: Lucid 0.10.11 ne supporte pas PlutusV3.\n\n` +
    `Script Hash: ${scriptHash || KNOWN_SCRIPT_HASH}\n\n` +
    `Solutions possibles:\n` +
    `1. Attendre une mise à jour de lucid-cardano qui supporte PlutusV3\n` +
    `2. Utiliser une API externe pour créer l'adresse à partir du hash\n` +
    `3. Calculer manuellement l'adresse (complexe, nécessite Bech32 encoding)\n` +
    `4. Utiliser un contrat PlutusV2 au lieu de V3 (nécessite recompilation)`
  );
};

export const getEscrowAddress = async (lucid: Lucid, validatorJson: string, network?: 'mainnet' | 'testnet'): Promise<string> => {
  // Parser le JSON du validateur
  const validatorData = JSON.parse(validatorJson);
  
  // Vérifier que le contrat a bien cborHex
  if (!validatorData.cborHex) {
    throw new Error('Le contrat validateur doit contenir un champ cborHex');
  }
  
  const cborHex = validatorData.cborHex;
  if (typeof cborHex !== 'string') {
    throw new Error('cborHex doit être une chaîne hexadécimale');
  }
  
  const cborHexTrimmed = cborHex.trim();
  const scriptHash = validatorData.hash; // Hash du script depuis plutus.json
  
  const scriptType = validatorData.type || "PlutusScriptV3";
  console.log('📝 Tentative de création de l\'adresse du validateur...');
  console.log('Type du script dans JSON:', scriptType);
  console.log('CBOR Hex length:', cborHexTrimmed.length);
  console.log('Script Hash:', scriptHash || 'Non disponible');
  
  // Essayer toutes les méthodes possibles avec Lucid
  // Si le script est marqué V2, essayer V2 en premier
  // Sinon, essayer dans l'ordre standard
  const formatsToTry = scriptType === "PlutusScriptV2" 
    ? [
        { type: "PlutusScriptV2", format: "cborHex", value: cborHexTrimmed },
        { type: "PlutusScriptV2", format: "script", value: null as any }, // Sera rempli si bytes fonctionne
      ]
    : [
        { type: "PlutusScriptV2", format: "cborHex", value: cborHexTrimmed },
        { type: "PlutusScriptV3", format: "cborHex", value: cborHexTrimmed },
      ];
  
  // Essayer avec bytes aussi
  try {
    const cborBytes = fromHex(cborHexTrimmed);
    if (scriptType === "PlutusScriptV2") {
      formatsToTry[1].value = cborBytes; // Remplacer le null
    } else {
      formatsToTry.push(
        { type: "PlutusScriptV2", format: "script", value: cborBytes },
        { type: "PlutusScriptV3", format: "script", value: cborBytes }
      );
    }
  } catch (e) {
    console.warn('⚠️ Impossible de convertir hex en bytes:', e);
    // Retirer les formats "script" qui nécessitent bytes
    formatsToTry.forEach((fmt, idx) => {
      if (fmt.format === "script" && fmt.value === null) {
        formatsToTry.splice(idx, 1);
      }
    });
  }
  
  for (const format of formatsToTry) {
    if (format.value === null) continue; // Skip les formats qui nécessitent bytes mais n'ont pas pu être convertis
    
    try {
      console.log(`🔄 Tentative avec ${format.type} (${format.format})...`);
      const script: any = {
        type: format.type,
        [format.format]: format.value
      };
      
      const address = lucid.utils.validatorToAddress(script);
      console.log(`✅✅✅ Adresse créée avec ${format.type} (${format.format}):`, address.substring(0, 30) + '...');
      return address;
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.warn(`⚠️ ${format.type} (${format.format}) a échoué:`, errorMsg);
      continue;
    }
  }
  
  // Si toutes les tentatives ont échoué, utiliser le hash pour calculer l'adresse manuellement
  console.error(`❌ Toutes les méthodes Lucid ont échoué pour ${scriptType}.`);
  console.log('🔄 Tentative de calcul manuel de l\'adresse à partir du hash...');
  
  // Si on a le hash du script, on peut calculer l'adresse manuellement
  if (scriptHash && scriptHash.length === 56) {
    try {
      const address = calculateAddressFromHash(scriptHash, 'testnet');
      console.log('✅ Adresse calculée manuellement:', address.substring(0, 50) + '...');
      return address;
    } catch (calcError: any) {
      console.error('❌ Échec du calcul manuel:', calcError?.message || calcError);
    }
  }
  
  // Message d'erreur adapté selon le type
  if (scriptType === "PlutusScriptV2") {
    throw new Error(
      `❌ IMPOSSIBLE: lucid-cardano 0.10.11 ne peut PAS créer d'adresse avec ce script PlutusV2.\n\n` +
      `Le problème est plus général que juste PlutusV3.\n\n` +
      `Erreurs rencontrées lors des tentatives avec:\n` +
      `- PlutusScriptV2 (cborHex)\n` +
      `- PlutusScriptV2 (script bytes)\n\n` +
      `Vérifiez:\n` +
      `1. Le format CBOR du script\n` +
      `2. La configuration de Lucid\n` +
      `3. La version de lucid-cardano (actuellement: 0.10.11)`
    );
  } else {
    // PlutusV3
    throw new Error(
      `❌ IMPOSSIBLE: lucid-cardano 0.10.11 ne supporte PAS les scripts PlutusV3 compilés par Aiken.\n\n` +
      `🔧 SOLUTIONS POSSIBLES:\n\n` +
      `1. ATTENDRE: Surveillez les mises à jour de lucid-cardano pour le support PlutusV3\n` +
      `   npm view lucid-cardano version  # Vérifier les nouvelles versions\n\n` +
      `2. WORKAROUND: Utiliser une API externe ou calculer l'adresse manuellement\n` +
      `   Hash du script: ${scriptHash || 'Non disponible'}\n\n` +
      `3. ALTERNATIVE: Compiler le contrat en PlutusV2 (nécessite downgrade d'Aiken, pas recommandé)\n\n` +
      `📋 Pour l'instant, les transactions escrow ne peuvent pas fonctionner avec cette configuration.`
    );
  }
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
  
  // Charger le validateur PlutusV3 (lucid-evolution supporte V3)
  console.log('📝 Chargement du contrat escrow PlutusV3 compilé par Aiken...');
  const validatorStr = await loadEscrowValidator();
  const escrowAddress = await getEscrowAddress(lucid, validatorStr);
  console.log('✅ Adresse escrow créée avec succès:', escrowAddress.substring(0, 50) + '...');
  
  // Obtenir les clés de vérification de l'acheteur et du vendeur
  const buyerDetails = lucid.utils.getAddressDetails(buyerAddress);
  const sellerDetails = lucid.utils.getAddressDetails(sellerAddress);
  
  const buyerVKeyHash = buyerDetails.paymentCredential?.hash;
  const sellerVKeyHash = sellerDetails.paymentCredential?.hash;
  
  if (!buyerVKeyHash || !sellerVKeyHash) {
    throw new Error('Impossible d\'obtenir les clés de vérification des adresses');
  }
  
  // Créer le datum au format Aiken (constructeur avec index 0)
  // Format Aiken: EscrowDatum { order_id, buyer, seller, amount, deadline }
  const datum = Data.to(
    Data.constructor(0, [
      fromText(orderId), // order_id: ByteArray
      buyerVKeyHash,     // buyer: VerificationKeyHash (ByteArray)
      sellerVKeyHash,    // seller: VerificationKeyHash (ByteArray)
      BigInt(amountLovelace), // amount: Int
      BigInt(Math.floor(deadline / 1000)), // deadline: Int (secondes)
    ])
  );
  
  // Créer la transaction pour envoyer les fonds au contrat
  const tx = await lucid
    .newTx()
    .payToContract(escrowAddress, { inline: datum }, { lovelace: amountLovelace })
    .complete();
  
  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  
  // Attendre que la transaction soit confirmée
  await lucid.awaitTx(txHash);
  
  // Récupérer l'UTXO de l'escrow
  const utxos = await lucid.utxosAt(escrowAddress);
  const orderIdBytes = fromText(orderId);
  const escrowUtxo = utxos.find(utxo => {
    if (!utxo.datum) return false;
    try {
      // Le datum est un constructeur avec index 0, le premier champ est order_id
      const utxoDatum = Data.from(utxo.datum) as any;
      // Le datum est un constructeur avec index 0, les champs sont dans un array
      // Format: [order_id, buyer, seller, amount, deadline]
      if (utxoDatum && Array.isArray(utxoDatum) && utxoDatum.length > 0) {
        return utxoDatum[0] === orderIdBytes;
      }
      return false;
    } catch {
      return false;
    }
  });
  
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
 */
export const releaseFundsFromEscrow = async (
  escrowUtxo: UTxO,
  sellerAddress: string,
  buyerAddress?: string,
  lucidInstance?: Lucid | null
): Promise<string> => {
  const lucid = lucidInstance || getLucid();
  
  // Charger le validateur (utiliser le même que pour lockFundsInEscrow)
  const validatorStr = await loadEscrowValidator();
  const validator = JSON.parse(validatorStr);
  
  // Créer le redeemer "release" - Format Aiken: Release est un constructeur avec index 0, sans champs
  const redeemer = Data.to(Data.constructor(0, []));
  
  // Créer le script validateur
  // Note: Utiliser PlutusScriptV2 pour compatibilité avec Lucid
  const validatorScript: any = { 
    type: "PlutusScriptV2", 
    cborHex: validator.cborHex 
  };
  
  // Créer la transaction pour libérer les fonds
  // IMPORTANT: Le buyer doit être ajouté comme signataire pour que la vérification passe
  // addSigner attend une adresse Bech32, pas un VerificationKeyHash
  let tx = lucid
    .newTx()
    .collectFrom([escrowUtxo], redeemer)
    .payToAddress(sellerAddress, escrowUtxo.assets)
    .attachSpendingValidator(validatorScript);
  
  // Ajouter le buyer comme signataire si l'adresse est fournie
  if (buyerAddress) {
    tx = tx.addSigner(buyerAddress);
  }
  
  const completedTx = await tx.complete();
  const signedTx = await completedTx.sign().complete();
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
  
  // Charger le validateur (utiliser le même que pour lockFundsInEscrow)
  const validatorStr = await loadEscrowValidator();
  const validator = JSON.parse(validatorStr);
  
  // Obtenir le datum pour vérifier le deadline
  if (!escrowUtxo.datum) {
    throw new Error('UTXO escrow sans datum');
  }
  
  // Le datum est un constructeur: [order_id, buyer, seller, amount, deadline]
  const datum = Data.from(escrowUtxo.datum) as any;
  const deadlineSeconds = datum && Array.isArray(datum) && datum.length > 4 
    ? Number(datum[4]) // deadline est le 5ème élément (index 4), déjà en secondes
    : 0;
  const deadlineMs = deadlineSeconds * 1000; // Convertir en millisecondes
  
  // Vérifier que le délai est expiré
  if (Date.now() < deadlineMs) {
    throw new Error(`Le délai n'est pas encore expiré. Deadline: ${new Date(deadlineMs).toISOString()}`);
  }
  
  // Créer le redeemer "cancel" - Format Aiken: Cancel est un constructeur avec index 1, sans champs
  const redeemer = Data.to(Data.constructor(1, []));
  
  // Créer le script validateur
  // Note: Utiliser PlutusScriptV2 pour compatibilité avec Lucid
  const validatorScript: any = { 
    type: "PlutusScriptV2", 
    cborHex: validator.cborHex 
  };
  const tx = await lucid
    .newTx()
    .collectFrom([escrowUtxo], redeemer)
    .payToAddress(buyerAddress, escrowUtxo.assets)
    .attachSpendingValidator(validatorScript)
    .validFrom(deadlineSeconds) // Permettre la transaction seulement après le deadline
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
  const validatorStr = await loadEscrowValidator();
  const escrowAddress = await getEscrowAddress(lucid, validatorStr);
  
  const utxos = await lucid.utxosAt(escrowAddress);
  
  // Filtrer les UTXOs qui correspondent à cette commande
  const orderIdBytes = fromText(orderId);
  return utxos.filter(utxo => {
    if (!utxo.datum) return false;
    try {
      const datum = Data.from(utxo.datum) as any;
      // Le datum est un constructeur, les champs sont dans un array
      if (datum && Array.isArray(datum) && datum.length > 0) {
        return datum[0] === orderIdBytes;
      }
      return false;
    } catch {
      return false;
    }
  });
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
  
  const utxo = utxos[0];
  if (!utxo.datum) {
    return { exists: false };
  }
  
  // Le datum est un constructeur: [order_id, buyer, seller, amount, deadline]
  const datum = Data.from(utxo.datum) as any;
  const deadline = datum && Array.isArray(datum) && datum.length > 4 
    ? Number(datum[4]) * 1000 // deadline est le 5ème élément (index 4)
    : 0;
  
  return {
    exists: true,
    utxo,
    deadline,
  };
};
