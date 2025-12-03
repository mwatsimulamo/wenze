import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { prepareAdaPayment } from '../blockchain/prepareAdaPayment';
import { convertADAToFC, convertFCToADA, formatFC, formatADA } from '../utils/currencyConverter';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Star, 
  Shield, 
  ShoppingCart,
  CheckCircle,
  MessageCircle,
  Share2,
  Heart,
  ChevronRight,
  Phone,
  Mail,
  X,
  Wrench,
  Edit,
  Trash2,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  DollarSign,
  MessageSquare,
  Smartphone,
  Clock as ClockIcon
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price_ada: number; // Prix historique en ADA (utilisé seulement pour rétrocompatibilité)
  price_fc?: number; // Prix fixe en FC (prioritaire si disponible)
  image_url: string;
  seller_id: string;
  status: string;
  category: string;
  location: string;
  fashion_type?: string;
  size?: string;
  shoe_number?: string;
  contact_whatsapp?: string;
  contact_email?: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
    reputation_score: number;
    is_verified: boolean;
  };
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const NO_ESCROW_CATEGORIES = ['service', 'real_estate', 'auto'];
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sellerProductsCount, setSellerProductsCount] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sellerEmail, setSellerEmail] = useState<string | null>(null);
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [negotiatePriceFC, setNegotiatePriceFC] = useState<string>('');
  const [negotiating, setNegotiating] = useState(false);

  // Fonction helper pour obtenir le prix en FC (fixe)
  const getPriceInFC = (product: Product): number => {
    return product.price_fc || convertADAToFC(product.price_ada);
  };

  // Fonction helper pour calculer le prix en ADA depuis le FC (taux actuel)
  const getCurrentPriceInADA = (product: Product): number => {
    const priceInFC = getPriceInFC(product);
    return convertFCToADA(priceInFC);
  };

  useEffect(() => {
    if (id) fetchProduct(id);
  }, [id]);

  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (showNegotiateModal) {
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
  }, [showNegotiateModal]);

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles:seller_id(username, full_name, avatar_url, reputation_score, is_verified, email)')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);

      // Fetch seller's other products count and email
      if (data?.seller_id) {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', data.seller_id)
          .eq('status', 'available');
        setSellerProductsCount(count || 0);

        // Get seller email if available
        if (data.profiles?.email) {
          setSellerEmail(data.profiles.email);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!product) return;

    if (user.id === product.seller_id) {
      toast.warning('Action impossible', 'Vous ne pouvez pas acheter votre propre produit !');
      return;
    }

    setProcessing(true);

    try {
      // Calculer le prix en ADA depuis le FC avec le taux actuel
      const currentPriceInADA = getCurrentPriceInADA(product);
      const priceInFC = getPriceInFC(product);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          buyer_id: user.id,
          seller_id: product.seller_id,
          product_id: product.id,
          amount_ada: currentPriceInADA, // Prix en ADA calculé depuis le FC au moment de la commande
          status: 'pending',
          order_mode: 'direct'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const paymentPrep = await prepareAdaPayment(orderData.id, currentPriceInADA);

      await supabase
        .from('orders')
        .update({ status: 'escrow_web2', escrow_hash: paymentPrep.txHash })
        .eq('id', orderData.id);
      
      await supabase
        .from('products')
        .update({ status: 'sold' })
        .eq('id', product.id);

      toast.success('Commande créée !', 'Vos fonds sont sécurisés en Escrow. Bon achat !');
      navigate('/orders');

    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erreur', 'Une erreur est survenue lors de la commande.');
    } finally {
      setProcessing(false);
    }
  };

  const handleStartNegotiation = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!product) return;
    
    if (user.id === product.seller_id) {
      toast.warning('Action impossible', 'Vous ne pouvez pas négocier votre propre produit !');
      return;
    }

    const currentPriceFC = getPriceInFC(product);
    setNegotiatePriceFC(currentPriceFC.toString());
    setShowNegotiateModal(true);
  };

  const handleSubmitNegotiation = async () => {
    if (!user || !product) return;

    const proposedPriceFC = parseFloat(negotiatePriceFC);
    if (isNaN(proposedPriceFC) || proposedPriceFC <= 0) {
      toast.warning('Prix invalide', 'Veuillez entrer un prix valide.');
      return;
    }

    const currentPriceFC = getPriceInFC(product);
    if (proposedPriceFC >= currentPriceFC) {
      toast.warning('Prix invalide', 'Le prix proposé doit être inférieur au prix actuel.');
      return;
    }

    setNegotiating(true);

    try {
      // Calculer le prix proposé en ADA
      const proposedPriceADA = convertFCToADA(proposedPriceFC);

      // Créer une commande en mode négociation
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          buyer_id: user.id,
          seller_id: product.seller_id,
          product_id: product.id,
          amount_ada: proposedPriceADA,
          status: 'pending',
          order_mode: 'negotiation',
          proposed_price: proposedPriceADA,
          escrow_status: null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Envoyer un message automatique au vendeur
      await supabase
        .from('messages')
        .insert([{
          order_id: orderData.id,
          sender_id: user.id,
          content: `💰 Nouvelle proposition de prix : ${formatFC(proposedPriceFC)} FC (≈ ${formatADA(proposedPriceADA)} ADA)`
        }]);

      toast.success('Proposition envoyée !', 'Le vendeur a été notifié de votre proposition.');
      setShowNegotiateModal(false);
      navigate(`/orders/${orderData.id}`);

    } catch (error: any) {
      console.error('Error starting negotiation:', error);
      toast.error('Erreur', error.message || 'Impossible de créer la proposition de négociation.');
    } finally {
      setNegotiating(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!product || !user || user.id !== product.seller_id) return;

    setDeleting(true);
    
    try {
      // 1. Récupérer toutes les commandes liées à ce produit
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('product_id', product.id);

      if (ordersError) throw ordersError;

      const orderIds = ordersData?.map(o => o.id) || [];

      // 2. Supprimer les messages liés aux commandes
      if (orderIds.length > 0) {
        // Supprimer les messages
        const { error: messagesError } = await supabase
          .from('messages')
          .delete()
          .in('order_id', orderIds);

        if (messagesError) console.warn('Error deleting messages:', messagesError);

        // Supprimer les ratings
        const { error: ratingsError } = await supabase
          .from('ratings')
          .delete()
          .in('order_id', orderIds);

        if (ratingsError) console.warn('Error deleting ratings:', ratingsError);

        // Supprimer les commandes
        const { error: ordersDeleteError } = await supabase
          .from('orders')
          .delete()
          .in('id', orderIds);

        if (ordersDeleteError) console.warn('Error deleting orders:', ordersDeleteError);
      }

      // 3. Supprimer le produit lui-même
      const { data: deletedProduct, error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)
        .eq('seller_id', user.id) // Double sécurité
        .select();

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Vérifier que le produit a bien été supprimé
      if (!deletedProduct || deletedProduct.length === 0) {
        console.error('Product was not deleted. Check RLS policies.');
        throw new Error('La suppression a échoué. Vérifiez vos permissions.');
      }

      console.log('Product successfully deleted:', deletedProduct);

      toast.success('Produit supprimé', 'Le produit a été supprimé définitivement.');
      
      // Fermer le modal
      setShowDeleteModal(false);
      setDeleting(false);
      
      // Vérifier à nouveau que le produit n'existe plus
      const { data: verifyDelete, error: verifyError } = await supabase
        .from('products')
        .select('id')
        .eq('id', product.id)
        .single();

      if (verifyDelete) {
        console.warn('Product still exists after deletion. This might be a cache issue.');
        toast.warning('Attention', 'Le produit pourrait encore apparaître quelques instants. Rafraîchissez la page.');
      }

      // Attendre un peu pour que la suppression soit bien propagée
      setTimeout(() => {
        navigate('/products', { replace: true });
      }, 500);
      
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setDeleting(false);
      
      // Messages d'erreur spécifiques selon le type d'erreur
      let errorMessage = 'Impossible de supprimer le produit. Réessayez.';
      
      if (error.code === 'PGRST301' || error.code === '42501') {
        errorMessage = 'Permission refusée. Vérifiez les politiques RLS dans Supabase.';
      } else if (error.code === '23503') {
        errorMessage = 'Le produit ne peut pas être supprimé car il est lié à d\'autres données.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Erreur de suppression', errorMessage);
      setShowDeleteModal(false);
      
      // Afficher plus de détails dans la console
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-dark mb-2">Produit introuvable</h2>
        <Link to="/products" className="text-primary hover:underline">
          Retour au marché
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-1 sm:px-0">
      {/* Back Button */}
      <Link 
        to="/products" 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-dark mb-4 sm:mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au marché
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Image Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 aspect-square">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.title} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                Pas d'image
              </div>
            )}
          </div>

          {/* Quick Actions Mobile */}
          <div className="flex gap-2 lg:hidden">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-gray-600 font-medium">
              <Heart className="w-5 h-5" />
              Favoris
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-gray-600 font-medium">
              <Share2 className="w-5 h-5" />
              Partager
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-5 sm:space-y-6">
          {/* Title & Meta */}
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Clock className="w-4 h-4" />
              <span>Publié le {formatDate(product.created_at)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">
              {product.title}
            </h1>
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-4 h-4" />
              <span>{product.location || 'Goma, RDC'}</span>
            </div>
          </div>

          {/* Price */}
          <div className="bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-2xl p-5 sm:p-6 border border-primary/10">
            <div className="mb-2">
              {(() => {
                const priceInFC = getPriceInFC(product);
                const priceInADA = getCurrentPriceInADA(product);
                return (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl sm:text-5xl font-bold text-dark">
                        {formatFC(priceInFC)}
                      </span>
                      <span className="text-xl text-gray-400">FC</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>≈ {formatADA(priceInADA)} ADA</span>
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Temps réel
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
            {product.category === 'fashion' && (
              <>
                {product.fashion_type === 'habit' && product.size && (
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg text-sm font-medium text-dark">
                      <span className="text-gray-500">Taille:</span>
                      <span className="font-bold text-primary">{product.size}</span>
                    </span>
                  </div>
                )}
                {product.fashion_type === 'soulier' && product.shoe_number && (
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg text-sm font-medium text-dark">
                      <span className="text-gray-500">Numéro:</span>
                      <span className="font-bold text-primary">{product.shoe_number}</span>
                    </span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Shield className="w-4 h-4" />
              <span>Protection Escrow garantie</span>
            </div>
          </div>

          {/* Seller Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Vendeur</p>
            
            <Link 
              to={`/seller/${product.seller_id}`}
              className="flex items-center gap-3 group"
            >
              {product.profiles?.avatar_url ? (
                <img 
                  src={product.profiles.avatar_url} 
                  alt={product.profiles.full_name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-lg font-bold">
                  {product.profiles?.full_name?.charAt(0) || 'V'}
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-dark group-hover:text-primary transition">
                    {product.profiles?.full_name || 'Vendeur'}
                  </p>
                  {product.profiles?.is_verified && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {product.profiles?.reputation_score || 0} pts
                  </span>
                  <span>{sellerProductsCount} produits</span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition" />
            </Link>

            <Link
              to={`/seller/${product.seller_id}`}
              className="block mt-4 text-center py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Voir la boutique
            </Link>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-dark mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-4 sm:static bg-white sm:bg-transparent p-4 sm:p-0 -mx-4 sm:mx-0 border-t sm:border-0 border-gray-100">
            {/* Boutons Modifier/Supprimer pour le propriétaire */}
            {user && user.id === product.seller_id && (
              <div className="flex gap-3 mb-4">
                <Link
                  to={`/products/${product.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </Link>
                <button
                  onClick={handleDeleteClick}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            )}

            {product.status === 'available' ? (
              NO_ESCROW_CATEGORIES.includes(product.category) ? (
                // Catégories sans escrow - Bouton Contact
                <>
                  <button 
                    onClick={() => setShowContactModal(true)}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 active:scale-[0.98] transition-all text-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contacter le vendeur
                  </button>
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-amber-600 bg-amber-50 py-2 rounded-xl">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Contact direct - Pas d'escrow</span>
                  </div>
                </>
              ) : (
                // Catégories avec escrow - Boutons Acheter et Négocier
                <>
                  {/* Bouton Négocier */}
                  <button 
                    onClick={handleStartNegotiation}
                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary font-semibold py-4 rounded-xl sm:rounded-2xl hover:bg-primary/5 active:scale-[0.98] transition-all mb-4"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Négocier le prix
                  </button>

                  {/* Méthodes de paiement */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Méthode de paiement</p>
                    
                    {/* Option ADA */}
                    <button 
                      onClick={handleBuy}
                      disabled={processing}
                      className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold py-4 px-4 rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        {processing ? (
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        ) : (
                          <ShoppingCart className="w-5 h-5" />
                        )}
                        <span>{processing ? 'Traitement...' : 'Payer avec ADA'}</span>
                      </div>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-lg font-medium">Disponible</span>
                    </button>

                    {/* Option Mobile Money */}
                    <div className="relative">
                      <button 
                        disabled
                        className="w-full flex items-center justify-between gap-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold py-4 px-4 rounded-xl sm:rounded-2xl cursor-not-allowed opacity-60"
                      >
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5" />
                          <span>Payer avec Mobile Money</span>
                        </div>
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg font-medium flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          Vient bientôt
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Paiement sécurisé
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Escrow garanti
                    </span>
                  </div>
                </>
              )
            ) : (
              <button 
                disabled 
                className="w-full py-4 bg-gray-200 text-gray-500 font-semibold rounded-xl sm:rounded-2xl cursor-not-allowed"
              >
                Produit indisponible
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contact Modal for Non-Escrow Categories */}
      {showContactModal && product && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowContactModal(false)}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm overflow-hidden shadow-2xl animate-slide-up sm:animate-scale-in mx-auto">
            {/* Drag indicator (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Compact Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                {product.profiles?.avatar_url ? (
                  <img 
                    src={product.profiles.avatar_url} 
                    alt=""
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-green-100"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                    {product.profiles?.full_name?.charAt(0) || 'V'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-dark text-sm">{product.profiles?.full_name || 'Vendeur'}</p>
                  <p className="text-xs text-gray-400">Prestataire</p>
                </div>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Service Quick Info */}
            <div className="px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <p className="text-xs text-gray-500 mb-0.5">Service</p>
              <p className="font-medium text-dark text-sm line-clamp-1">{product.title}</p>
              <p className="text-green-600 font-bold text-lg">
                {formatFC(getPriceInFC(product))} FC
                <span className="text-xs font-normal text-gray-500 ml-1">
                  (≈ {formatADA(getCurrentPriceInADA(product))} ADA)
                </span>
              </p>
            </div>

            {/* Contact Buttons */}
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-500 text-center mb-3">
                Choisissez votre moyen de contact préféré
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp Button */}
                {product.contact_whatsapp && (
                  <a
                    href={`https://wa.me/${product.contact_whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `👋 Bonjour ${product.profiles?.full_name || ''}!\n\n` +
                      `Je vous contacte depuis Wenze concernant:\n` +
                      `📌 "${product.title}"\n` +
                      `💰 Prix: ${formatFC(getPriceInFC(product))} FC (≈ ${formatADA(getCurrentPriceInADA(product))} ADA)\n\n` +
                      `Je souhaiterais avoir plus d'informations. Merci!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 bg-green-500 hover:bg-green-600 rounded-2xl transition-all active:scale-95 shadow-lg shadow-green-500/30"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <span className="text-white font-semibold text-sm">WhatsApp</span>
                  </a>
                )}

                {/* Email Button */}
                {(product.contact_email || sellerEmail) && (
                  <a
                    href={`mailto:${product.contact_email || sellerEmail}?subject=${encodeURIComponent(
                      `[Wenze] Demande pour: ${product.title}`
                    )}&body=${encodeURIComponent(
                      `Bonjour ${product.profiles?.full_name || ''},\n\n` +
                      `Je vous contacte via la plateforme Wenze concernant:\n\n` +
                      `📌 "${product.title}"\n` +
                      `💰 Prix: ${formatFC(getPriceInFC(product))} FC (≈ ${formatADA(getCurrentPriceInADA(product))} ADA)\n\n` +
                      `Je souhaiterais avoir plus d'informations. Merci de votre retour!\n\n` +
                      `Cordialement`
                    )}`}
                    className="flex flex-col items-center gap-2 p-4 bg-blue-500 hover:bg-blue-600 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/30"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Mail className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-white font-semibold text-sm">Email</span>
                  </a>
                )}
              </div>

              {/* View Profile Link */}
              <Link
                to={`/seller/${product.seller_id}`}
                onClick={() => setShowContactModal(false)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-600 font-medium text-sm"
              >
                <Star className="w-4 h-4" />
                Voir le profil du vendeur
              </Link>

              {/* Warning */}
              <p className="text-[10px] text-center text-amber-600 bg-amber-50 py-2 px-3 rounded-lg">
                ⚠️ Service sans protection escrow - Vérifiez la fiabilité du prestataire
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de négociation */}
      {showNegotiateModal && product && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !negotiating) {
              setShowNegotiateModal(false);
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
                  <h3 className="font-bold text-dark dark:text-white text-lg">Négocier le prix</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Proposez votre prix</p>
                </div>
              </div>
              <button 
                onClick={() => !negotiating && setShowNegotiateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                disabled={negotiating}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 space-y-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {/* Product Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Produit</p>
                <p className="font-semibold text-dark dark:text-white text-base">{product.title}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-primary">
                    {formatFC(getPriceInFC(product))}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">FC</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    (≈ {formatADA(getCurrentPriceInADA(product))} ADA)
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Prix actuel du vendeur</p>
              </div>

              {/* Price Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Votre proposition (FC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={negotiatePriceFC}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                        setNegotiatePriceFC(value);
                      }
                    }}
                    disabled={negotiating}
                    min="0"
                    step="100"
                    className="w-full px-4 py-3.5 pr-16 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition outline-none text-lg font-semibold text-dark dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Entrez votre prix"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">FC</span>
                </div>
                {negotiatePriceFC && !isNaN(parseFloat(negotiatePriceFC)) && parseFloat(negotiatePriceFC) > 0 && (
                  <div className="mt-3 p-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4 text-primary" />
                        <span>Équivalent en ADA :</span>
                      </span>
                      <span className="font-bold text-primary text-base">
                        {formatADA(convertFCToADA(parseFloat(negotiatePriceFC)))} ADA
                      </span>
                    </p>
                  </div>
                )}
                
                {/* Discount calculation */}
                {negotiatePriceFC && !isNaN(parseFloat(negotiatePriceFC)) && (
                  (() => {
                    const proposed = parseFloat(negotiatePriceFC);
                    const current = getPriceInFC(product);
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
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-2">Comment ça marche ?</p>
                    <ul className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></span>
                        <span>Vous proposez votre prix au vendeur</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></span>
                        <span>Le vendeur peut accepter ou refuser votre proposition</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></span>
                        <span>Si accepté, vous paierez et l'argent sera sécurisé en escrow</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></span>
                        <span>Le vendeur sera notifié automatiquement</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowNegotiateModal(false)}
                disabled={negotiating}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitNegotiation}
                disabled={negotiating || !negotiatePriceFC || isNaN(parseFloat(negotiatePriceFC)) || parseFloat(negotiatePriceFC) <= 0 || parseFloat(negotiatePriceFC) >= getPriceInFC(product)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:from-primary/90 hover:to-blue-600/90 active:scale-[0.98] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
              >
                {negotiating ? (
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

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && product && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && !deleting && setShowDeleteModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-dark">Supprimer le produit</h3>
                  <p className="text-sm text-gray-500 mt-1">Action irréversible</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer ce produit ?
                </p>
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="font-semibold text-amber-800 text-sm mb-1">{product.title}</p>
                  <p className="text-amber-700 text-xs">
                    Cette action supprimera définitivement le produit et toutes les données associées.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>
                  Les commandes en cours, messages et avis liés à ce produit seront également supprimés.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Supprimer définitivement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

