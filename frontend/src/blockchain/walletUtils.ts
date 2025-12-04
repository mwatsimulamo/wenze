/**
 * Utilitaires pour la gestion des wallets Cardano
 */

import { WalletData } from '../components/WalletModal';
import { checkNetwork } from './config';

declare global {
  interface Window {
    cardano?: any;
  }
}

/**
 * Convertit une adresse hex en Bech32 pour Cardano
 */
export const hexToBech32 = (hex: string): string => {
  try {
    // Convertir hex to bytes
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    
    // Détecter le préfixe selon le type d'adresse
    const prefix = bytes[0] === 0x00 || bytes[0] === 0x01 ? 'addr_test' : 'addr';
    
    // Conversion Bech32 simplifiée (pour l'affichage)
    // Note: En production, utilisez une librairie comme bech32
    return `${prefix}1${hex.slice(0, 10)}...${hex.slice(-10)}`;
  } catch {
    return hex.slice(0, 20) + '...' + hex.slice(-10);
  }
};

/**
 * Parse le solde CBOR depuis la réponse du wallet
 */
export const parseCborBalance = (hex: string): number => {
  try {
    if (!hex || hex.length < 2) return 0;
    
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    
    const firstByte = bytes[0];
    
    // Format CBOR simple
    if (firstByte <= 0x17) return firstByte;
    else if (firstByte === 0x18) return bytes[1];
    else if (firstByte === 0x19) return (bytes[1] << 8) | bytes[2];
    else if (firstByte === 0x1a) {
      return (bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | bytes[4];
    } else if (firstByte === 0x1b) {
      let value = BigInt(0);
      for (let i = 1; i <= 8; i++) {
        value = (value << BigInt(8)) | BigInt(bytes[i] || 0);
      }
      return Number(value);
    }
    
    return 0;
  } catch {
    return 0;
  }
};

/**
 * Vérifie si un wallet est disponible
 */
export const isWalletAvailable = (walletId: string): boolean => {
  return !!(window.cardano && window.cardano[walletId]);
};

/**
 * Obtient tous les wallets installés
 */
export const getInstalledWallets = (): string[] => {
  if (!window.cardano) return [];
  
  const supported = ['nami', 'eternl', 'flint', 'vespr', 'lace', 'yoroi'];
  return supported.filter(w => window.cardano?.[w]);
};

/**
 * Vérifie si le wallet est connecté au bon réseau (testnet)
 */
export const verifyNetwork = (walletData: WalletData): { valid: boolean; message?: string } => {
  const isTestnet = checkNetwork(walletData.addressBech32);
  
  if (!isTestnet) {
    return {
      valid: false,
      message: 'Votre wallet est configuré sur le réseau mainnet. Veuillez basculer sur Preprod Testnet pour tester cette application.',
    };
  }
  
  return { valid: true };
};

/**
 * Format un montant ADA en lovelace
 */
export const adaToLovelace = (ada: number): bigint => {
  return BigInt(Math.floor(ada * 1_000_000));
};

/**
 * Format un montant lovelace en ADA
 */
export const lovelaceToAda = (lovelace: bigint | number): number => {
  const value = typeof lovelace === 'bigint' ? Number(lovelace) : lovelace;
  return value / 1_000_000;
};

/**
 * Formate un montant ADA pour l'affichage
 */
export const formatADA = (ada: number): string => {
  return `${ada.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ADA`;
};

