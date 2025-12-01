import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle, 
  ShoppingBag,
  ArrowRight,
  Filter
} from 'lucide-react';

const Orders = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all');

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products:product_id(title, image_url),
          buyer:buyer_id(full_name, avatar_url),
          seller:seller_id(full_name, avatar_url)
        `)
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          label: 'En attente', 
          color: 'bg-amber-50 text-amber-600 border-amber-200',
          icon: Clock
        };
      case 'escrow_web2':
        return { 
          label: 'Fonds bloqués', 
          color: 'bg-blue-50 text-blue-600 border-blue-200',
          icon: Package
        };
      case 'shipped':
        return { 
          label: 'Expédié', 
          color: 'bg-violet-50 text-violet-600 border-violet-200',
          icon: Truck
        };
      case 'completed':
        return { 
          label: 'Terminé', 
          color: 'bg-green-50 text-green-600 border-green-200',
          icon: CheckCircle
        };
      case 'disputed':
        return { 
          label: 'Litige', 
          color: 'bg-red-50 text-red-600 border-red-200',
          icon: AlertCircle
        };
      default:
        return { 
          label: status, 
          color: 'bg-gray-50 text-gray-600 border-gray-200',
          icon: Package
        };
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'buyer') return order.buyer_id === user?.id;
    if (filter === 'seller') return order.seller_id === user?.id;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Skeleton loader
  const OrderSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 rounded-full w-3/4" />
          <div className="h-4 bg-gray-200 rounded-full w-1/2" />
          <div className="h-4 bg-gray-200 rounded-full w-1/4" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark dark:text-white">{t('orders.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{orders.length} {t('orders.title') === 'Mes Commandes' ? `commande${orders.length !== 1 ? 's' : ''} au total` : `agizo${orders.length !== 1 ? 's' : ''} jumla`}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all' ? 'bg-white shadow text-dark' : 'text-gray-500 hover:text-dark'
            }`}
          >
            {t('orders.title') === 'Mes Commandes' ? 'Toutes' : 'Zote'}
          </button>
          <button
            onClick={() => setFilter('buyer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'buyer' ? 'bg-white dark:bg-gray-800 shadow text-dark dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-dark dark:hover:text-white'
            }`}
          >
            {t('orders.title') === 'Mes Commandes' ? 'Achats' : 'Kununua'}
          </button>
          <button
            onClick={() => setFilter('seller')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'seller' ? 'bg-white dark:bg-gray-800 shadow text-dark dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-dark dark:hover:text-white'
            }`}
          >
            {t('orders.title') === 'Mes Commandes' ? 'Ventes' : 'Kuuzwa'}
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <OrderSkeleton key={i} />)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-dark dark:text-white mb-2">{t('orders.empty')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {filter === 'buyer' 
              ? (t('orders.title') === 'Mes Commandes' ? "Vous n'avez pas encore effectué d'achat." : "Hujanunua chochote bado.")
              : filter === 'seller'
              ? (t('orders.title') === 'Mes Commandes' ? "Vous n'avez pas encore reçu de commande." : "Hujapokea agizo lolote bado.")
              : t('orders.empty')
            }
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 btn-primary"
          >
            {t('products.title')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => {
            const isBuyer = user?.id === order.buyer_id;
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const otherParty = isBuyer ? order.seller : order.buyer;
            
            return (
              <Link 
                key={order.id} 
                to={`/orders/${order.id}`} 
                className="group block bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-5">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {order.products?.image_url ? (
                        <img 
                          src={order.products.image_url} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Order Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-bold text-dark truncate group-hover:text-primary transition-colors">
                            {order.products?.title || 'Produit'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {otherParty?.avatar_url ? (
                              <img 
                                src={otherParty.avatar_url} 
                                alt="" 
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                                {otherParty?.full_name?.charAt(0) || '?'}
                              </div>
                            )}
                            <span className="text-sm text-gray-500">
                              {isBuyer ? 'Vendeur' : 'Acheteur'}: {otherParty?.full_name || 'Inconnu'}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-primary">{order.amount_ada}</span>
                          <span className="text-sm text-gray-400">ADA</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">
                            {formatDate(order.created_at)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role indicator */}
                <div className={`px-5 py-2 text-xs font-medium ${
                  isBuyer ? 'bg-green-50 text-green-600' : 'bg-violet-50 text-violet-600'
                }`}>
                  {isBuyer ? '🛒 Vous êtes l\'acheteur' : '🏪 Vous êtes le vendeur'}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
