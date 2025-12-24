import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WalletData } from '../components/WalletModal';
import { parseCborBalance, verifyNetwork } from '../blockchain/walletUtils';
import { checkNetwork } from '../blockchain/config';
import { initLucid, resetLucid } from '../blockchain/lucidService';
import { Lucid } from 'lucid-cardano';

interface BlockchainContextType {
  wallet: WalletData | null;
  isConnected: boolean;
  network: 'mainnet' | 'testnet' | null;
  connectWallet: (walletData: WalletData) => void;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  walletApi: any | null; // API CIP-30 du wallet
  lucid: Lucid | null; // Instance Lucid (null si non initialisé)
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export const BlockchainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'testnet' | null>(null);
  const [walletApi, setWalletApi] = useState<any | null>(null);
  const [lucid, setLucid] = useState<Lucid | null>(null);

  // Charger le wallet depuis localStorage au démarrage
  useEffect(() => {
    const loadWallet = async () => {
      try {
        const savedWalletId = localStorage.getItem('wenze-wallet-id');
        const savedWalletData = localStorage.getItem('wenze-wallet-data');
        
        if (savedWalletId && savedWalletData && window.cardano?.[savedWalletId]) {
          try {
            // Vérifier si le wallet est toujours connecté
            const api = await window.cardano[savedWalletId].enable();
            const walletData: WalletData = JSON.parse(savedWalletData);
            
            // Vérifier que l'adresse est toujours valide
            const addresses = await api.getUsedAddresses();
            if (addresses && addresses.length > 0) {
              setWalletApi(api);
              setWallet(walletData);
              // Détecter le réseau depuis l'adresse
              const address = walletData.addressBech32 || addresses[0];
              const detectedNetwork = checkNetwork(address) ? 'testnet' : 'mainnet';
              setNetwork(detectedNetwork);
              
              // Vérifier le réseau (doit être testnet pour le développement)
              const networkCheck = verifyNetwork(walletData);
              if (!networkCheck.valid) {
                console.warn('⚠️ Network warning:', networkCheck.message);
              }
              
              // Initialiser Lucid en arrière-plan (non-bloquant pour améliorer la latence)
              initLucid(api, detectedNetwork)
                .then((lucidInstance) => {
                  setLucid(lucidInstance);
                  console.log('✅ Lucid initialisé avec succès');
                })
                .catch((error: any) => {
                  console.warn('⚠️ Lucid ne peut pas être initialisé:', error?.message || error);
                  console.info('ℹ️ L\'application continuera de fonctionner sans Lucid');
                  setLucid(null);
                });
              
              // Rafraîchir le solde en arrière-plan (non-bloquant)
              refreshBalance(api, walletData).catch((error) => {
                console.warn('Error refreshing balance:', error);
              });
            }
          } catch (error) {
            // Wallet déconnecté ou refusé
            localStorage.removeItem('wenze-wallet-id');
            localStorage.removeItem('wenze-wallet-data');
          }
        }
      } catch (error) {
        console.error('Error loading wallet:', error);
      }
    };

    loadWallet();
  }, []);

  const refreshBalance = useCallback(async (api?: any, walletData?: WalletData) => {
    const apiToUse = api || walletApi;
    const walletToUpdate = walletData || wallet;
    
    if (!apiToUse || !walletToUpdate) return;

    try {
      const balanceHex = await apiToUse.getBalance();
      const balanceLovelace = parseCborBalance(balanceHex);
      const balanceAda = balanceLovelace / 1_000_000;
      
      if (walletToUpdate) {
        setWallet({ ...walletToUpdate, balance: balanceAda });
      }
    } catch (error) {
      console.warn('Error refreshing balance:', error);
    }
  }, [walletApi, wallet]);

  const connectWallet = useCallback(async (walletData: WalletData) => {
    // Mettre à jour l'état du wallet immédiatement pour un feedback rapide
    setWallet(walletData);
    
    // Détecter le réseau depuis l'adresse (opération synchrone, rapide)
    const address = walletData.addressBech32;
    const detectedNetwork = checkNetwork(address) ? 'testnet' : 'mainnet';
    setNetwork(detectedNetwork);
    
    // Vérifier le réseau (synchrone)
    const networkCheck = verifyNetwork(walletData);
    if (!networkCheck.valid) {
      console.warn('⚠️ Network warning:', networkCheck.message);
    }
    
    // Sauvegarder dans localStorage (synchrone, rapide)
    localStorage.setItem('wenze-wallet-id', walletData.walletId);
    localStorage.setItem('wenze-wallet-data', JSON.stringify(walletData));
    
    // Récupérer l'API du wallet (asynchrone mais nécessaire)
    if (window.cardano?.[walletData.walletId]) {
      try {
        const api = await window.cardano[walletData.walletId].enable();
        setWalletApi(api);
        
        // Initialiser Lucid en arrière-plan (non-bloquant)
        // Ne pas attendre pour améliorer la réactivité
        initLucid(api, detectedNetwork)
          .then((lucidInstance) => {
            setLucid(lucidInstance);
            console.log('✅ Lucid initialisé avec succès');
          })
          .catch((error: any) => {
            console.warn('⚠️ Lucid ne peut pas être initialisé:', error?.message || error);
            console.info('ℹ️ Le wallet reste connecté et fonctionnel sans Lucid');
            // Ne pas bloquer - le wallet fonctionne toujours
            setLucid(null);
          });
      } catch (error: any) {
        console.error('Error enabling wallet API:', error);
      }
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet(null);
    setWalletApi(null);
    setNetwork(null);
    setLucid(null);
    resetLucid(); // Réinitialiser l'instance Lucid globale
    localStorage.removeItem('wenze-wallet-id');
    localStorage.removeItem('wenze-wallet-data');
  }, []);

  // Valeur du contexte - toujours définie
  const contextValue: BlockchainContextType = {
    wallet,
    isConnected: !!wallet,
    network,
    connectWallet,
    disconnectWallet,
    refreshBalance: () => refreshBalance(),
    walletApi,
    lucid,
  };

  return (
    <BlockchainContext.Provider value={contextValue}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};

