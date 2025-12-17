import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { logger } from '../utils/logger';
import { getWZPTotal } from '../utils/getWZPTotal';
import { convertADAToFC, formatFC } from '../utils/currencyConverter';
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
  Award,
  DollarSign,
  Activity,
  BarChart3,
  Sparkles
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
    totalRevenue: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [buyerOrders, sellerOrders, products, revenueData] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('buyer_id', user?.id),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', user?.id),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', user?.id),
        supabase.from('orders').select('amount_ada').eq('seller_id', user?.id).eq('status', 'completed'),
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

      // Calculate total revenue
      const totalRevenue = revenueData.data?.reduce((sum, order) => sum + (order.amount_ada || 0), 0) || 0;

      setStats({
        totalOrders: buyerOrders.count || 0,
        totalSales: sellerOrders.count || 0,
        totalProducts: products.count || 0,
        pendingCount: pendingCount || 0,
        wzpTotal: wzpTotal,
        totalRevenue: totalRevenue,
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
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'escrow_web2': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-violet-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'escrow_web2': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'shipped': return 'bg-violet-50 text-violet-600 border-violet-200';
      case 'completed': return 'bg-green-50 text-green-600 border-green-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
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

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Tableau de bord
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Bienvenue, <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.email?.split('@')[0]}</span>
            </p>
          </div>
          <Link
            to="/products/new"
            className="hidden md:flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20"
          >
            <PlusCircle className="w-5 h-5" />
            Vendre un produit
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          to="/products/new"
          className="group bg-gradient-to-br from-blue-500 to-primary rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Vendre</h3>
          <p className="text-blue-100 text-sm">Ajouter un produit</p>
        </Link>

        <Link
          to="/products"
          className="group bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Acheter</h3>
          <p className="text-emerald-100 text-sm">Explorer le marché</p>
        </Link>

        <Link
          to="/orders"
          className="group bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Commandes</h3>
          <p className="text-violet-100 text-sm">Mes transactions</p>
        </Link>

        <Link
          to="/profile"
          className="group bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Profil</h3>
          <p className="text-amber-100 text-sm">Mon compte</p>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Produits</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalProducts}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ventes</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSales}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-5 h-5 text-violet-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Achats</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalOrders}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Revenus</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{formatFC(convertADAToFC(stats.totalRevenue))}</p>
          <p className="text-xs text-slate-400 mt-1">{stats.totalRevenue.toFixed(2)} ADA</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">En attente</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingCount}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Points WZP</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.wzpTotal.toFixed(1)}</p>
          <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1">Gagnés via ADA</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        {pendingActions.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Actions requises</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Commandes en attente</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-semibold rounded-full">
                {pendingActions.length}
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {pendingActions.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  <img
                    src={order.products?.image_url || '/placeholder.png'}
                    alt={order.products?.title}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{order.products?.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-slate-900 dark:text-white">{order.amount_ada.toFixed(2)} ADA</p>
                    <p className="text-xs text-slate-400">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">Tout est en ordre !</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Vous n'avez aucune action en attente.<br/>
              Vos commandes sont à jour.
            </p>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Mes achats récents</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Dernières commandes</p>
              </div>
            </div>
            <Link to="/orders" className="text-primary text-sm font-semibold hover:underline">
              Voir tout
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  <img
                    src={order.products?.image_url || '/placeholder.png'}
                    alt={order.products?.title}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{order.products?.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-slate-900 dark:text-white">{order.amount_ada.toFixed(2)} ADA</p>
                    <p className="text-xs text-slate-400">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <ShoppingCart className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 mb-2">Aucun achat pour le moment</p>
              <Link to="/products" className="text-primary font-semibold hover:underline text-sm">
                Découvrir les produits
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
