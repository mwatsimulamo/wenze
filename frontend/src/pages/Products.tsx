import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { logger } from '../utils/logger';
import { convertADAToFC, convertFCToADA, formatFC, formatADA, getExchangeRate } from '../utils/currencyConverter';
import ProductCard from '../components/ProductCard';
import { 
  Search, 
  Plus,
  Minus,
  ShoppingBag, 
  Sparkles,
  ChevronDown,
  Smartphone,
  Shirt,
  Laptop,
  Briefcase,
  Home,
  MoreHorizontal,
  UtensilsCrossed,
  Wand2,
  Hammer,
  Building2,
  Car,
  RefreshCw,
  Package,
  Star,
  X,
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price_ada: number; // Prix historique en ADA (utilisé seulement pour rétrocompatibilité)
  price_fc?: number; // Prix fixe en FC (prioritaire si disponible)
  image_url: string;
  seller_id: string;
  category: string;
  location: string;
  condition?: 'new' | 'used'; // État du produit : nouveau ou occasion
  status?: string; // 'available', 'sold', 'suspended'
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
    { id: 'all', name: 'Tout', icon: ShoppingBag },
    { id: 'electronics', name: 'Électronique', icon: Smartphone },
    { id: 'fashion', name: 'Mode', icon: Shirt },
    { id: 'food', name: 'Aliments', icon: UtensilsCrossed },
    { id: 'beauty', name: 'Beauté & Hygiène', icon: Wand2 },
    { id: 'diy', name: 'Bricolage & Matériaux', icon: Hammer },
    { id: 'service', name: 'Services', icon: Briefcase },
    { id: 'real_estate', name: 'Immobilier', icon: Building2 },
    { id: 'auto', name: 'Auto & Moto', icon: Car },
    { id: 'other', name: 'Autres', icon: MoreHorizontal },
  ];

  // Catégories qui ne nécessitent pas d'escrow (contact direct)
  const NO_ESCROW_CATEGORIES = ['service', 'real_estate', 'auto'];
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState<'all' | 'new' | 'used'>('all');
  // Nombre de produits à afficher (2 lignes = 12 produits sur grand écran avec 6 colonnes)
  const [displayedProductsCount, setDisplayedProductsCount] = useState(12);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
    // Réinitialiser le compteur quand les filtres changent
    setDisplayedProductsCount(12);
  }, [products, searchQuery, sortBy, selectedCategory, selectedCondition]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles (full_name, avatar_url, reputation_score)
        `)
        .eq('status', 'available') // Uniquement les produits disponibles
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrage supplémentaire côté client pour garantir qu'aucun produit vendu ou suspendu n'apparaisse
      const availableProducts = (data || []).filter(product => 
        product.status === 'available' && product.status !== 'sold' && product.status !== 'suspended'
      );
      
      setProducts(availableProducts);
      setFilteredProducts(availableProducts);
    } catch (error) {
      logger.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const STANDARD_CATEGORIES = ['electronics', 'fashion', 'food', 'beauty', 'diy', 'service', 'real_estate', 'auto'];

  // Fonction pour normaliser les accents et caractères spéciaux
  const normalizeText = (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9\s]/g, ' ') // Remplacer caractères spéciaux par espaces
      .replace(/\s+/g, ' ') // Remplacer multiples espaces par un seul
      .trim();
  };


  // Fonction de recherche intelligente
  const smartSearch = (product: Product, query: string): boolean => {
    if (!query.trim()) return true;

    const normalizedQuery = normalizeText(query);
    const queryWords = normalizedQuery.split(' ').filter(word => word.length > 0);

    // Normaliser les différents champs à rechercher
    const searchableFields = {
      title: normalizeText(product.title || ''),
      description: normalizeText(product.description || ''),
      sellerName: normalizeText(product.profiles?.full_name || ''),
      category: normalizeText(product.category || ''),
      location: normalizeText(product.location || ''),
    };

    const allSearchableText = Object.values(searchableFields).join(' ');

    // 1. Recherche exacte de la phrase complète (priorité haute)
    if (allSearchableText.includes(normalizedQuery)) {
      return true;
    }

    // 2. Recherche par mots clés (tous les mots doivent être présents)
    const allWordsMatch = queryWords.every(word => {
      // Vérifier dans chaque champ
      return Object.values(searchableFields).some(field => 
        field.includes(word)
      );
    });

    if (allWordsMatch && queryWords.length > 1) {
      return true;
    }

    // 3. Recherche flexible par mot (au moins un mot correspond bien)
    const wordMatches = queryWords.map(word => {
      // Recherche exacte du mot
      if (word.length >= 3) {
        // Vérifier dans chaque champ séparément
        const matchesInTitle = searchableFields.title.includes(word) || 
          searchableFields.title.split(' ').some(w => w.startsWith(word) || word.startsWith(w));
        const matchesInSeller = searchableFields.sellerName.includes(word) ||
          searchableFields.sellerName.split(' ').some(w => w.startsWith(word) || word.startsWith(w));
        const matchesInDescription = searchableFields.description.includes(word) ||
          searchableFields.description.split(' ').some(w => w.startsWith(word) || word.startsWith(w));
        const matchesInCategory = searchableFields.category.includes(word);
        const matchesInLocation = searchableFields.location.includes(word);

        return matchesInTitle || matchesInSeller || matchesInDescription || matchesInCategory || matchesInLocation;
      }
      
      // Pour les mots courts (2 caractères), recherche exacte uniquement
      return word.length === 2 && allSearchableText.includes(word);
    });

    // Si un seul mot, il doit correspondre
    if (queryWords.length === 1) {
      return wordMatches[0] || false;
    }

    // Si plusieurs mots, au moins un doit correspondre bien
    return wordMatches.filter(Boolean).length >= Math.ceil(queryWords.length / 2);
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Exclusion explicite des produits vendus (double sécurité)
    filtered = filtered.filter(p => p.status === 'available' || !p.status);

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'other') {
        // Pour "Autres", on montre les catégories personnalisées (non-standard)
        filtered = filtered.filter(p => !STANDARD_CATEGORIES.includes(p.category));
      } else {
        filtered = filtered.filter(p => p.category === selectedCategory);
      }
    }

    // Condition filter (nouveau/occasion) - seulement pour les produits (pas les services)
    if (selectedCondition !== 'all') {
      filtered = filtered.filter(p => {
        // Pour les services, on ignore le filtre de condition
        if (p.category === 'service') return true;
        // Pour les autres produits, filtrer par condition
        return p.condition === selectedCondition;
      });
    }

    // Recherche intelligente
    if (searchQuery) {
      filtered = filtered.filter(p => smartSearch(p, searchQuery));
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => {
          // Utiliser price_fc si disponible, sinon convertir depuis price_ada
          const priceA = a.price_fc || convertADAToFC(a.price_ada);
          const priceB = b.price_fc || convertADAToFC(b.price_ada);
          return priceA - priceB;
        });
        break;
      case 'price_high':
        filtered.sort((a, b) => {
          // Utiliser price_fc si disponible, sinon convertir depuis price_ada
          const priceA = a.price_fc || convertADAToFC(a.price_ada);
          const priceB = b.price_fc || convertADAToFC(b.price_ada);
          return priceB - priceA;
        });
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

          {/* Search Bar - Version améliorée pour utilisateur paresseux */}
          <div className="mt-5 sm:mt-8">
            <div className="relative group">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un produit, un vendeur, une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-violet-400/70 focus:ring-2 focus:ring-violet-400/30 transition-all text-sm sm:text-base shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
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
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Bar - Version améliorée pour utilisateur paresseux */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Ligne 1: Filtres rapides visuels (condition) */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">État :</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCondition('all')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                selectedCondition === 'all'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary/30 hover:text-primary'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Tous</span>
            </button>
            <button
              onClick={() => setSelectedCondition('new')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                selectedCondition === 'new'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-green-500/30 hover:text-green-600 dark:hover:text-green-400'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Nouveaux</span>
            </button>
            <button
              onClick={() => setSelectedCondition('used')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                selectedCondition === 'used'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Occasion</span>
            </button>
          </div>
        </div>

        {/* Ligne 2: Compteur et tri */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              <strong className="text-dark dark:text-white font-semibold">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'produit trouvé' : 'produits trouvés'}
            </p>
          </div>

          {/* Sort Filter - Version améliorée */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all hover:border-primary/50"
            >
              <option value="recent">{t('products.sort.recent')}</option>
              <option value="price_low">{t('products.sort.price_low')}</option>
              <option value="price_high">{t('products.sort.price_high')}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
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
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
            {filteredProducts.slice(0, displayedProductsCount).map((product, index) => {
              const daysSinceCreation = Math.floor(
                (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24)
              );
              const isNew = daysSinceCreation <= 7;
              
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  image_url={product.image_url}
                  price_ada={product.price_ada}
                  price_fc={product.price_fc}
                  location={product.location}
                  category={product.category}
                  condition={product.condition}
                  created_at={product.created_at}
                  seller={product.profiles}
                  isNew={isNew}
                  isTrending={index < 4}
                />
              );
            })}
          </div>

          {/* Load More / Load Less - Boutons de pagination */}
          {(filteredProducts.length > displayedProductsCount || displayedProductsCount > 12) && (
            <div className="text-center mt-8 sm:mt-10 flex items-center justify-center gap-3">
              {/* Bouton Charger moins - Afficher seulement si plus de 12 produits sont affichés */}
              {displayedProductsCount > 12 && (
                <button
                  onClick={() => setDisplayedProductsCount(prev => Math.max(12, prev - 12))}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all text-sm sm:text-base"
                >
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Charger moins
                </button>
              )}
              
              {/* Bouton Charger plus - Afficher seulement s'il reste des produits à charger */}
              {filteredProducts.length > displayedProductsCount && (
                <button
                  onClick={() => setDisplayedProductsCount(prev => prev + 12)}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Charger plus ({filteredProducts.length - displayedProductsCount} produits restants)
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
