import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import { prepareAdaRelease, ReleaseResult } from '../blockchain/prepareAdaRelease';
import { prepareAdaPayment } from '../blockchain/prepareAdaPayment';
import { useToast } from '../components/Toast';
import { useBlockchain } from '../context/BlockchainContext';
import { convertFCToADA, convertADAToFC, formatFC, formatADA } from '../utils/currencyConverter';
import { distributeWZPAfterTransaction } from '../utils/distributeWZP';
import { CheckCircle, X, DollarSign, ShoppingCart, AlertCircle, MessageSquare, TrendingDown, RotateCcw, Smartphone, Clock as ClockIcon, Clock, Info, ExternalLink, Lightbulb, ClipboardList, Hourglass } from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { lucid, isConnected: walletConnected, wallet } = useBlockchain();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showNewNegotiationModal, setShowNewNegotiationModal] = useState(false);
  const [newNegotiatePriceFC, setNewNegotiatePriceFC] = useState<string>('');
  const [newNegotiating, setNewNegotiating] = useState(false);
  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (showNewNegotiationModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [showNewNegotiationModal]);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
          *,
          products:product_id(*),
          buyer:buyer_id(*),
          seller:seller_id(*)
      `)
      .eq('id', id)
      .single();

    if (!error) {
      setOrder(data);
    } else {
      console.error('Error fetching order:', error);
    }
    setLoading(false);
  };

  // Fonction utilitaire pour récupérer l'adresse du vendeur
  // Priorité : wallet connecté du contexte si c'est l'utilisateur actuel, sinon base de données
  const getSellerAddress = (): string | undefined => {
    if (!order || !user) return undefined;
    
    const isSeller = user.id === order.seller_id;
    
    // Si c'est l'utilisateur actuel qui est le vendeur et qu'il a un wallet connecté, utiliser cette adresse
    if (isSeller && walletConnected && wallet) {
      return wallet.addressBech32;
    }
    
    // Sinon, chercher dans la base de données
    return order.seller?.wallet_address;
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);
    
    if (!error) {
        fetchOrder();
        
        // Libérer les fonds de l'escrow si complété
        if (newStatus === 'completed') {
            // Récupérer l'adresse du vendeur pour libérer les fonds
            const sellerAddress = getSellerAddress();
            
            if (!sellerAddress) {
              toast.error(
                'Erreur', 
                'Impossible de libérer les fonds : adresse du vendeur introuvable. Le vendeur doit connecter son wallet.'
              );
              // Annuler la mise à jour du statut
              fetchOrder();
              return;
            }

            // Vérifier que Lucid est disponible
            if (!lucid) {
              toast.error(
                'Erreur', 
                'Impossible de libérer les fonds : Lucid n\'est pas initialisé. Vérifiez votre connexion.'
              );
              fetchOrder();
              return;
            }

            try {
              // Calculer le montant attendu (final_price ou proposed_price ou amount_ada)
              const expectedAmountAda = order?.final_price || order?.proposed_price || order?.amount_ada;
              
              // Libérer les fonds de l'escrow
              const releaseResult: ReleaseResult = await prepareAdaRelease(
                id!, 
                sellerAddress, 
                lucid,
                expectedAmountAda
              );
              
              if (!releaseResult.success) {
                toast.error('Erreur de libération', releaseResult.message);
                // Annuler la mise à jour du statut si la libération a échoué
                fetchOrder();
                return;
              }

              toast.success(
                'Fonds libérés !', 
                releaseResult.message + (releaseResult.explorerUrl ? ` Hash: ${releaseResult.txHash?.substring(0, 16)}...` : '')
              );
              
              if (releaseResult.explorerUrl) {
                console.log('🔗 Explorateur:', releaseResult.explorerUrl);
              }
            } catch (error: any) {
              console.error('Erreur lors de la libération des fonds:', error);
              toast.error('Erreur de libération', error.message || 'Une erreur est survenue lors de la libération des fonds.');
              // Annuler la mise à jour du statut
              fetchOrder();
              return;
            }
            
            // Marquer le produit comme vendu (retirer du marché)
            if (order?.product_id) {
              const { error: productError } = await supabase
                .from('products')
                .update({ status: 'sold' })
                .eq('id', order.product_id);
              
              if (productError) {
                console.error('Error updating product status:', productError);
              } else {
                console.log('Product marked as sold:', order.product_id);
              }
            }
            
            // Distribuer les WZP après transaction complétée
            if (order?.buyer_id && order?.seller_id) {
              const amountAda = order.final_price || order.proposed_price || order.amount_ada || 0;
              
              if (amountAda > 0) {
                const wzpResult = await distributeWZPAfterTransaction(
                  id!,
                  order.buyer_id,
                  order.seller_id,
                  amountAda
                );
                
                if (wzpResult.success && wzpResult.buyerWZP) {
                  toast.success(
                    'Commande terminée !', 
                    `Les fonds ont été libérés, le produit a été retiré du marché. ${wzpResult.buyerWZP.toFixed(2)} WZP distribués à chaque partie.`
                  );
                } else {
                  toast.success('Commande terminée !', 'Les fonds ont été libérés, le produit a été retiré du marché.');
                }
              } else {
                toast.success('Commande terminée !', 'Les fonds ont été libérés, le produit a été retiré du marché.');
              }
            } else {
              toast.success('Commande terminée !', 'Les fonds ont été libérés, le produit a été retiré du marché.');
            }
        }
    }
  };

  // Accepter la proposition de négociation (vendeur)
  const handleAcceptNegotiation = async () => {
    if (!order || !user) return;
    
    // Vérifier que le vendeur a un wallet connecté
    // Utiliser la fonction utilitaire qui priorise le wallet connecté du contexte
    let sellerAddress = getSellerAddress();
    
    // Si c'est le vendeur actuel et qu'il a un wallet connecté, sauvegarder l'adresse dans le profil
    const isSeller = user.id === order.seller_id;
    if (isSeller && walletConnected && wallet && wallet.addressBech32) {
      sellerAddress = wallet.addressBech32;
      
      // Sauvegarder l'adresse dans le profil si ce n'est pas déjà fait
      if (sellerAddress && sellerAddress !== order.seller?.wallet_address) {
        try {
          await supabase
            .from('profiles')
            .update({ wallet_address: sellerAddress })
            .eq('id', user.id);
        } catch (error) {
          console.warn('Erreur lors de la sauvegarde de l\'adresse wallet:', error);
        }
      }
    }
    
    if (!sellerAddress) {
      toast.warning(
        'Wallet requis pour recevoir le paiement',
        'Vous devez connecter votre wallet Cardano pour recevoir le paiement de l\'acheteur. Connectez votre wallet depuis la barre de navigation, puis revenez accepter cette proposition.'
      );
      return;
    }
    
    setProcessing(true);
    try {
      const finalPrice = order.proposed_price || order.amount_ada;
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          final_price: finalPrice,
          amount_ada: finalPrice
        })
        .eq('id', id);

      if (error) throw error;

      // Envoyer un message automatique à l'acheteur
      await supabase
        .from('messages')
        .insert([{
          order_id: id!,
          sender_id: user.id,
          content: `Proposition acceptée ! Le prix final est de ${formatADA(finalPrice)} ADA. Vous pouvez maintenant procéder au paiement.`
        }]);

      toast.success('Proposition acceptée !', 'L\'acheteur a été notifié et peut maintenant payer.');
      fetchOrder();
    } catch (error: any) {
      console.error('Error accepting negotiation:', error);
      toast.error('Erreur', 'Impossible d\'accepter la proposition.');
    } finally {
      setProcessing(false);
    }
  };

  // Refuser la proposition de négociation (vendeur)
  const handleRejectNegotiation = async () => {
    if (!order || !user) return;
    
    if (!confirm('Êtes-vous sûr de vouloir refuser cette proposition ? L\'acheteur pourra en proposer une autre.')) {
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          escrow_status: 'cancelled',
          status: 'pending' // Rester en pending pour permettre une nouvelle proposition
        })
        .eq('id', id);

      if (error) throw error;

      // Envoyer un message automatique à l'acheteur
      await supabase
        .from('messages')
        .insert([{
          order_id: id!,
          sender_id: user.id,
          content: 'Proposition refusée. N\'hésitez pas à discuter avec moi dans le chat ou à proposer un nouveau prix !'
        }]);

      toast.info('Proposition refusée', 'L\'acheteur peut maintenant proposer un nouveau prix ou discuter avec vous.');
      fetchOrder();
    } catch (error: any) {
      console.error('Error rejecting negotiation:', error);
      toast.error('Erreur', 'Impossible de refuser la proposition.');
    } finally {
      setProcessing(false);
    }
  };

  // Payer après acceptation de la négociation (acheteur)
  const handlePayAfterNegotiation = async () => {
    if (!order || !user) return;
    
    // Vérifier que l'acheteur a un wallet connecté
    if (!walletConnected || !wallet) {
      toast.error('Wallet requis', 'Vous devez connecter un wallet Cardano pour effectuer le paiement. Connectez votre wallet depuis la barre de navigation.');
      return;
    }
    
    // Récupérer l'adresse du vendeur (utilise la fonction utilitaire qui priorise le wallet connecté)
    let sellerAddress = getSellerAddress();
    
    // Si l'adresse n'est pas trouvée, essayer de recharger l'ordre au cas où elle aurait été mise à jour
    if (!sellerAddress) {
      await fetchOrder();
      sellerAddress = getSellerAddress();
    }
    
    if (!sellerAddress) {
      toast.error(
        'Wallet vendeur requis',
        'Le vendeur doit connecter son wallet Cardano avant que vous puissiez effectuer un paiement. Veuillez informer le vendeur qu\'il doit connecter son wallet depuis la barre de navigation.'
      );
      return;
    }
    
    setProcessing(true);
    try {
      const priceToPay = order.final_price || order.proposed_price || order.amount_ada;
      
      // Préparer le paiement avec l'adresse du vendeur et Lucid
      const paymentPrep = await prepareAdaPayment(id!, priceToPay, sellerAddress || undefined, lucid || undefined);

      // Mettre à jour la commande : escrow ouvert
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'escrow_web2',
          escrow_hash: paymentPrep.txHash,
          escrow_status: 'open'
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Marquer le produit comme vendu (retirer du marché)
      if (order?.product_id) {
        const { error: productError } = await supabase
          .from('products')
          .update({ status: 'sold' })
          .eq('id', order.product_id);
        
        if (productError) {
          console.error('Error updating product status:', productError);
        } else {
          console.log('✅ Produit marqué comme vendu:', order.product_id);
        }
      }

      // Distribuer les WZP uniquement pour les transactions RÉELLES réussies
      if (paymentPrep.status === 'success' && !paymentPrep.txHash.startsWith('simulated_') && order?.buyer_id && order?.seller_id) {
        const wzpResult = await distributeWZPAfterTransaction(
          id!,
          order.buyer_id,
          order.seller_id,
          priceToPay
        );
        
        if (wzpResult.success && wzpResult.buyerWZP) {
          console.log(`✅ ${wzpResult.buyerWZP.toFixed(2)} WZP distribués pour cette transaction réelle`);
          toast.success('WZP distribués !', `${wzpResult.buyerWZP.toFixed(2)} WZP ont été attribués pour cette transaction.`);
        }
      }

      // Envoyer un message automatique au vendeur
      const priceInFC = convertADAToFC(priceToPay);
      await supabase
        .from('messages')
        .insert([{
          order_id: id!,
          sender_id: user.id,
          content: `Paiement effectué ! ${formatFC(priceInFC)} FC (≈ ${formatADA(priceToPay)} ADA) sont maintenant en escrow. Veuillez confirmer la commande.`
        }]);

      toast.success('Paiement effectué !', `Le vendeur a été notifié que ${formatFC(priceInFC)} FC sont en escrow.`);
      fetchOrder();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error('Erreur', 'Impossible de procéder au paiement.');
    } finally {
      setProcessing(false);
    }
  };

  // Proposer un nouveau prix après refus (acheteur)
  const handleProposeNewPrice = async () => {
    if (!order || !user) return;

    const proposedPriceFC = parseFloat(newNegotiatePriceFC);
    if (isNaN(proposedPriceFC) || proposedPriceFC <= 0) {
      toast.warning('Prix invalide', 'Veuillez entrer un prix valide.');
      return;
    }

    const currentPriceFC = order.products?.price_fc || convertADAToFC(order.amount_ada);
    if (proposedPriceFC >= currentPriceFC) {
      toast.warning('Prix invalide', 'Le prix proposé doit être inférieur au prix actuel.');
      return;
    }

    setNewNegotiating(true);

    try {
      // Calculer le prix proposé en ADA
      const proposedPriceADA = convertFCToADA(proposedPriceFC);

      // Mettre à jour la commande avec la nouvelle proposition (réinitialiser le refus)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          proposed_price: proposedPriceADA,
          amount_ada: proposedPriceADA,
          final_price: null, // Réinitialiser
          escrow_status: null, // Réinitialiser le refus
          status: 'pending' // Remettre en pending
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Envoyer un message automatique au vendeur
      await supabase
        .from('messages')
        .insert([{
          order_id: id!,
          sender_id: user.id,
          content: `Nouvelle proposition de prix : ${formatFC(proposedPriceFC)} FC (≈ ${formatADA(proposedPriceADA)} ADA)`
        }]);

      toast.success('Nouvelle proposition envoyée !', 'Le vendeur a été notifié de votre nouvelle proposition.');
      setShowNewNegotiationModal(false);
      setNewNegotiatePriceFC('');
      fetchOrder();
    } catch (error: any) {
      console.error('Error proposing new price:', error);
      toast.error('Erreur', error.message || 'Impossible d\'envoyer la nouvelle proposition.');
    } finally {
      setNewNegotiating(false);
    }
  };

  if (loading || !order) return <div className="text-center py-10">Chargement...</div>;

  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Colonne Gauche: Détails Commande */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
            <h1 className="text-2xl font-bold mb-4">Commande #{order.id.slice(0, 8)}</h1>
            
            {/* Steps Progress */}
            <div className="flex items-center justify-between mb-8 text-sm">
                <div className={`flex flex-col items-center ${['pending', 'escrow_web2', 'shipped', 'completed'].includes(order.status) ? 'text-primary' : 'text-gray-300'}`}>
                    <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white font-bold mb-1">1</div>
                    <span>Créée</span>
                </div>
                <div className={`h-1 flex-1 mx-2 ${['escrow_web2', 'shipped', 'completed'].includes(order.status) ? 'bg-primary' : 'bg-gray-200'}`} />
                
                <div className={`flex flex-col items-center ${['escrow_web2', 'shipped', 'completed'].includes(order.status) ? 'text-primary' : 'text-gray-300'}`}>
                    <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white font-bold mb-1">2</div>
                    <span>Escrow</span>
                </div>
                <div className={`h-1 flex-1 mx-2 ${['shipped', 'completed'].includes(order.status) ? 'bg-primary' : 'bg-gray-200'}`} />

                <div className={`flex flex-col items-center ${['shipped', 'completed'].includes(order.status) ? 'text-primary' : 'text-gray-300'}`}>
                    <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white font-bold mb-1">3</div>
                    <span>Confirmée</span>
                </div>
                <div className={`h-1 flex-1 mx-2 ${['completed'].includes(order.status) ? 'bg-primary' : 'bg-gray-200'}`} />

                <div className={`flex flex-col items-center ${['completed'].includes(order.status) ? 'text-primary' : 'text-gray-300'}`}>
                    <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white font-bold mb-1">4</div>
                    <span>Reçue</span>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex gap-4">
                <img src={order.products.image_url} className="w-20 h-20 object-cover rounded bg-white" />
                <div className="flex-1">
                    <h3 className="font-bold text-dark dark:text-white">{order.products.title}</h3>
                    
                    {/* Affichage du prix selon le mode */}
                    {order.order_mode === 'negotiation' ? (
                        <div className="space-y-1">
                            {order.final_price ? (
                                <p className="text-primary font-bold text-lg">
                                    {formatADA(order.final_price)} ADA
                                    {order.products?.price_fc && (
                                        <span className="text-sm text-gray-500 ml-2">
                                            (≈ {formatFC(convertADAToFC(order.final_price))} FC)
                                        </span>
                                    )}
                                </p>
                            ) : (
                                <div>
                                    <p className="text-primary font-bold">
                                        {formatADA(order.proposed_price || order.amount_ada)} ADA
                                        {order.products?.price_fc && (
                                            <span className="text-xs text-gray-500 ml-2">
                                                (proposé)
                                            </span>
                                        )}
                                    </p>
                                    {order.products?.price_fc && (
                                        <p className="text-xs text-gray-400 line-through">
                                            Prix initial: {formatFC(order.products.price_fc)} FC
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-primary font-bold">
                            {formatADA(order.amount_ada)} ADA
                            {order.products?.price_fc && (
                                <span className="text-sm text-gray-500 ml-2">
                                    (≈ {formatFC(convertADAToFC(order.amount_ada))} FC)
                                </span>
                            )}
                        </p>
                    )}
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Status: {order.status}
                        {order.order_mode === 'negotiation' && (
                            <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                                • Négociation
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Informations de Transaction */}
            {order.escrow_hash && order.escrow_hash !== '' && !order.escrow_hash.startsWith('simulated_') && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">
                                Transaction Blockchain
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Hash de transaction :</span>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded font-mono border border-gray-200 dark:border-gray-700">
                                            {order.escrow_hash.substring(0, 16)}...
                                        </code>
                                        <a
                                            href={`https://preprod.cardanoscan.io/transaction/${order.escrow_hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 text-xs font-medium"
                                        >
                                            Voir sur l'explorateur
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-start gap-1.5">
                                    <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span>Cette transaction devrait apparaître dans votre wallet sous peu. Si elle n'apparaît pas après quelques minutes, vérifiez l'explorateur Cardano ci-dessus.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions Zone */}
            <div className="mt-6 border-t pt-6">
                <h3 className="font-bold mb-4">Actions requises</h3>
                
                {/* Indicateur de flux de négociation - Timeline simple */}
                {order.order_mode === 'negotiation' && (
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm uppercase tracking-wide flex items-center gap-2">
                                <ClipboardList className="w-4 h-4" />
                                Flux de négociation
                            </h4>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs">
                            <div className={`flex flex-col items-center flex-1 ${order.proposed_price ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${
                                    order.proposed_price 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                }`}>
                                    1
                                </div>
                                <span className="text-center font-medium">Proposition envoyée</span>
                            </div>
                            <div className={`h-1 flex-1 ${order.proposed_price ? 'bg-blue-600' : 'bg-gray-200'}`} />
                            <div className={`flex flex-col items-center flex-1 ${
                                order.final_price 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : order.escrow_status === 'cancelled'
                                    ? 'text-red-600 dark:text-red-400'
                                    : order.proposed_price
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-400'
                            }`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${
                                    order.final_price
                                        ? 'bg-green-600 text-white'
                                        : order.escrow_status === 'cancelled'
                                        ? 'bg-red-600 text-white'
                                        : order.proposed_price
                                        ? 'bg-blue-600 text-white animate-pulse'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                }`}>
                                    {order.final_price ? '✓' : order.escrow_status === 'cancelled' ? '✗' : '2'}
                                </div>
                                <span className="text-center font-medium">
                                    {order.final_price 
                                        ? 'Acceptée ✓' 
                                        : order.escrow_status === 'cancelled'
                                        ? 'Refusée ✗'
                                        : 'En attente'}
                                </span>
                            </div>
                            <div className={`h-1 flex-1 ${order.final_price && order.escrow_status === 'open' ? 'bg-green-600' : order.final_price ? 'bg-gray-200' : 'bg-gray-200'}`} />
                            <div className={`flex flex-col items-center flex-1 ${
                                order.escrow_status === 'open' || order.status === 'escrow_web2'
                                    ? 'text-green-600 dark:text-green-400' 
                                    : order.final_price
                                    ? 'text-gray-400'
                                    : 'text-gray-400'
                            }`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${
                                    order.escrow_status === 'open' || order.status === 'escrow_web2'
                                        ? 'bg-green-600 text-white' 
                                        : order.final_price
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                }`}>
                                    3
                                </div>
                                <span className="text-center font-medium">Paiement</span>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Négociation en attente - Vendeur peut accepter/refuser */}
                {order.order_mode === 'negotiation' && 
                 order.status === 'pending' && 
                 order.proposed_price && 
                 !order.final_price && 
                 !order.escrow_status &&
                 isSeller && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-amber-300 dark:border-amber-700 shadow-lg">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-amber-900 dark:text-amber-100 text-lg mb-1 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" />
                                    Nouvelle proposition de prix
                                </h4>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    L'acheteur vous propose un nouveau prix. Décidez rapidement !
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl mb-5 border-2 border-amber-200 dark:border-amber-700 shadow-sm">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Prix proposé :</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {formatADA(order.proposed_price)} ADA
                                    </span>
                                </div>
                                {order.products?.price_fc && (
                                    <>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">En FC :</span>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                {formatFC(convertADAToFC(order.proposed_price))} FC
                                            </span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500">Prix initial :</span>
                                                <span className="line-through text-gray-400">
                                                    {formatFC(order.products.price_fc)} FC
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleRejectNegotiation}
                                disabled={processing}
                                className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-gray-700 border-2 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition font-semibold disabled:opacity-50 shadow-md"
                            >
                                <X className="w-6 h-6" />
                                <span>Refuser</span>
                            </button>
                            <button
                                onClick={handleAcceptNegotiation}
                                disabled={processing}
                                className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition font-semibold disabled:opacity-50 shadow-lg shadow-green-500/40 transform hover:scale-105 active:scale-95"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                        </svg>
                                        <span>Traitement...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-6 h-6" />
                                        <span>Accepter</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Négociation acceptée - Acheteur peut payer */}
                {order.order_mode === 'negotiation' && 
                 order.status === 'pending' && 
                 order.final_price && 
                 !order.escrow_status && 
                 isBuyer && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-lg">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 animate-bounce">
                                <CheckCircle className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-green-900 dark:text-green-100 text-lg mb-1 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Proposition acceptée !
                                </h4>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Excellent ! Le vendeur a accepté votre proposition. Procédez maintenant au paiement sécurisé.
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl mb-5 border-2 border-green-200 dark:border-green-700 shadow-sm">
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Montant à payer</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-primary">
                                        {formatADA(order.final_price)}
                                    </span>
                                    <span className="text-lg font-semibold text-primary">ADA</span>
                                </div>
                                {order.products?.price_fc && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        ≈ {formatFC(convertADAToFC(order.final_price))} FC
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Méthodes de paiement - Plus simples */}
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Choisissez votre méthode de paiement</p>
                            
                            {/* Option ADA - Bouton principal */}
                            <button
                                onClick={handlePayAfterNegotiation}
                                disabled={processing}
                                className="w-full flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:from-primary/90 hover:to-blue-600/90 transition font-semibold disabled:opacity-50 shadow-xl shadow-primary/40 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    {processing ? (
                                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                        </svg>
                                    ) : (
                                        <ShoppingCart className="w-6 h-6" />
                                    )}
                                    <span className="text-base">{processing ? 'Traitement du paiement...' : 'Payer avec ADA'}</span>
                                </div>
                                <span className="text-xs bg-white/30 px-3 py-1 rounded-full font-medium">Recommandé</span>
                            </button>

                            {/* Option Mobile Money */}
                            <button 
                                onClick={() => setShowMobileMoneyModal(true)}
                                className="w-full flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 text-gray-700 dark:text-gray-300 rounded-xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition cursor-pointer shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    <span className="text-base font-medium">Payer avec Mobile Money</span>
                                </div>
                                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    Bientôt disponible
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Négociation refusée - Acheteur peut proposer un nouveau prix */}
                {order.order_mode === 'negotiation' && 
                 order.escrow_status === 'cancelled' && (
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-red-300 dark:border-red-700 shadow-lg">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                                <X className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-red-900 dark:text-red-100 text-lg mb-2 flex items-center gap-2">
                                    <X className="w-5 h-5" />
                                    Proposition refusée
                                </h4>
                                <p className="text-sm text-red-700 dark:text-red-300 mb-1">
                                    Le vendeur n'a pas accepté cette proposition. Pas de problème, vous pouvez :
                                </p>
                                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 mt-2 list-disc list-inside">
                                    <li>Discuter avec le vendeur dans le chat ci-contre</li>
                                    <li>Proposer un nouveau prix en cliquant sur le bouton ci-dessous</li>
                                </ul>
                            </div>
                        </div>
                        
                        {isBuyer && (
                            <button
                                onClick={() => {
                                    const currentPriceFC = order.products?.price_fc || convertADAToFC(order.amount_ada);
                                    // Pré-remplir avec un prix légèrement inférieur à la dernière proposition refusée
                                    const lastProposedFC = order.proposed_price ? convertADAToFC(order.proposed_price) : currentPriceFC;
                                    const suggestedPrice = Math.max(1, Math.floor(lastProposedFC * 0.95)); // 5% de moins
                                    setNewNegotiatePriceFC(suggestedPrice.toString());
                                    setShowNewNegotiationModal(true);
                                }}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:from-primary/90 hover:to-blue-600/90 transition font-semibold shadow-xl shadow-primary/40 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <RotateCcw className="w-6 h-6" />
                                <span>Envoyer une nouvelle proposition</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Escrow ouvert - Vendeur peut confirmer */}
                {order.status === 'escrow_web2' && isSeller && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3 mb-4">
                            <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                                    Argent en escrow
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                    L'acheteur a payé. Les fonds sont sécurisés en escrow. Confirmez que vous avez accepté cette transaction.
                                </p>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Montant en escrow :</span>
                                        <span className="text-lg font-bold text-primary">
                                            {formatADA(order.final_price || order.amount_ada)} ADA
                                        </span>
                                    </div>
                                    {order.escrow_hash && (
                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">Transaction :</span>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                                        {order.escrow_hash.substring(0, 16)}...
                                                    </code>
                                                    {order.escrow_hash && !order.escrow_hash.startsWith('simulated_') && (
                                                        <a
                                                            href={`https://preprod.cardanoscan.io/transaction/${order.escrow_hash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-xs"
                                                        >
                                                            Voir
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Cette transaction devrait apparaître dans votre wallet sous peu. Si elle n'apparaît pas, vérifiez l'explorateur.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => updateStatus('shipped')} 
                            className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition font-medium"
                        >
                            Confirmer la commande
                        </button>
                    </div>
                )}

                {/* Commande confirmée - Acheteur peut confirmer réception */}
                {order.status === 'shipped' && isBuyer && (
                    <div className="bg-violet-50 dark:bg-violet-900/20 p-5 rounded-xl border-2 border-violet-200 dark:border-violet-800">
                        <div className="flex items-start gap-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h4 className="font-bold text-violet-900 dark:text-violet-100 mb-1">
                                    Commande confirmée
                                </h4>
                                <p className="text-sm text-violet-700 dark:text-violet-300">
                                    Le vendeur a confirmé avoir accepté votre commande. Confirmez la réception pour libérer les fonds en escrow.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => updateStatus('completed')} 
                            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-medium shadow-lg shadow-green-500/30"
                        >
                            Confirmer la réception (Libérer Escrow)
                        </button>
                    </div>
                )}

                {/* Commande terminée */}
                {order.status === 'completed' && (
                    <div className="text-center p-5 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <p className="font-semibold text-green-900 dark:text-green-100">
                            Commande terminée
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Les fonds ont été libérés.
                        </p>
                    </div>
                )}
                
                {/* En attente de paiement (mode direct) */}
                {order.status === 'pending' && 
                 order.order_mode === 'direct' && (
                    <div className="text-center p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400">
                            En attente de paiement Escrow (étape automatique).
                        </p>
                    </div>
                )}

                {/* En attente de réponse du vendeur (acheteur) */}
                {order.order_mode === 'negotiation' && 
                 order.status === 'pending' && 
                 order.proposed_price && 
                 !order.final_price && 
                 !order.escrow_status &&
                 isBuyer && (
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-6 rounded-xl border-2 border-amber-300 dark:border-amber-700 shadow-lg">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <Clock className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-amber-900 dark:text-amber-100 text-lg mb-2 flex items-center gap-2">
                                    <Hourglass className="w-5 h-5" />
                                    En attente de réponse
                                </h4>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                                    Votre proposition de <strong>{formatADA(order.proposed_price)} ADA</strong> a été envoyée au vendeur. 
                                    Il examinera votre offre et vous répondra bientôt.
                                </p>
                                <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg border border-amber-200 dark:border-amber-700">
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-start gap-1.5">
                                        <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                        <span>Astuce : Vous pouvez discuter avec le vendeur dans le chat pour négocier davantage !</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Colonne Droite: Chat */}
      <div className="lg:col-span-1">
        <ChatBox 
          orderId={id!} 
          order={order}
          onProposeNewPrice={
            order?.order_mode === 'negotiation' && 
            order?.escrow_status === 'cancelled' && 
            isBuyer
              ? () => {
                  const currentPriceFC = order.products?.price_fc || convertADAToFC(order.amount_ada);
                  const lastProposedFC = order.proposed_price ? convertADAToFC(order.proposed_price) : currentPriceFC;
                  const suggestedPrice = Math.max(1, Math.floor(lastProposedFC * 0.95));
                  setNewNegotiatePriceFC(suggestedPrice.toString());
                  setShowNewNegotiationModal(true);
                }
              : undefined
          }
        />
        
        <div className="mt-6 card bg-gray-50">
            <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">Détails techniques (Simulés)</h3>
            <div className="space-y-2 text-xs text-gray-600 break-all">
                <p><strong>Order ID:</strong> {order.id}</p>
                <p><strong>Escrow Hash:</strong> {order.escrow_hash || 'Pending...'}</p>
                <p><strong>Buyer:</strong> {order.buyer.wallet_address || 'Not connected'}</p>
                <p><strong>Seller:</strong> {order.seller.wallet_address || 'Not connected'}</p>
            </div>
        </div>
      </div>

      {/* Modal de nouvelle proposition après refus */}
      {showNewNegotiationModal && order && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !newNegotiating) {
              setShowNewNegotiationModal(false);
            }
          }}
          style={{ 
            overscrollBehavior: 'contain',
            touchAction: 'none'
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden shadow-2xl animate-slide-up sm:animate-scale-in mx-auto flex flex-col"
            style={{ 
              maxHeight: '90vh',
              maxWidth: '100vw'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag indicator (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header - Fixed */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-dark dark:text-white text-lg">Nouvelle proposition</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Proposez un nouveau prix</p>
                </div>
              </div>
              <button 
                onClick={() => !newNegotiating && setShowNewNegotiationModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                disabled={newNegotiating}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 space-y-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {/* Product Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Produit</p>
                <p className="font-semibold text-dark dark:text-white text-base">{order.products?.title}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-primary">
                    {order.products?.price_fc ? formatFC(order.products.price_fc) : formatFC(convertADAToFC(order.amount_ada))}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">FC</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    (≈ {formatADA(order.amount_ada)} ADA)
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Prix actuel du vendeur</p>
              </div>

              {/* Previous proposal info */}
              {order.proposed_price && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-red-700 dark:text-red-300 mb-1.5 font-medium">Proposition précédente (refusée)</p>
                      <p className="text-base font-bold text-red-900 dark:text-red-100">
                        {formatADA(order.proposed_price)} ADA
                        {order.products?.price_fc && (
                          <span className="text-sm text-red-600 dark:text-red-400 ml-2 font-medium">
                            (≈ {formatFC(convertADAToFC(order.proposed_price))} FC)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Price Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Votre nouvelle proposition (FC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newNegotiatePriceFC}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                        setNewNegotiatePriceFC(value);
                      }
                    }}
                    disabled={newNegotiating}
                    min="0"
                    step="100"
                    className="w-full px-4 py-3.5 pr-16 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition outline-none text-lg font-semibold text-dark dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Entrez votre prix"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">FC</span>
                </div>
                {newNegotiatePriceFC && !isNaN(parseFloat(newNegotiatePriceFC)) && parseFloat(newNegotiatePriceFC) > 0 && (
                  <div className="mt-3 p-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4 text-primary" />
                        <span>Équivalent en ADA :</span>
                      </span>
                      <span className="font-bold text-primary text-base">
                        {formatADA(convertFCToADA(parseFloat(newNegotiatePriceFC)))} ADA
                      </span>
                    </p>
                  </div>
                )}
                
                {/* Discount calculation */}
                {newNegotiatePriceFC && !isNaN(parseFloat(newNegotiatePriceFC)) && (
                  (() => {
                    const proposed = parseFloat(newNegotiatePriceFC);
                    const current = order.products?.price_fc || convertADAToFC(order.amount_ada);
                    const discount = current - proposed;
                    const discountPercent = ((discount / current) * 100).toFixed(0);
                    if (proposed < current && proposed > 0) {
                      return (
                        <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-0.5">Réduction</p>
                              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                {formatFC(discount)} FC
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-0.5">Pourcentage</p>
                              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                -{discountPercent}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    } else if (proposed >= current) {
                      return (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              Le prix proposé doit être <strong>inférieur</strong> au prix actuel ({formatFC(current)} FC) pour pouvoir négocier.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
              </div>

              {/* Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-2">Conseil</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      Après discussion avec le vendeur dans le chat, vous pouvez proposer un nouveau prix. Le vendeur pourra l'accepter ou le refuser. N'hésitez pas à négocier !
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowNewNegotiationModal(false)}
                disabled={newNegotiating}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleProposeNewPrice}
                disabled={newNegotiating || !newNegotiatePriceFC || isNaN(parseFloat(newNegotiatePriceFC)) || parseFloat(newNegotiatePriceFC) <= 0 || (order.products?.price_fc && parseFloat(newNegotiatePriceFC) >= order.products.price_fc) || (!order.products?.price_fc && parseFloat(newNegotiatePriceFC) >= convertADAToFC(order.amount_ada))}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:from-primary/90 hover:to-blue-600/90 active:scale-[0.98] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
              >
                {newNegotiating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Envoi...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5" />
                    Envoyer la proposition
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Mobile Money - Opérateurs disponibles à Goma */}
      {showMobileMoneyModal && (
        <div className="fixed bottom-4 left-1/2 z-[100] animate-slide-up-toast">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 p-5 max-w-md w-[calc(100vw-2rem)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-bold text-dark dark:text-white text-sm">Mobile Money - Bientôt disponible</h3>
              </div>
              <button 
                onClick={() => setShowMobileMoneyModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Grille de carreaux - Opérateurs */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* M-Pesa */}
              <div className="relative group bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-xl p-4 cursor-not-allowed overflow-hidden shadow-lg border-2 border-green-400/30 aspect-square flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-md">
                    <svg viewBox="0 0 100 100" className="w-10 h-10">
                      <rect x="20" y="25" width="15" height="45" rx="2" fill="white"/>
                      <rect x="42" y="25" width="15" height="45" rx="2" fill="white"/>
                      <path d="M 62 25 L 75 45 L 62 65 L 62 50 L 57 50 L 57 40 L 62 40 Z" fill="white"/>
                      <circle cx="50" cy="75" r="3" fill="white"/>
                    </svg>
                  </div>
                  <p className="font-bold text-white text-xs text-center">M-Pesa</p>
                  <span className="absolute top-2 right-2 text-[10px] bg-amber-400/90 text-white px-2 py-0.5 rounded-full font-semibold">
                    Bientôt
                  </span>
                </div>
              </div>

              {/* Airtel Money */}
              <div className="relative group bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-xl p-4 cursor-not-allowed overflow-hidden shadow-lg border-2 border-red-400/30 aspect-square flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-md">
                    <svg viewBox="0 0 100 100" className="w-10 h-10">
                      <path d="M 30 70 L 50 30 L 70 70 L 62 70 L 50 45 L 38 70 Z" fill="white"/>
                      <rect x="52" y="50" width="15" height="20" rx="2" fill="white"/>
                    </svg>
                  </div>
                  <p className="font-bold text-white text-xs text-center">Airtel</p>
                  <span className="absolute top-2 right-2 text-[10px] bg-amber-400/90 text-white px-2 py-0.5 rounded-full font-semibold">
                    Bientôt
                  </span>
                </div>
              </div>

              {/* Orange Money */}
              <div className="relative group bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-xl p-4 cursor-not-allowed overflow-hidden shadow-lg border-2 border-orange-400/30 aspect-square flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-md">
                    <svg viewBox="0 0 100 100" className="w-10 h-10">
                      <circle cx="50" cy="50" r="25" fill="none" stroke="white" strokeWidth="6"/>
                      <circle cx="50" cy="50" r="15" fill="white" opacity="0.3"/>
                    </svg>
                  </div>
                  <p className="font-bold text-white text-xs text-center">Orange</p>
                  <span className="absolute top-2 right-2 text-[10px] bg-amber-400/90 text-white px-2 py-0.5 rounded-full font-semibold">
                    Bientôt
                  </span>
                </div>
              </div>

              {/* Africell Money */}
              <div className="relative group bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl p-4 cursor-not-allowed overflow-hidden shadow-lg border-2 border-blue-400/30 aspect-square flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-md">
                    <svg viewBox="0 0 100 100" className="w-10 h-10">
                      <path d="M 35 70 L 50 35 L 65 70 L 57 70 L 50 50 L 43 70 Z" fill="white"/>
                      <circle cx="50" cy="60" r="3" fill="white"/>
                    </svg>
                  </div>
                  <p className="font-bold text-white text-xs text-center">Africell</p>
                  <span className="absolute top-2 right-2 text-[10px] bg-amber-400/90 text-white px-2 py-0.5 rounded-full font-semibold">
                    Bientôt
                  </span>
                </div>
              </div>
            </div>

            {/* Message info */}
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Disponible prochainement à Goma
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderDetail;


