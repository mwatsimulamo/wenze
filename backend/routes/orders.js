const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// POST /orders/:id/propose-price
// L'acheteur propose un prix et bloque le montant
router.post('/:id/propose-price', async (req, res) => {
  try {
    const { id } = req.params;
    const { proposed_price } = req.body;
    const userId = req.headers['x-user-id']; // À passer depuis le frontend

    if (!proposed_price || proposed_price <= 0) {
      return res.status(400).json({ error: 'Prix invalide' });
    }

    // Récupérer la commande
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.buyer_id !== userId) {
      return res.status(403).json({ error: 'Seul l\'acheteur peut proposer un prix' });
    }

    // Mettre à jour la commande
    const { data, error } = await supabase
      .from('orders')
      .update({
        order_mode: 'negotiation',
        proposed_price: proposed_price,
        escrow_status: 'open',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Créer un message automatique
    await supabase
      .from('messages')
      .insert({
        order_id: id,
        sender_id: userId,
        content: `💰 L'acheteur a proposé ${proposed_price} ADA et a bloqué ce montant en escrow.`
      });

    res.json({ success: true, order: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /orders/:id/accept-price
// Le vendeur accepte le prix proposé
router.post('/:id/accept-price', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.seller_id !== userId) {
      return res.status(403).json({ error: 'Seul le vendeur peut accepter' });
    }

    if (order.order_mode !== 'negotiation' || order.escrow_status !== 'open') {
      return res.status(400).json({ error: 'Aucune négociation en cours' });
    }

    // Finaliser le prix
    const { data, error } = await supabase
      .from('orders')
      .update({
        final_price: order.proposed_price,
        amount_ada: order.proposed_price,
        escrow_status: 'released',
        status: 'escrow_web2', // Passer à l'étape suivante
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Message automatique
    await supabase
      .from('messages')
      .insert({
        order_id: id,
        sender_id: userId,
        content: `✅ Le vendeur a accepté le prix de ${order.proposed_price} ADA. La transaction peut continuer.`
      });

    res.json({ success: true, order: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /orders/:id/counter-offer
// Le vendeur fait une contre-proposition
router.post('/:id/counter-offer', async (req, res) => {
  try {
    const { id } = req.params;
    const { counter_price } = req.body;
    const userId = req.headers['x-user-id'];

    if (!counter_price || counter_price <= 0) {
      return res.status(400).json({ error: 'Prix invalide' });
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.seller_id !== userId) {
      return res.status(403).json({ error: 'Seul le vendeur peut faire une contre-proposition' });
    }

    if (order.order_mode !== 'negotiation' || order.escrow_status !== 'open') {
      return res.status(400).json({ error: 'Aucune négociation en cours' });
    }

    // Mettre à jour avec la contre-proposition
    const { data, error } = await supabase
      .from('orders')
      .update({
        proposed_price: counter_price, // Remplacer la proposition par la contre-proposition
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Message automatique
    await supabase
      .from('messages')
      .insert({
        order_id: id,
        sender_id: userId,
        content: `💬 Le vendeur propose un prix de ${counter_price} ADA. L'acheteur doit accepter ou proposer un nouveau montant.`
      });

    res.json({ success: true, order: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /orders/:id/cancel-negotiation
// Annuler la négociation (peut être fait par l'acheteur ou le vendeur)
router.post('/:id/cancel-negotiation', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.buyer_id !== userId && order.seller_id !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (order.order_mode !== 'negotiation' || order.escrow_status !== 'open') {
      return res.status(400).json({ error: 'Aucune négociation en cours' });
    }

    // Annuler la négociation
    const { data, error } = await supabase
      .from('orders')
      .update({
        order_mode: 'direct',
        proposed_price: null,
        escrow_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Message automatique
    const userName = order.buyer_id === userId ? 'L\'acheteur' : 'Le vendeur';
    await supabase
      .from('messages')
      .insert({
        order_id: id,
        sender_id: userId,
        content: `❌ ${userName} a annulé la négociation. Les fonds bloqués seront libérés.`
      });

    res.json({ success: true, order: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /orders/:id/confirm-final-price
// L'acheteur confirme le prix final après contre-proposition du vendeur
router.post('/:id/confirm-final-price', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.buyer_id !== userId) {
      return res.status(403).json({ error: 'Seul l\'acheteur peut confirmer' });
    }

    if (order.order_mode !== 'negotiation' || !order.proposed_price) {
      return res.status(400).json({ error: 'Aucune négociation en cours' });
    }

    // Confirmer le prix final
    const { data, error } = await supabase
      .from('orders')
      .update({
        final_price: order.proposed_price,
        amount_ada: order.proposed_price,
        escrow_status: 'released',
        status: 'escrow_web2',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Message automatique
    await supabase
      .from('messages')
      .insert({
        order_id: id,
        sender_id: userId,
        content: `✅ L'acheteur a confirmé le prix de ${order.proposed_price} ADA. La transaction peut continuer.`
      });

    res.json({ success: true, order: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


