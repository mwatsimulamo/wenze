import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { convertADAToFC, convertFCToADA, formatFC, formatADA } from '../utils/currencyConverter';
import { getWZPTotal } from '../utils/getWZPTotal';
import { 
  Star, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  CheckCircle, 
  Shield, 
  Award,
  ArrowLeft,
  Clock,
  ShoppingCart
} from 'lucide-react';

interface SellerData {
  id: string;
  full_name: string;
  avatar_url: string;
  username: string;
  reputation_score: number;
  is_verified: boolean;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  price_ada: number; // Prix historique en ADA (utilisé seulement pour rétrocompatibilité)
  price_fc?: number; // Prix fixe en FC (prioritaire si disponible)
  image_url: string;
  created_at: string;
  location: string;
}

interface Stats {
  totalProducts: number;
  totalSales: number;
  rating: number;
}

const SellerProfile = () => {
  const { id } = useParams();
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalSales: 0, rating: 4.5 });
  const [wzpTotal, setWzpTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSellerData();
    }
  }, [id]);

  const fetchSellerData = async () => {
    try {
      // Fetch seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (sellerError) throw sellerError;
      setSeller(sellerData);

      // Fetch seller's products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', id)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch stats
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', id);

      const { count: totalSales } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', id)
        .eq('status', 'completed');

      setStats({
        totalProducts: totalProducts || 0,
        totalSales: totalSales || 0,
        rating: 4.5 + Math.random() * 0.5, // Placeholder
      });

      // Fetch WZP total
      if (id) {
        const total = await getWZPTotal(id);
        setWzpTotal(total);
      }

    } catch (error) {
      console.error('Error fetching seller:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays < 1) return "Aujourd'hui";
    if (diffInDays < 7) return `${diffInDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 sm:h-10 sm:w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-dark mb-2">Vendeur introuvable</h2>
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
        className="inline-flex items-center gap-2 text-gray-500 hover:text-dark mb-4 sm:mb-6 text-sm sm:text-base"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au marché
      </Link>

      {/* Seller Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden mb-6 sm:mb-8">
        {/* Cover */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-primary via-blue-500 to-violet-500"></div>
        
        <div className="px-4 sm:px-6 pb-6">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
            <div className="relative">
              {seller.avatar_url ? (
                <img
                  src={seller.avatar_url}
                  alt={seller.full_name}
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-xl object-cover bg-white"
                />
              ) : (
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-bold text-white">
                    {seller.full_name?.charAt(0) || 'V'}
                  </span>
                </div>
              )}
              {seller.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center shadow">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-dark">
                  {seller.full_name || 'Vendeur'}
                </h1>
                {seller.is_verified && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] sm:text-xs font-medium rounded-full">
                    Vérifié
                  </span>
                )}
              </div>
              {seller.username && (
                <p className="text-gray-500 text-sm">@{seller.username}</p>
              )}
            </div>
          </div>

          {/* Stats & Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-bold text-lg sm:text-xl">{stats.rating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-gray-500">Note</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                <ShoppingBag className="w-4 h-4" />
                <span className="font-bold text-lg sm:text-xl">{stats.totalProducts}</span>
              </div>
              <p className="text-xs text-gray-500">Produits</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="font-bold text-lg sm:text-xl">{stats.totalSales}</span>
              </div>
              <p className="text-xs text-gray-500">Ventes</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                <Award className="w-4 h-4" />
                <span className="font-bold text-lg sm:text-xl">{wzpTotal.toFixed(1)}</span>
              </div>
              <p className="text-xs text-gray-500">Points WZP</p>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-violet-500 mb-1">
                <Award className="w-4 h-4" />
                <span className="font-bold text-lg sm:text-xl">{seller.reputation_score || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Points WZP</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {seller.is_verified && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <Shield className="w-3.5 h-3.5" />
                Vendeur vérifié
              </span>
            )}
            {stats.totalSales >= 10 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                <Award className="w-3.5 h-3.5" />
                Top Vendeur
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" />
              Membre depuis {formatDate(seller.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-dark mb-4 sm:mb-6 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          Produits en vente ({products.length})
        </h2>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Ce vendeur n'a pas de produits en vente actuellement.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur rounded-lg text-[10px] text-white">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimeAgo(product.created_at)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-dark text-sm mb-2 line-clamp-2 group-hover:text-primary transition">
                    {product.title}
                  </h3>

                  <div className="flex items-center gap-1 text-gray-400 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[10px] truncate">{product.location || 'Goma, RDC'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          {(() => {
                            const priceInFC = product.price_fc || convertADAToFC(product.price_ada);
                            const priceInADA = convertFCToADA(priceInFC);
                            return (
                              <>
                                <span className="text-base font-bold text-dark">
                                  {formatFC(priceInFC)}
                                </span>
                                <span className="text-[10px] text-gray-400">FC</span>
                              </>
                            );
                          })()}
                        </div>
                        <span className="text-[9px] text-gray-400">
                          {(() => {
                            const priceInFC = product.price_fc || convertADAToFC(product.price_ada);
                            const priceInADA = convertFCToADA(priceInFC);
                            return `≈ ${formatADA(priceInADA)} ADA`;
                          })()}
                        </span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-white text-[10px] font-semibold rounded-lg">
                      <ShoppingCart className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProfile;

