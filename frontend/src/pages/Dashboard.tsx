import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { logger } from '../utils/logger';
import { getWZPTotal } from '../utils/getWZPTotal';
import { 
  Package,
  ShoppingCart,
  PlusCircle,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ArrowLeftRight,
  Award
} from 'lucide-react';

interface Order {
  id: string;
  status: string;
  amount_ada: number;
  created_at: string;
  products: {
    title: string;
    image_url: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingActions, setPendingActions] = useState<Order[]>([]);
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalProducts: 0,
    pendingCount: 0,
    wzpTotal: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [buyerOrders, sellerOrders, products] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('buyer_id', user?.id),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', user?.id),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', user?.id),
      ]);

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`id, status, amount_ada, created_at, products (title, image_url)`)
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: actionsData } = await supabase
        .from('orders')
        .select(`id, status, amount_ada, created_at, products (title, image_url)`)
        .eq('seller_id', user?.id)
        .in('status', ['pending', 'escrow_web2'])
        .order('created_at', { ascending: false })
        .limit(5);

      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user?.id)
        .in('status', ['pending', 'escrow_web2']);

      // Fetch WZP total
      let wzpTotal = 0;
      if (user?.id) {
        wzpTotal = await getWZPTotal(user.id);
      }

      setStats({
        totalOrders: buyerOrders.count || 0,
        totalSales: sellerOrders.count || 0,
        totalProducts: products.count || 0,
        pendingCount: pendingCount || 0,
        wzpTotal: wzpTotal,
      });

      setRecentOrders(ordersData || []);
      setPendingActions(actionsData || []);
    } catch (error) {
      logger.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />;
      case 'escrow_web2': return <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />;
      case 'shipped': return <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />;
      default: return <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'escrow_web2': return 'Fonds bloqués';
      case 'shipped': return 'Confirmée';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 sm:h-10 sm:w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p className="text-gray-500 text-sm sm:text-base">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-1 sm:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark">Tableau de bord</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Bienvenue, {user?.email?.split('@')[0]}</p>
      </div>

      {/* Quick Actions - 2x2 Grid on Mobile, 4 cols on Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Vendre */}
        <Link
          to="/products/new"
          className="group aspect-square sm:aspect-auto flex flex-col items-center justify-center sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 sm:p-5 bg-gradient-to-br from-blue-400 to-primary rounded-3xl text-white shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.97] sm:hover:-translate-y-1"
        >
          <div className="w-14 h-14 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-2xl sm:rounded-xl flex items-center justify-center">
            <PlusCircle className="w-7 h-7 sm:w-6 sm:h-6" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-base sm:text-lg font-bold">Vendre</p>
            <p className="text-blue-100 text-[10px] sm:text-xs hidden sm:block">Ajouter un produit</p>
          </div>
        </Link>

        {/* Acheter */}
        <Link
          to="/products"
          className="group aspect-square sm:aspect-auto flex flex-col items-center justify-center sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 sm:p-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl text-white shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all active:scale-[0.97] sm:hover:-translate-y-1"
        >
          <div className="w-14 h-14 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-2xl sm:rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-7 h-7 sm:w-6 sm:h-6" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-base sm:text-lg font-bold">Acheter</p>
            <p className="text-green-100 text-[10px] sm:text-xs hidden sm:block">Explorer le marché</p>
          </div>
        </Link>

        {/* Commandes */}
        <Link
          to="/orders"
          className="group aspect-square sm:aspect-auto flex flex-col items-center justify-center sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 sm:p-5 bg-gradient-to-br from-violet-400 to-purple-500 rounded-3xl text-white shadow-lg shadow-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20 transition-all active:scale-[0.97] sm:hover:-translate-y-1"
        >
          <div className="w-14 h-14 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-2xl sm:rounded-xl flex items-center justify-center">
            <Package className="w-7 h-7 sm:w-6 sm:h-6" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-base sm:text-lg font-bold">Commandes</p>
            <p className="text-violet-100 text-[10px] sm:text-xs hidden sm:block">Mes transactions</p>
          </div>
        </Link>

        {/* AdaEx */}
        <a
          href="https://app.adaex.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="group aspect-square sm:aspect-auto flex flex-col items-center justify-center sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 sm:p-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl text-white shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 transition-all active:scale-[0.97] sm:hover:-translate-y-1"
        >
          <div className="w-14 h-14 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-2xl sm:rounded-xl flex items-center justify-center">
            <ArrowLeftRight className="w-7 h-7 sm:w-6 sm:h-6" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-base sm:text-lg font-bold">Échanger</p>
            <p className="text-orange-100 text-[10px] sm:text-xs hidden sm:block">ADA ↔ FC (Momo)</p>
          </div>
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-xs sm:text-sm text-gray-500">Produits</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-dark">{stats.totalProducts}</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            <span className="text-xs sm:text-sm text-gray-500">Ventes</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-dark">{stats.totalSales}</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
            <span className="text-xs sm:text-sm text-gray-500">Achats</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-dark">{stats.totalOrders}</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            <span className="text-xs sm:text-sm text-gray-500">En attente</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-dark">{stats.pendingCount}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 sm:p-5 border border-amber-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            <span className="text-xs sm:text-sm text-gray-600 font-medium">Points WZP</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.wzpTotal.toFixed(1)}</p>
          <p className="text-[10px] sm:text-xs text-amber-600/70 mt-1">Gagnés via ADA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pending Actions */}
        {pendingActions.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-dark text-sm sm:text-base">Actions requises</h2>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Commandes en attente</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-orange-100 text-orange-600 text-xs sm:text-sm font-medium rounded-full flex-shrink-0">
                {pendingActions.length}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {pendingActions.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 active:bg-gray-100 transition"
                >
                  <img
                    src={order.products?.image_url || '/placeholder.png'}
                    alt={order.products?.title}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark text-sm sm:text-base truncate">{order.products?.title}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                      {getStatusIcon(order.status)}
                      <span className="text-xs sm:text-sm text-gray-500">{getStatusLabel(order.status)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-dark text-sm sm:text-base">{order.amount_ada} ADA</p>
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 hidden sm:block" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-violet-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-dark text-sm sm:text-base">Mes achats récents</h2>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Dernières commandes</p>
              </div>
            </div>
            <Link to="/orders" className="text-primary text-xs sm:text-sm font-medium hover:underline flex-shrink-0">
              Voir tout
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 active:bg-gray-100 transition"
                >
                  <img
                    src={order.products?.image_url || '/placeholder.png'}
                    alt={order.products?.title}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark text-sm sm:text-base truncate">{order.products?.title}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                      {getStatusIcon(order.status)}
                      <span className="text-xs sm:text-sm text-gray-500">{getStatusLabel(order.status)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-dark text-sm sm:text-base">{order.amount_ada} ADA</p>
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center">
              <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm sm:text-base">Aucun achat pour le moment</p>
              <Link to="/products" className="text-primary font-medium hover:underline text-xs sm:text-sm mt-2 inline-block">
                Découvrir les produits
              </Link>
            </div>
          )}
        </div>

        {/* Empty State for Pending Actions */}
        {pendingActions.length === 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl border border-green-100 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" />
            </div>
            <h3 className="font-bold text-dark text-base sm:text-lg mb-2">Tout est en ordre !</h3>
            <p className="text-gray-500 text-xs sm:text-sm">
              Vous n'avez aucune action en attente.<br/>
              Vos commandes sont à jour.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

