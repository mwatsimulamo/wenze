# Système de Négociation de Prix avec Escrow

## Vue d'ensemble

Cette fonctionnalité permet à l'acheteur de proposer un prix et de bloquer ce montant en escrow **avant ou pendant** la discussion avec le vendeur. Le vendeur peut accepter, refuser, ou faire une contre-proposition directement dans le chat.

## Structure de la Base de Données

### Colonnes ajoutées à la table `orders` :

- `order_mode`: `'direct'` ou `'negotiation'` (par défaut: `'direct'`)
- `proposed_price`: Montant proposé et bloqué (nullable)
- `final_price`: Prix final accepté par les deux parties (nullable)
- `escrow_status`: `'open'` | `'cancelled'` | `'released'` (nullable)

## Endpoints Backend

Tous les endpoints sont préfixés par `/api/orders/:id`

### POST `/propose-price`
- **Utilisateur**: Acheteur uniquement
- **Body**: `{ proposed_price: number }`
- **Action**: Démarre une négociation, bloque le montant en escrow
- **Message automatique**: "💰 L'acheteur a proposé X ADA et a bloqué ce montant en escrow."

### POST `/accept-price`
- **Utilisateur**: Vendeur uniquement
- **Action**: Accepte le prix proposé, finalise la transaction
- **Message automatique**: "✅ Le vendeur a accepté le prix de X ADA. La transaction peut continuer."

### POST `/counter-offer`
- **Utilisateur**: Vendeur uniquement
- **Body**: `{ counter_price: number }`
- **Action**: Fait une contre-proposition
- **Message automatique**: "💬 Le vendeur propose un prix de X ADA. L'acheteur doit accepter ou proposer un nouveau montant."

### POST `/cancel-negotiation`
- **Utilisateur**: Acheteur ou Vendeur
- **Action**: Annule la négociation, libère les fonds bloqués
- **Message automatique**: "❌ [Utilisateur] a annulé la négociation. Les fonds bloqués seront libérés."

### POST `/confirm-final-price`
- **Utilisateur**: Acheteur uniquement
- **Action**: Confirme le prix final après une contre-proposition du vendeur
- **Message automatique**: "✅ L'acheteur a confirmé le prix de X ADA. La transaction peut continuer."

## Flux Utilisateur

### Pour l'Acheteur :
1. Dans le chat d'une commande `pending`, clique sur "Proposer un prix et bloquer en escrow"
2. Entre un montant et confirme
3. Le montant est bloqué, le vendeur est notifié
4. Si le vendeur fait une contre-proposition, l'acheteur peut :
   - Confirmer le nouveau prix
   - Proposer un autre montant
   - Annuler la négociation

### Pour le Vendeur :
1. Voit la notification dans le chat : "L'acheteur a proposé X ADA"
2. Peut :
   - **Accepter** : La transaction continue avec ce prix
   - **Contre-proposer** : Propose un autre montant
   - **Refuser** : Annule la négociation

## Configuration Backend

Assurez-vous que :
1. Le serveur backend tourne sur `http://localhost:5000` (ou modifiez l'URL dans `ChatBox.tsx`)
2. Les variables d'environnement `SUPABASE_URL` et `SUPABASE_KEY` sont configurées
3. Le header `x-user-id` est envoyé avec chaque requête (géré automatiquement par le frontend)

## Notes Importantes

- **100% Web2 pour le MVP** : Aucune logique blockchain n'est implémentée
- Les messages automatiques sont créés dans la table `messages`
- L'escrow est simulé (pas de vraie blockchain pour l'instant)
- La structure est prête pour une intégration blockchain future


