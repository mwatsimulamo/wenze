import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';

// Wallet Configuration
const CARDANO_WALLETS = [
  { id: 'eternl', name: 'Eternl', icon: '/wallets/eternl.png', url: 'https://eternl.io' },
  { id: 'yoroi', name: 'Yoroi', icon: '/wallets/yoroi.png', url: 'https://yoroi-wallet.com' },
  { id: 'lace', name: 'Lace', icon: '/wallets/lace.png', url: 'https://www.lace.io' },
  { id: 'flint', name: 'Flint', icon: '/wallets/flint.png', url: 'https://flint-wallet.com' },
  { id: 'nami', name: 'Nami', icon: '/wallets/nami.png', url: 'https://namiwallet.io' },
  { id: 'vespr', name: 'Vespr', icon: '/wallets/vespr.png', url: 'https://vespr.xyz' },
];

// Cardano Logo
const CardanoLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 375 346.51" fill="currentColor">
    <path d="M102.76,172a25.31,25.31,0,1,0,25.31,25.31A25.31,25.31,0,0,0,102.76,172Z"/>
    <path d="M272.24,172a25.31,25.31,0,1,0,25.31,25.31A25.31,25.31,0,0,0,272.24,172Z"/>
    <path d="M187.5,84.59A33.09,33.09,0,1,0,220.59,117.68,33.09,33.09,0,0,0,187.5,84.59Z"/>
    <path d="M187.5,195.74a33.09,33.09,0,1,0,33.09,33.09A33.09,33.09,0,0,0,187.5,195.74Z"/>
    <path d="M122.9,107.35a25.31,25.31,0,1,0,25.31,25.31A25.31,25.31,0,0,0,122.9,107.35Z"/>
    <path d="M252.1,107.35a25.31,25.31,0,1,0,25.31,25.31A25.31,25.31,0,0,0,252.1,107.35Z"/>
    <path d="M122.9,213.85a25.31,25.31,0,1,0,25.31,25.31A25.31,25.31,0,0,0,122.9,213.85Z"/>
    <path d="M252.1,213.85a25.31,25.31,0,1,0,25.31,25.31A25.31,25.31,0,0,0,252.1,213.85Z"/>
    <path d="M140.69,147.05a33.09,33.09,0,1,0,33.09,33.09A33.09,33.09,0,0,0,140.69,147.05Z"/>
    <path d="M234.31,147.05a33.09,33.09,0,1,0,33.09,33.09A33.09,33.09,0,0,0,234.31,147.05Z"/>
  </svg>
);

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletData: WalletData) => void;
}

export interface WalletData {
  name: string;
  address: string;
  addressBech32: string;
  balance: number;
  walletId: string;
  icon: string;
}

declare global {
  interface Window {
    cardano?: any;
  }
}

// Convert hex to bytes
const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

// Bech32 encoding for Cardano addresses
const BECH32_ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

const bech32Polymod = (values: number[]): number => {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
};

const bech32HrpExpand = (hrp: string): number[] => {
  const ret: number[] = [];
  for (const c of hrp) ret.push(c.charCodeAt(0) >> 5);
  ret.push(0);
  for (const c of hrp) ret.push(c.charCodeAt(0) & 31);
  return ret;
};

const bech32CreateChecksum = (hrp: string, data: number[]): number[] => {
  const values = [...bech32HrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0];
  const polymod = bech32Polymod(values) ^ 1;
  const ret: number[] = [];
  for (let i = 0; i < 6; i++) ret.push((polymod >> (5 * (5 - i))) & 31);
  return ret;
};

const convertBits = (data: Uint8Array, fromBits: number, toBits: number, pad: boolean): number[] => {
  let acc = 0, bits = 0;
  const ret: number[] = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad && bits > 0) ret.push((acc << (toBits - bits)) & maxv);
  return ret;
};

const hexToBech32 = (hex: string, isTestnet?: boolean): string => {
  try {
    // Si l'adresse est déjà en Bech32, la retourner telle quelle
    if (hex.startsWith('addr1') || hex.startsWith('addr_test')) {
      return hex;
    }
    
    const bytes = hexToBytes(hex);
    
    // Détecter le réseau depuis les bytes si non spécifié
    let prefix = 'addr';
    if (isTestnet !== undefined) {
      prefix = isTestnet ? 'addr_test' : 'addr';
    } else {
      // Détection automatique depuis les bytes
      // 0x00, 0x01 = testnet, 0x60, 0x61 = mainnet pour les adresses de base
      const firstByte = bytes[0];
      if (firstByte === 0x00 || firstByte === 0x01) {
        prefix = 'addr_test';
      } else {
        prefix = 'addr';
      }
    }
    
    const data = convertBits(bytes, 8, 5, true);
    const checksum = bech32CreateChecksum(prefix, data);
    return prefix + '1' + [...data, ...checksum].map(d => BECH32_ALPHABET[d]).join('');
  } catch {
    return hex.slice(0, 20) + '...' + hex.slice(-10);
  }
};

// Parse CBOR balance
const parseCborBalance = (hex: string): number => {
  try {
    if (!hex || hex.length < 2) return 0;
    const bytes = hexToBytes(hex);
    const firstByte = bytes[0];
    
    if (firstByte <= 0x17) return firstByte;
    else if (firstByte === 0x18) return bytes[1];
    else if (firstByte === 0x19) return (bytes[1] << 8) | bytes[2];
    else if (firstByte === 0x1a) return (bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | bytes[4];
    else if (firstByte === 0x1b) {
      let value = BigInt(0);
      for (let i = 1; i <= 8; i++) value = (value << BigInt(8)) | BigInt(bytes[i] || 0);
      return Number(value);
    }
    return 0;
  } catch { return 0; }
};

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [installedWallets, setInstalledWallets] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<WalletData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkInstalledWallets();
      setConnectedWallet(null);
    }
  }, [isOpen]);

  const checkInstalledWallets = () => {
    if (!window.cardano) { setInstalledWallets([]); return; }
    const installed = CARDANO_WALLETS.filter(w => window.cardano[w.id]).map(w => w.id);
    setInstalledWallets(installed);
  };

  const connectToWallet = async (walletId: string) => {
    setConnecting(walletId);
    try {
      const walletApi = await window.cardano[walletId].enable();
      
      const usedAddresses = await walletApi.getUsedAddresses();
      const unusedAddresses = await walletApi.getUnusedAddresses();
      const addresses = [...(usedAddresses || []), ...(unusedAddresses || [])];
      
      if (addresses.length === 0) throw new Error('Aucune adresse trouvée');

      let addressRaw = addresses[0];
      let addressHex = addressRaw;
      let addressBech32 = addressRaw;

      // Les wallets CIP-30 retournent généralement les adresses déjà en Bech32
      // Vérifier si l'adresse est déjà en format Bech32
      if (typeof addressRaw === 'string' && (addressRaw.startsWith('addr1') || addressRaw.startsWith('addr_test'))) {
        // L'adresse est déjà en Bech32 avec le bon préfixe, utiliser directement
        addressBech32 = addressRaw;
        addressHex = addressRaw;
      } else {
        // L'adresse est en hex, il faut la convertir en Bech32
        // D'abord, obtenir le réseau depuis le wallet pour être sûr
        try {
          let isTestnet = false;
          
          // Utiliser getNetworkId() pour détecter le réseau réel
          if (walletApi.getNetworkId) {
            const networkId = await walletApi.getNetworkId();
            // networkId: 0 = testnet, 1 = mainnet
            isTestnet = networkId === 0;
          } else {
            // Fallback : détecter depuis les bytes (moins fiable)
            const bytes = hexToBytes(addressRaw);
            isTestnet = bytes[0] === 0x00 || bytes[0] === 0x01;
            console.warn('getNetworkId() not available, using byte detection (may be inaccurate)');
          }
          
          addressHex = addressRaw;
          addressBech32 = hexToBech32(addressRaw, isTestnet);
        } catch (e) {
          console.error('Error converting address:', e);
          // En cas d'erreur, utiliser l'adresse telle quelle
          addressHex = addressRaw;
          addressBech32 = addressRaw;
        }
      }

      const walletConfig = CARDANO_WALLETS.find(w => w.id === walletId)!;
      
      // Créer le walletData avec balance à 0 initialement pour améliorer la latence
      const walletData: WalletData = {
        name: walletConfig.name,
        address: addressHex,
        addressBech32,
        balance: 0, // Initialiser à 0 pour un feedback immédiat
        walletId,
        icon: walletConfig.icon,
      };

      // Connecter immédiatement (sans attendre le solde)
      setConnectedWallet(walletData);
      onConnect(walletData);
      
      // Charger le solde en arrière-plan (non-bloquant)
      walletApi.getBalance()
        .then((balanceHex: any) => {
          const balanceAda = parseCborBalance(balanceHex) / 1_000_000;
          const updatedWalletData = { ...walletData, balance: balanceAda };
          // Mettre à jour le solde localement et dans le context
          setConnectedWallet(updatedWalletData);
          onConnect(updatedWalletData);
        })
        .catch((e: any) => { 
          console.warn('Balance error:', e);
          // Le wallet reste connecté même si le solde ne charge pas
        });
    } catch (err: any) {
      console.error('Wallet error:', err);
    } finally {
      setConnecting(null);
    }
  };

  const copyAddress = () => {
    if (connectedWallet?.addressBech32) {
      navigator.clipboard.writeText(connectedWallet.addressBech32);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => 
    address.length > 24 ? `${address.slice(0, 14)}...${address.slice(-8)}` : address;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#101827] to-[#0a0f18] rounded-2xl shadow-2xl border border-cyan-500/20 overflow-hidden animate-fade-in">
        
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <CardanoLogo className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">
                {connectedWallet ? 'Wallet Connecté' : 'Cardano Wallet'}
              </h2>
              <p className="text-[10px] text-cyan-400">WENZE Blockchain</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-4">
          {!connectedWallet ? (
            <>
              {/* Wallet Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {CARDANO_WALLETS.map((wallet) => {
                  const isInstalled = installedWallets.includes(wallet.id);
                  const isConnecting = connecting === wallet.id;

                  return (
                    <button
                      key={wallet.id}
                      onClick={() => isInstalled && connectToWallet(wallet.id)}
                      disabled={!isInstalled || connecting !== null}
                      className={`relative p-3 rounded-xl flex flex-col items-center gap-2 transition-all duration-200
                        ${isInstalled 
                          ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10' 
                          : 'bg-white/[0.02] border border-white/5 opacity-40'
                        }
                        ${isConnecting ? 'border-cyan-500 bg-cyan-500/10' : ''}
                      `}
                    >
                      {/* Wallet Icon */}
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/5 p-1">
                        <img 
                          src={wallet.icon} 
                          alt={wallet.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      <span className="text-[11px] text-white font-medium">{wallet.name}</span>
                      
                      {/* Status */}
                      {isInstalled && !isConnecting && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50" />
                      )}
                      {isConnecting && (
                        <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                        </div>
                      )}
                      {!isInstalled && (
                        <a
                          href={wallet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl opacity-0 hover:opacity-100 transition"
                        >
                          <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                            Installer <ExternalLink className="w-3 h-3" />
                          </span>
                        </a>
                      )}
                    </button>
                  );
                })}
              </div>

              {installedWallets.length === 0 ? (
                <div className="text-center py-3 px-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-amber-300 text-xs">Aucun wallet détecté</p>
                </div>
              ) : (
                <p className="text-center text-gray-500 text-[11px]">
                  <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-1.5 align-middle" />
                  {installedWallets.length} wallet{installedWallets.length > 1 ? 's' : ''} disponible{installedWallets.length > 1 ? 's' : ''}
                </p>
              )}
            </>
          ) : (
            /* Connected State */
            <div>
              {/* Wallet Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 p-1.5 border border-white/10">
                  <img src={connectedWallet.icon} alt={connectedWallet.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{connectedWallet.name}</p>
                  <p className="text-emerald-400 text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Connecté
                  </p>
                </div>
              </div>

              {/* Balance */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4 mb-3">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Solde disponible</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    {connectedWallet.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </span>
                  <span className="text-cyan-400 font-medium text-xl">t₳</span>
                </div>
                <p className="text-gray-500 text-[10px] mt-1">Testnet ADA</p>
              </div>

              {/* Address */}
              <div className="bg-black/40 rounded-xl p-3 mb-4 border border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider">Adresse</p>
                  <button onClick={copyAddress} className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                <p className="text-xs font-mono text-gray-300 break-all leading-relaxed">
                  {formatAddress(connectedWallet.addressBech32)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setConnectedWallet(null)}
                  className="flex-1 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm rounded-xl font-medium transition"
                >
                  Changer
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative px-4 py-3 border-t border-white/5 bg-black/30">
          <div className="flex items-center justify-center gap-1.5 text-gray-600 text-[10px]">
            <CardanoLogo className="w-3 h-3" />
            <span>Sécurisé par Cardano Blockchain</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
