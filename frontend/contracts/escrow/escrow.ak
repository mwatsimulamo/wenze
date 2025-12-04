//! Smart Contract Escrow pour WENZE
//! 
//! Ce contrat permet de :
//! 1. Verrouiller les fonds d'une transaction
//! 2. Libérer les fonds au vendeur après confirmation de l'acheteur
//! 3. Récupérer les fonds si le délai expire (timeout)

use aiken/transaction.{ScriptContext}
use aiken/transaction/credential.{VerificationKeyHash}
use aiken/transaction/time_range.{contains, from, to}
use aiken/list

/// Datum du contrat escrow
type EscrowDatum {
  order_id: ByteArray
  buyer: VerificationKeyHash
  seller: VerificationKeyHash
  amount: Int
  deadline: Int // Timestamp Unix en millisecondes
}

/// Redeemer pour interagir avec le contrat
type EscrowRedeemer {
  release // Libère les fonds au vendeur (signé par l'acheteur)
  cancel  // Annule et récupère les fonds (si délai expiré)
}

/// Validateur principal
validator(escrow: EscrowDatum) {
  fn spend(redeemer: EscrowRedeemer, ctx: ScriptContext) -> Bool {
    when redeemer is {
      release -> {
        // Vérifier que le signataire est l'acheteur
        list.has(ctx.tx_info.signatories, escrow.buyer)
      }
      cancel -> {
        // Vérifier que le délai est expiré
        // Le valid_range doit contenir un intervalle qui commence après le deadline
        let valid_range = ctx.tx_info.valid_range
        contains(valid_range, from(escrow.deadline))
      }
    }
  }
}
