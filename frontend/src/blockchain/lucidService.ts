/**
 * Service Lucid pour les transactions Cardano
 * Gère l'initialisation de Lucid et les interactions avec la blockchain
 */

import { Lucid, Blockfrost, WalletApi, Data, TxHash } from 'lucid-cardano';
import { BLOCKCHAIN_CONFIG, getBlockfrostUrl, getBlockfrostProjectId } from './config';

// Instance globale de Lucid
let lucidInstance: Lucid | null = null;

/**
 * Initialise Lucid avec un wallet connecté
 */
export const initLucid = async (walletApi: WalletApi, network: 'mainnet' | 'testnet' = 'testnet'): Promise<Lucid> => {
  try {
    // Configuration Blockfrost (optionnel, pour lire la blockchain)
    const blockfrostUrl = getBlockfrostUrl(network);
    const projectId = getBlockfrostProjectId(network);

    // Initialiser Lucid
    let lucid: Lucid;

    const networkName = network === 'testnet' ? 'Preprod' : 'Mainnet';

    // Essayer d'abord avec Blockfrost si configuré, sinon utiliser le provider par défaut
    if (projectId && projectId.trim() !== '') {
      console.log('🔧 Tentative d\'initialisation de Lucid avec Blockfrost...');
      console.log('📡 URL Blockfrost:', blockfrostUrl);
      console.log('🔑 Project ID:', projectId.substring(0, 10) + '...');
      try {
        // Utiliser Blockfrost si la clé API est configurée
        lucid = await Lucid.new(
          new Blockfrost(blockfrostUrl, projectId),
          networkName
        );
        console.log('✅ Lucid initialisé avec Blockfrost avec succès');
      } catch (blockfrostError: any) {
        console.error('❌ Erreur avec Blockfrost:', blockfrostError);
        console.error('📋 Détails:', blockfrostError?.message || blockfrostError);
        // Lucid nécessite un provider valide - on ne peut pas continuer sans Blockfrost
        throw new Error(`Blockfrost non disponible: ${blockfrostError?.message || 'Erreur inconnue'}`);
      }
    } else {
      // Pour l'instant, sans Blockfrost, on ne peut pas initialiser Lucid
      // Lucid nécessite un provider valide pour fonctionner
      console.warn('⚠️ Blockfrost non configuré. Lucid ne peut pas être initialisé.');
      console.warn('💡 Pour utiliser Lucid, configurez VITE_BLOCKFROST_PROJECT_ID dans .env');
      throw new Error('Blockfrost non configuré. Veuillez configurer VITE_BLOCKFROST_PROJECT_ID dans .env pour utiliser Lucid.');
    }

    // Sélectionner le wallet
    lucid.selectWallet(walletApi);

    // Sauvegarder l'instance
    lucidInstance = lucid;

    return lucid;
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'initialisation de Lucid:', error);
    console.error('Détails de l\'erreur:', error?.message || error);
    
    // Ne pas bloquer l'application si Lucid échoue
    // On pourra toujours réessayer plus tard ou utiliser une fonctionnalité simplifiée
    throw new Error(`Impossible d'initialiser Lucid: ${error?.message || 'Erreur inconnue'}`);
  }
};

/**
 * Obtient l'instance Lucid actuelle
 */
export const getLucid = (): Lucid => {
  if (!lucidInstance) {
    throw new Error('Lucid n\'est pas initialisé. Appelez initLucid() d\'abord.');
  }
  return lucidInstance;
};

/**
 * Réinitialise Lucid (utile lors de la déconnexion du wallet)
 */
export const resetLucid = (): void => {
  lucidInstance = null;
};

/**
 * Convertit ADA en Lovelace
 */
export const adaToLovelace = (ada: number): bigint => {
  return BigInt(Math.floor(ada * 1_000_000));
};

/**
 * Convertit Lovelace en ADA
 */
export const lovelaceToAda = (lovelace: bigint | number): number => {
  const value = typeof lovelace === 'bigint' ? Number(lovelace) : lovelace;
  return value / 1_000_000;
};

/**
 * Vérifie si une transaction est confirmée
 */
export const waitForConfirmation = async (txHash: TxHash, confirmations: number = 2): Promise<boolean> => {
  const lucid = getLucid();
  
  try {
    // Attendre les confirmations
    // Note: awaitTx attend jusqu'à ce que la transaction soit confirmée
    await lucid.awaitTx(txHash);
    return true;
  } catch (error) {
    console.error('Error waiting for confirmation:', error);
    return false;
  }
};

/**
 * Formate un hash de transaction pour l'affichage
 */
export const formatTxHash = (txHash: TxHash): string => {
  return `${txHash.slice(0, 10)}...${txHash.slice(-10)}`;
};

/**
 * Obtient l'URL de l'explorateur pour une transaction
 */
export const getExplorerUrl = (txHash: TxHash, network: 'mainnet' | 'testnet' = 'testnet'): string => {
  if (network === 'testnet') {
    return `https://preprod.cardanoscan.io/transaction/${txHash}`;
  } else {
    return `https://cardanoscan.io/transaction/${txHash}`;
  }
};

