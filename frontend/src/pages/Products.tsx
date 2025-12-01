import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  Search, 
  Plus, 
  ShoppingBag, 
  Sparkles,
  Clock,
  ChevronDown,
  MapPin,
  Star,
  ShoppingCart,
  Smartphone,
  Shirt,
  Laptop,
  Briefcase,
  Home,
  MoreHorizontal
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price_ada: number;
  image_url: string;
  seller_id: string;
  category: string;
  location: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    reputation_score: number;
  };
}

const Products = () => {
  const { t } = useLanguage();
  
  const CATEGORIES = [
    { id: 'all', nameKey: 'products.all', icon: ShoppingBag },
    { id: 'electronics', nameKey: 'products.electronics', icon: Smartphone },
    { id: 'fashion', nameKey: 'products.fashion', icon: Shirt },
    { id: 'digital', nameKey: 'products.digital', icon: Laptop },
    { id: 'services', nameKey: 'products.services', icon: Briefcase },
    { id: 'home', nameKey: 'products.home', icon: Home },
    { id: 'other', nameKey: 'products.other', icon: MoreHorizontal },
  ];
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, sortBy, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles (full_name, avatar_url, reputation_score)
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price_ada - b.price_ada);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price_ada - a.price_ada);
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredProducts(filtered);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const ProductSkeleton = () => (
    <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 sm:p-4 space-y-3">
        <div className="h-3 sm:h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3 sm:h-4 bg-gray-200 rounded-full w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 sm:h-6 bg-gray-200 rounded-full w-16 sm:w-20" />
          <div className="h-7 sm:h-8 w-7 sm:w-8 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-0">
      {/* Hero Header */}
      <div className="relative mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-5 sm:p-8 md:p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs sm:text-sm text-violet-200 mb-3 sm:mb-4">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Marketplace Wenze</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
                {t('products.title')}
              </h1>
              <p className="text-gray-400 text-sm sm:text-base max-w-md">
                {t('products.subtitle')}
              </p>
            </div>

            <Link
              to="/products/new"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:shadow-lg active:scale-[0.98] transition-all text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('products.sell')}
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mt-5 sm:mt-8">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('products.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-white/10 backdrop-blur border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-5 sm:mb-6 -mx-1 px-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 sm:gap-3 pb-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-medium text-sm whitespace-nowrap transition-all active:scale-95 ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary/30 hover:text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(cat.nameKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          <strong className="text-dark dark:text-white">{filteredProducts.length}</strong> {t('products.count', { count: filteredProducts.length })}
        </p>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-8 sm:pr-10 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="recent">{t('products.sort.recent')}</option>
            <option value="price_low">{t('products.sort.price_low')}</option>
            <option value="price_high">{t('products.sort.price_high')}</option>
          </select>
          <ChevronDown className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-dark dark:text-white mb-2">{t('products.empty.title')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm sm:text-base px-4">
            {searchQuery 
              ? t('products.empty.no_results').replace('{query}', searchQuery)
              : t('products.empty.no_category')
            }
          </p>
          <Link 
            to="/products/new" 
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary text-white font-semibold rounded-xl text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('products.empty.add')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filteredProducts.map((product, index) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-primary/20 dark:hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/20 transition-all duration-300 animate-fade-in block"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-500" />
                  </div>
                )}

                {/* Time Badge */}
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur rounded-lg text-[10px] sm:text-xs font-medium text-white">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {formatTimeAgo(product.created_at)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4">
                {/* Seller Info - Cliquable mais avec stopPropagation */}
                <Link 
                  to={`/seller/${product.seller_id}`}
                  className="flex items-center gap-2 mb-2 sm:mb-3 group/seller relative z-20"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/seller/${product.seller_id}`;
                  }}
                >
                  {product.profiles?.avatar_url ? (
                    <img 
                      src={product.profiles.avatar_url} 
                      alt="" 
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-2 ring-transparent group-hover/seller:ring-primary/30 transition"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                      {product.profiles?.full_name?.charAt(0) || 'V'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium truncate group-hover/seller:text-primary transition">
                      {product.profiles?.full_name || 'Vendeur'}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                        {product.profiles?.reputation_score || 0} pts
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Title */}
                <h3 className="font-semibold text-dark dark:text-white text-sm sm:text-base mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                  {product.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 mb-2 sm:mb-3">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="text-[10px] sm:text-xs truncate">{product.location || 'Goma, RDC'}</span>
                </div>

                {/* Price & Buy */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-base sm:text-lg font-bold text-primary">{product.price_ada}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 ml-1">ADA</span>
                  </div>
                  
                  <div 
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-primary text-white text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl hover:bg-blue-700 active:scale-95 transition relative z-20"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/products/${product.id}`;
                    }}
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Acheter</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Load More */}
      {filteredProducts.length >= 12 && (
        <div className="text-center mt-8 sm:mt-10">
          <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 active:scale-95 transition text-sm sm:text-base">
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;
