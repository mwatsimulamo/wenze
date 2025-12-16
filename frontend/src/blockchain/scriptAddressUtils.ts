/**
 * Utilitaires pour calculer l'adresse d'un script Cardano à partir de son hash
 * Workaround pour lucid-cardano qui ne supporte pas PlutusV3
 */

import * as bech32 from 'bech32';
import { fromHex } from 'lucid-cardano';

/**
 * Calcule l'adresse d'un script PlutusV3 à partir de son hash
 * 
 * @param scriptHash - Hash hexadécimal du script (56 caractères hex)
 * @param network - 'mainnet' ou 'testnet'
 * @returns Adresse Bech32 du script
 */
export function calculateScriptAddress(scriptHash: string, network: 'mainnet' | 'testnet' = 'testnet'): string {
  // Convertir le hash hex en bytes
  const hashBytes = fromHex(scriptHash);
  
  // Pour un script Plutus (sans stake key):
  // - Header byte: 0x00 pour testnet script, 0x01 pour mainnet script
  // - Script hash: 28 bytes (56 hex chars)
  
  const headerByte = network === 'testnet' ? 0x00 : 0x01;
  
  // Construire le payload: header + script hash
  const payload = new Uint8Array([headerByte, ...hashBytes]);
  
  // Encoder en Bech32
  // Pour testnet: prefix "addr_test"
  // Pour mainnet: prefix "addr"
  const prefix = network === 'testnet' ? 'addr_test' : 'addr';
  
  const words = bech32.toWords(payload);
  const address = bech32.encode(prefix, words, bech32.encodings.BECH32);
  
  return address;
}

/**
 * Extrait le hash d'un script depuis son CBOR ou son plutus.json
 */
export function extractScriptHash(validatorJson: string): string | null {
  try {
    const validatorData = JSON.parse(validatorJson);
    
    // Si le hash est directement disponible
    if (validatorData.hash) {
      return validatorData.hash;
    }
    
    // Sinon, on devra calculer le hash depuis le CBOR
    // Pour l'instant, on retourne null si le hash n'est pas disponible
    return null;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du hash:', error);
    return null;
  }
}

