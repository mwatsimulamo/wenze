/**
 * Configuration Blockchain pour WENZE
 * Configuration pour le testnet Cardano (Preprod)
 */

export const BLOCKCHAIN_CONFIG = {
  // Réseau : testnet (Preprod) pour le développement
  network: 'testnet' as 'mainnet' | 'testnet',
  
  // Endpoints Blockfrost pour Preprod Testnet
  blockfrost: {
    testnet: {
      url: 'https://cardano-preprod.blockfrost.io/api/v0',
      // La clé API doit être fournie via .env
      projectId: import.meta.env.VITE_BLOCKFROST_PROJECT_ID || '',
    },
    mainnet: {
      url: 'https://cardano-mainnet.blockfrost.io/api/v0',
      projectId: import.meta.env.VITE_BLOCKFROST_MAINNET_PROJECT_ID || '',
    },
  },

  // Wallets Cardano supportés (CIP-30)
  supportedWallets: ['nami', 'eternl', 'flint', 'vespr', 'lace', 'yoroi'] as const,

  // Configuration pour les transactions
  transaction: {
    // Délai d'expiration par défaut pour l'escrow (en heures)
    defaultEscrowDeadline: 168, // 7 jours
    
    // Frais minimum estimés (en lovelace = 0.17 ADA)
    estimatedFees: 170000,
    
    // Minimum de confirmation pour considérer une transaction comme confirmée
    minConfirmations: 2,
  },

  // Messages d'erreur
  errors: {
    NO_WALLET: 'Aucun portefeuille Cardano détecté. Veuillez installer Nami, Eternl ou un autre wallet compatible.',
    WALLET_CONNECTION_FAILED: 'Impossible de se connecter au portefeuille. Veuillez vérifier que votre wallet est déverrouillé.',
    INSUFFICIENT_FUNDS: 'Solde insuffisant. Veuillez recharger votre portefeuille.',
    TRANSACTION_FAILED: 'La transaction a échoué. Veuillez réessayer.',
    WRONG_NETWORK: 'Veuillez basculer votre wallet sur le réseau testnet (Preprod) pour utiliser cette application.',
  },
} as const;

/**
 * Vérifie si le wallet est configuré sur le bon réseau (testnet)
 */
export const checkNetwork = (addressBech32: string): boolean => {
  // Les adresses testnet commencent par "addr_test"
  return addressBech32.startsWith('addr_test');
};

/**
 * Obtient l'URL Blockfrost selon le réseau
 */
export const getBlockfrostUrl = (network: 'mainnet' | 'testnet'): string => {
  return BLOCKCHAIN_CONFIG.blockfrost[network].url;
};

/**
 * Obtient la clé API Blockfrost selon le réseau
 */
export const getBlockfrostProjectId = (network: 'mainnet' | 'testnet'): string => {
  return BLOCKCHAIN_CONFIG.blockfrost[network].projectId;
};



