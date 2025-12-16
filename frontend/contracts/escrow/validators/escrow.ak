//! Smart Contract Escrow pour WENZE
//! 
//! Ce contrat permet de :
//! 1. Verrouiller les fonds d'une transaction
//! 2. Libérer les fonds au vendeur après confirmation de l'acheteur
//! 3. Récupérer les fonds si le délai expire (timeout)

use cardano/transaction.{Transaction, OutputReference}
use aiken/crypto.{VerificationKeyHash}
use aiken/collection/list
use aiken/interval

pub type EscrowDatum {
  order_id: ByteArray,
  buyer: VerificationKeyHash,
  seller: VerificationKeyHash,
  amount: Int,
  deadline: Int, // Timestamp Unix en millisecondes
}

pub type EscrowRedeemer {
  Release // Libère les fonds au vendeur (signé par l'acheteur)
  Cancel  // Annule et récupère les fonds (si délai expiré)
}

validator escrow {
  spend(datum: Option<EscrowDatum>, redeemer: EscrowRedeemer, _utxo: OutputReference, ctx: Transaction) {
    when datum is {
      Some(escrow_datum) -> {
        when redeemer is {
          Release -> {
            // Vérifier que le signataire est l'acheteur
            // Le buyer doit être dans la liste des signataires supplémentaires
            list.has(ctx.extra_signatories, escrow_datum.buyer)
          }
          Cancel -> {
            // Vérifier que le délai est expiré
            // Le validity_range doit commencer entièrement après le deadline
            ctx.validity_range |> interval.is_entirely_after(escrow_datum.deadline)
          }
        }
      }
      None -> False
    }
  }
}
