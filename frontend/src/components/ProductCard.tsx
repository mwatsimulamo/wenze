import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import { formatFC, formatADA, convertADAToFC } from '../utils/currencyConverter';

interface ProductCardProps {
  id: string;
  title: string;
  image_url: string;
  price_ada: number;
  price_fc?: number;
  location: string;
  category: string;
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
      className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex flex-col"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
        <img
          src={image_url || '/placeholder.png'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew || isNewProduct ? (
            <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md">
              Nouveau
            </span>
          ) : null}
          {isTrending ? (
            <span className="px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Tendance
            </span>
          ) : null}
        </div>

        {/* Vendeur Vérifié Badge */}
        {seller?.is_verified && (
          <div className="absolute top-3 right-3">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-1.5 rounded-full shadow-md">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Price - Very Visible */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatFC(priceInFC)}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              FC
            </span>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            ≈ {formatADA(price_ada)} ADA
          </div>
        </div>

        {/* Seller Info */}
        {seller && (
          <div className="flex items-center gap-2 mb-3">
            {seller.avatar_url ? (
              <img
                src={seller.avatar_url}
                alt={seller.full_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {seller.full_name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <span className="text-sm text-slate-600 dark:text-slate-300 truncate flex-1">
              {seller.full_name}
            </span>
            {seller.reputation_score > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {seller.reputation_score.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-auto">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{location}</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;


