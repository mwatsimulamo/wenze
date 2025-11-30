import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  price_ada: number;
  image_url: string;
  seller_id: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Chargement des produits...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Produits Récents</h1>
        <Link to="/products/new" className="btn-primary w-full sm:w-auto text-center">
          + Vendre un produit
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">Aucun produit disponible pour le moment.</p>
          <Link to="/products/new" className="text-primary hover:underline">Soyez le premier vendeur !</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="card hover:shadow-md transition duration-300">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Pas d'image</div>
                )}
              </div>
              <h3 className="font-bold text-lg mb-1 truncate">{product.title}</h3>
              <p className="text-primary font-bold">{product.price_ada} ADA</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;


