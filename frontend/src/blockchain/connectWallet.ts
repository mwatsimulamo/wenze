// Connexion directe aux wallets Cardano via l'API CIP-30 (sans librairie externe)
// On garde la blockchain prête, mais légère pour le déploiement Web2/Web3 hybride.

// Type definition for the window.cardano object injected by wallets (Nami, Eternl, Flint, ...)
declare global {
  interface Window {
    cardano?: any;
  }
}

/**
 * Liste des wallets supportés à vérifier (Ordre de priorité)
 */
const SUPPORTED_WALLETS = ['nami', 'eternl', 'flint', 'vespr', 'lace', 'yoroi'];

/**
 * Connecte l'utilisateur à son portefeuille Cardano via l'extension navigateur.
 * Version universelle : détecte n'importe quel wallet CIP-30 compatible,
 * sans dépendre de grosses librairies blockchain (compatibilité Vercel).
 */
export const connectWallet = async (): Promise<string | null> => {
  if (!window.cardano) {
    alert("Aucun portefeuille Crypto détecté. Installez Nami ou Eternl pour continuer.");
    return null;
  }

  try {
    // 1. Détection du wallet disponible
    let selectedWalletApi: any = null;
    let walletName = "";

    // On cherche le premier wallet installé et activé parmi la liste
    for (const name of SUPPORTED_WALLETS) {
      if (window.cardano[name]) {
        try {
          // Demande l'autorisation à l'utilisateur
          selectedWalletApi = await window.cardano[name].enable();
          walletName = name;
          if (selectedWalletApi) break; // Connexion réussie !
        } catch (e) {
          // On continue à chercher si l'utilisateur a un autre wallet
          if (import.meta.env.DEV) {
            console.warn(`L'utilisateur a refusé ou erreur avec ${name}`, e);
          }
        }
      }
    }

    if (!selectedWalletApi) {
      // Fallback générique : vérifier si window.cardano a une méthode enable directe (anciens standards)
      if (typeof window.cardano.enable === 'function') {
         try {
            selectedWalletApi = await window.cardano.enable();
         } catch(e) {
            if (import.meta.env.DEV) {
              console.error("Echec fallback legacy", e);
            }
         }
      }
    }

    if (!selectedWalletApi) {
      alert("Impossible de se connecter. Veuillez déverrouiller votre portefeuille.");
      return null;
    }

    // 3. Récupération d'une adresse depuis l'API CIP-30 directement
    // Selon les wallets, getUsedAddresses() retourne des adresses encodées (hex).
    // Pour le MVP, on affiche une version tronquée de l'adresse pour indiquer la connexion.
    const used = await selectedWalletApi.getUsedAddresses?.();
    const first = used && used.length > 0 ? used[0] : null;

    const displayAddress = first
      ? `${String(first).slice(0, 10)}...${String(first).slice(-6)}`
      : walletName || null;
    
    return displayAddress;

  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("❌ Erreur critique de connexion Blockchain:", error);
    }
    alert("Erreur technique lors de la connexion au portefeuille.");
    return null;
  }
};

/**
 * Vérifie si un wallet est déjà connecté
 */
export const checkWalletConnection = async (): Promise<boolean> => {
  if (!window.cardano) return false;

  for (const name of SUPPORTED_WALLETS) {
    if (window.cardano[name] && await window.cardano[name].isEnabled()) {
      return true;
    }
  }
  return false;
};
