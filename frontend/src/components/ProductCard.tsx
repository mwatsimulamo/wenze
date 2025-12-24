import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ShieldCheck, Sparkles, Clock, RefreshCw } from 'lucide-react';
import { formatFC, formatADA, convertADAToFC } from '../utils/currencyConverter';

interface ProductCardProps {
  id: string;
  title: string;
  image_url: string;
  price_ada: number;
  price_fc?: number;
  location: string;
  category: string;
  condition?: 'new' | 'used'; // État du produit : nouveau ou occasion
  created_at: string;
  seller?: {
    full_name: string;
    avatar_url?: string;
    reputation_score: number;
    is_verified?: boolean;
  };
  isNew?: boolean;
  isTrending?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  image_url,
  price_ada,
  price_fc,
  location,
  category,
  condition,
  created_at,
  seller,
  isNew = false,
  isTrending = false,
}) => {
  const priceInFC = price_fc || convertADAToFC(price_ada);
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isNewProduct = daysSinceCreation <= 7;

  return (
    <Link
      to={`/products/${id}`}
      className="group bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-primary/50 transition-all duration-300 flex flex-col"
    >
      {/* Image Container - Plus compact */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-700">
        <img
          src={image_url || '/placeholder.png'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Badges Overlay - Amélioré avec condition */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {/* Badge Condition (nouveau/occasion) - seulement pour les produits (pas les services) */}
          {category !== 'service' && condition && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md shadow-sm ${
              condition === 'new'
                ? 'bg-green-500 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {condition === 'new' ? (
                <>
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Neuf</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Occasion</span>
                </>
              )}
            </span>
          )}
          {/* Badge "Nouveau sur le marché" (différent de condition) */}
          {(isNew || isNewProduct) && (!condition || condition !== 'new') && (
            <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-md shadow-sm">
              Nouveau
            </span>
          )}
          {isTrending && (
            <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-md shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Tendance
            </span>
          )}
        </div>

        {/* Vendeur Vérifié Badge - Plus petit */}
        {seller?.is_verified && (
          <div className="absolute top-2 right-2">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-1 rounded-full shadow-sm">
              <ShieldCheck className="w-3 h-3 text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Content - Plus compact */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
        {/* Title - Plus compact */}
        <h3 className="font-medium text-sm text-slate-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {title}
        </h3>

        {/* Price - Mise en avant améliorée */}
        <div className="mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-primary dark:text-primary-400">
              {formatFC(priceInFC)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              FC
            </span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">
            ≈ {formatADA(price_ada)} ADA
          </div>
        </div>

        {/* Seller Info - Plus compact */}
        {seller && (
          <div className="flex items-center gap-1.5 mb-2">
            {seller.avatar_url ? (
              <img
                src={seller.avatar_url}
                alt={seller.full_name}
                className="w-5 h-5 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold text-primary">
                  {seller.full_name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate flex-1">
              {seller.full_name}
            </span>
            {seller.reputation_score > 0 && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                  {seller.reputation_score.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Location - Plus compact */}
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-auto pt-1 border-t border-slate-100 dark:border-slate-700">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;



