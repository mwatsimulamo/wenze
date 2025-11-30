import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { prepareAdaPayment } from '../blockchain/prepareAdaPayment';

interface Product {
  id: string;
  title: string;
  description: string;
  price_ada: number;
  image_url: string;
  seller_id: string;
  status: string;
  profiles: {
    username: string;
    full_name: string;
  };
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) fetchProduct(id);
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles:seller_id(username, full_name)')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
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
        alert("Vous ne pouvez pas acheter votre propre produit !");
        return;
    }

    setProcessing(true);

    try {
      // 1. Create Order in Pending state
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            buyer_id: user.id,
            seller_id: product.seller_id,
            product_id: product.id,
            amount_ada: product.price_ada,
            status: 'pending' // Initial status
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Simulate Web2 Payment / Escrow Lock
      // Here we simulate the blockchain prep
      const paymentPrep = await prepareAdaPayment(orderData.id, product.price_ada);
      console.log("Payment Prepared:", paymentPrep);

      // 3. Update Order to 'escrow_web2' (Simulating money received in escrow)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
            status: 'escrow_web2',
            escrow_hash: paymentPrep.txHash
        })
        .eq('id', orderData.id);

      if (updateError) throw updateError;
      
      // 4. Update Product status to 'sold' (or reserved)
      await supabase.from('products').update({ status: 'sold' }).eq('id', product.id);

      alert(`Commande créée avec succès ! Fonds bloqués en Escrow (Simulé). ID Transaction: ${paymentPrep.txHash}`);
      navigate('/orders'); // Redirect to orders list (to be created)

    } catch (error) {
      console.error('Error creating order:', error);
      alert('Erreur lors de la commande.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (!product) return <div className="text-center py-10">Produit introuvable.</div>;

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Image */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 h-96">
        {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">Pas d'image</div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-secondary">{product.title}</h1>
            <p className="text-gray-500 mt-2">Vendu par <span className="font-semibold text-primary">{product.profiles?.full_name || 'Vendeur Anonyme'}</span></p>
        </div>

        <div className="prose text-gray-600">
            <p>{product.description}</p>
        </div>

        <div className="border-t border-b border-gray-100 py-4 my-4">
            <div className="flex items-end space-x-2">
                <span className="text-4xl font-bold text-primary">{product.price_ada}</span>
                <span className="text-xl font-medium text-gray-400 mb-1">ADA</span>
            </div>
            <p className="text-xs text-green-600 mt-1">✓ Protection Escrow garantie</p>
        </div>

        {product.status === 'available' ? (
            <button 
                onClick={handleBuy}
                disabled={processing}
                className="btn-primary w-full py-4 text-lg shadow-lg hover:shadow-xl transform transition hover:-translate-y-0.5"
            >
                {processing ? 'Traitement en cours...' : 'Acheter maintenant (Escrow)'}
            </button>
        ) : (
            <button disabled className="bg-gray-300 text-gray-500 w-full py-4 text-lg rounded-lg cursor-not-allowed font-bold">
                Produit Vendu / Indisponible
            </button>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;


