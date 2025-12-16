/**
 * Script de test pour vérifier la compatibilité PlutusV2 avec lucid-cardano
 * 
 * Ce script teste si lucid-cardano peut charger et utiliser un contrat PlutusV2 simple
 */

import { Lucid } from 'lucid-cardano';
import { getLucid } from './lucidService';

export async function testV2Compatibility(): Promise<{
  v2Works: boolean;
  v3Works: boolean;
  v2Error?: string;
  v3Error?: string;
}> {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 TEST DE COMPATIBILITÉ PLUTUS V2 vs V3');
  console.log('═══════════════════════════════════════════════════');
  
  const lucid = getLucid();
  if (!lucid) {
    throw new Error('Lucid n\'est pas initialisé');
  }

  const results = {
    v2Works: false,
    v3Works: false,
    v2Error: undefined as string | undefined,
    v3Error: undefined as string | undefined,
  };

  // Test V2
  console.log('\n[TEST 1] Test du contrat PlutusV2 (AlwaysSucceeds)...');
  try {
    const v2Response = await fetch('/contracts/escrow_v2_test.plutus.json');
    if (!v2Response.ok) {
      throw new Error(`Fichier V2 non trouvé: ${v2Response.status}`);
    }
    
    const v2Contract = await v2Response.json();
    console.log('✅ Fichier V2 chargé:', v2Contract.type, 'CBOR length:', v2Contract.cborHex?.length);
    
    // Essayer de créer l'adresse avec V2
    const scriptV2: any = {
      type: "PlutusScriptV2",
      cborHex: v2Contract.cborHex,
    };
    
    const addressV2 = lucid.utils.validatorToAddress(scriptV2);
    console.log('✅✅✅ SUCCÈS avec PlutusV2!');
    console.log('   Adresse V2:', addressV2.substring(0, 50) + '...');
    results.v2Works = true;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('❌ Échec du test V2:', errorMsg);
    results.v2Error = errorMsg;
  }

  // Test V3
  console.log('\n[TEST 2] Test du contrat PlutusV3 (Aiken compilé)...');
  try {
    const v3Response = await fetch('/contracts/escrow.plutus.json');
    if (!v3Response.ok) {
      throw new Error(`Fichier V3 non trouvé: ${v3Response.status}`);
    }
    
    const v3Contract = await v3Response.json();
    console.log('✅ Fichier V3 chargé:', v3Contract.type, 'CBOR length:', v3Contract.cborHex?.length);
    
    // Essayer de créer l'adresse avec V3
    const scriptV3: any = {
      type: "PlutusScriptV3",
      cborHex: v3Contract.cborHex,
    };
    
    const addressV3 = lucid.utils.validatorToAddress(scriptV3);
    console.log('✅✅✅ SUCCÈS avec PlutusV3!');
    console.log('   Adresse V3:', addressV3.substring(0, 50) + '...');
    results.v3Works = true;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('❌ Échec du test V3:', errorMsg);
    results.v3Error = errorMsg;
  }

  // Conclusion
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 RÉSULTATS:');
  console.log('   PlutusV2:', results.v2Works ? '✅ FONCTIONNE' : '❌ ÉCHEC');
  console.log('   PlutusV3:', results.v3Works ? '✅ FONCTIONNE' : '❌ ÉCHEC');
  console.log('═══════════════════════════════════════════════════');
  
  if (results.v2Works && !results.v3Works) {
    console.log('\n✅ CONCLUSION: lucid-cardano supporte V2 mais PAS V3');
    console.log('   Le problème vient uniquement de PlutusV3.');
  } else if (!results.v2Works && !results.v3Works) {
    console.log('\n❌ CONCLUSION: lucid-cardano ne supporte ni V2 ni V3');
    console.log('   Le problème est plus général (configuration, format CBOR, etc.)');
  } else if (results.v2Works && results.v3Works) {
    console.log('\n✅ CONCLUSION: lucid-cardano supporte V2 ET V3!');
    console.log('   Le problème doit venir d\'ailleurs.');
  }
  console.log('═══════════════════════════════════════════════════\n');

  return results;
}

