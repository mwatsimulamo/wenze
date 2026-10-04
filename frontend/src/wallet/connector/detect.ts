/**
 * Détection de l'environnement (mobile/desktop) et des wallets disponibles
 */

import { WalletInfo, WalletConnectionMethod } from './types';

declare global {
  interface Window {
    cardano?: Record<string, any>;
  }
}

export interface DeviceInfo {
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isDesktop: boolean;
}

/**
 * Détecte le type d'appareil
 */
export function detectDevice(): DeviceInfo {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isMobile = isAndroid || isIOS;
  const isDesktop = !isMobile;

  return {
    isMobile,
    isAndroid,
    isIOS,
    isDesktop,
  };
}

/**
 * Liste des wallets Cardano supportés avec leurs métadonnées
 */
export const SUPPORTED_WALLETS = [
  { id: 'eternl', name: 'Eternl', icon: '/wallets/eternl.png', url: 'https://eternl.io' },
  { id: 'nami', name: 'Nami', icon: '/wallets/nami.png', url: 'https://namiwallet.io' },
  { id: 'lace', name: 'Lace', icon: '/wallets/lace.png', url: 'https://www.lace.io' },
  { id: 'flint', name: 'Flint', icon: '/wallets/flint.png', url: 'https://flint-wallet.com' },
  { id: 'vespr', name: 'Vespr', icon: '/wallets/vespr.png', url: 'https://vespr.xyz' },
  { id: 'yoroi', name: 'Yoroi', icon: '/wallets/yoroi.png', url: 'https://yoroi-wallet.com' },
  { id: '1am', name: '1AM', icon: '/wallets/1am.png', url: 'https://1am.xyz' },
] as const;

/**
 * Détecte les wallets CIP-30 injectés (desktop uniquement)
 */
export function detectInjectedWallets(): WalletInfo[] {
  if (!window.cardano) {
    return [];
  }

  const wallets: WalletInfo[] = [];
  
  for (const wallet of SUPPORTED_WALLETS) {
    if (window.cardano[wallet.id]) {
      wallets.push({
        id: wallet.id,
        name: wallet.name,
        icon: wallet.icon,
        method: 'cip30',
        isInstalled: true,
      });
    }
  }

  return wallets;
}

/**
 * Détermine la méthode de connexion recommandée selon l'appareil
 */
export function getRecommendedConnectionMethod(device: DeviceInfo): WalletConnectionMethod | null {
  if (device.isDesktop) {
    const injectedWallets = detectInjectedWallets();
    if (injectedWallets.length > 0) {
      return 'cip30';
    }
    return null; // Pas de wallet injecté sur desktop
  }

  if (device.isMobile) {
    // Sur mobile, on essaie WalletConnect v2 en premier, puis CIP-45 en fallback
    return 'walletconnect';
  }

  return null;
}

/**
 * Obtient tous les wallets disponibles selon l'appareil
 */
export async function getAvailableWallets(): Promise<WalletInfo[]> {
  const device = detectDevice();
  const wallets: WalletInfo[] = [];

  if (device.isDesktop) {
    // Sur desktop, on liste les wallets CIP-30 injectés
    const injected = detectInjectedWallets();
    wallets.push(...injected);
  } else if (device.isMobile) {
    // Sur mobile, on propose les wallets compatibles WalletConnect/CIP-45
    // Eternl est le plus populaire sur mobile
    wallets.push({
      id: 'eternl',
      name: 'Eternl',
      icon: '/wallets/eternl.png',
      method: 'walletconnect',
      isInstalled: true, // On assume qu'il peut être installé
    });
    
    // Ajouter d'autres wallets mobiles si nécessaire
    wallets.push({
      id: 'nami',
      name: 'Nami',
      icon: '/wallets/nami.png',
      method: 'walletconnect',
      isInstalled: true,
    });
  }

  return wallets;
}

/**
 * Vérifie si un wallet spécifique est disponible
 */
export function isWalletAvailable(walletId: string): boolean {
  if (!window.cardano) {
    return false;
  }
  return !!window.cardano[walletId];
}

/**
 * Mode debug activable via VITE_DEBUG_WALLET
 */
export function isDebugMode(): boolean {
  return import.meta.env.VITE_DEBUG_WALLET === 'true' || import.meta.env.DEV;
}

/**
 * Log en mode debug uniquement
 */
export function debugLog(...args: any[]): void {
  if (isDebugMode()) {
    console.log('[Wallet Connector]', ...args);
  }
}

export function debugError(...args: any[]): void {
  if (isDebugMode()) {
    console.error('[Wallet Connector]', ...args);
  }
}

export function debugWarn(...args: any[]): void {
  if (isDebugMode()) {
    console.warn('[Wallet Connector]', ...args);
  }
}

