import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import { prepareAdaRelease } from '../blockchain/prepareAdaRelease';

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
          *,
          products:product_id(*),
          buyer:buyer_id(*),
          seller:seller_id(*)
      `)
      .eq('id', id)
      .single();

    if (!error) setOrder(data);
    setLoading(false);
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);
    
    if (!error) {
        fetchOrder();
        
        // Simuler la libération des fonds si complété
        if (newStatus === 'completed') {
            await prepareAdaRelease(id!);
            
            // Simuler récompense UZP
            await supabase.from('uzp_transactions').insert([
                { user_id: order.buyer_id, amount: 2.5, type: 'earn_buy' },
                { user_id: order.seller_id, amount: 2.5, type: 'earn_sell' }
            ]);
            alert("Commande terminée ! Fonds libérés et UZP distribués.");
        }
    }
  };

  if (loading || !order) return <div className="text-center py-10">Chargement...</div>;

  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Colonne Gauche: Détails Commande */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
            <h1 className="text-2xl font-bold mb-4">Commande #{order.id.slice(0, 8)}</h1>
            
            {/* Steps Progress */}
            <div className="flex items-center justify-between mb-8 text-sm">
                <div className={`flex flex-col items-center ${['pending', 'escrow_web2', 'shipped', 'completed'].includes(order.status) ? 'text-primary' : 'text-gray-300'}`}>
                    <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white font-bold mb-1">1</div>
                    <span>Créée</span>
                </div>
                <div className={`h-1 flex-1 mx-2 ${['escrow_web2', 'shipped', 'completed'].includes(order.status) ? 'bg-primary' : 'bg-gray-200'}`} />
                
                <div className={`flex flex-col items-center ${['escrow_web2', 'shipped', 'completed'].includes(order.status) ? 'text-primary' : 'text-gray-300'}`}>
                    <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white font-bold mb-1">2</div>
                    <span>Escrow</span>
                </div>
                <div className={`h-1 flex-1 mx-2 ${['shipped', 'completed'].includes(order.status) ? 'bg-primary' : 'bg-gray-200'}`} />

                <div className={`flex flex-col items-center ${['shipped', 'completed'].includes(order.status) ? 'text-primary' : 'text-gray-300'}`}>
                    <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white font-bold mb-1">3</div>
                    <span>Expédiée</span>
                </div>
                <div className={`h-1 flex-1 mx-2 ${['completed'].includes(order.status) ? 'bg-primary' : 'bg-gray-200'}`} />

                <div className={`flex flex-col items-center ${['completed'].includes(order.status) ? 'text-primary' : 'text-gray-300'}`}>
                    <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white font-bold mb-1">4</div>
                    <span>Reçue</span>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg flex gap-4">
                <img src={order.products.image_url} className="w-20 h-20 object-cover rounded bg-white" />
                <div>
                    <h3 className="font-bold">{order.products.title}</h3>
                    <p className="text-primary font-bold">{order.amount_ada} ADA</p>
                    <p className="text-xs text-gray-500 mt-1">Status: {order.status}</p>
                </div>
            </div>

            {/* Actions Zone */}
            <div className="mt-6 border-t pt-6">
                <h3 className="font-bold mb-3">Actions requises</h3>
                
                {order.status === 'escrow_web2' && isSeller && (
                    <div className="bg-blue-50 p-4 rounded border border-blue-100">
                        <p className="text-sm text-blue-800 mb-3">L'acheteur a payé (Escrow). Veuillez expédier le produit.</p>
                        <button onClick={() => updateStatus('shipped')} className="btn-primary w-full">
                            Confirmer l'expédition
                        </button>
                    </div>
                )}

                {order.status === 'shipped' && isBuyer && (
                    <div className="bg-green-50 p-4 rounded border border-green-100">
                        <p className="text-sm text-green-800 mb-3">Le vendeur a expédié le colis. Confirmez la réception pour libérer les fonds.</p>
                        <button onClick={() => updateStatus('completed')} className="bg-green-600 text-white w-full py-2 rounded-lg hover:bg-green-700 font-bold">
                            Confirmer la réception (Libérer Escrow)
                        </button>
                    </div>
                )}

                {order.status === 'completed' && (
                    <div className="text-center p-4 bg-gray-50 rounded text-gray-500">
                        Cette commande est terminée. Les fonds ont été libérés.
                    </div>
                )}
                
                {order.status === 'pending' && (
                    <div className="text-center p-4 bg-gray-50 rounded text-gray-500">
                        En attente de paiement Escrow (étape automatique).
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Colonne Droite: Chat */}
      <div className="lg:col-span-1">
        <ChatBox orderId={id!} />
        
        <div className="mt-6 card bg-gray-50">
            <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">Détails techniques (Simulés)</h3>
            <div className="space-y-2 text-xs text-gray-600 break-all">
                <p><strong>Order ID:</strong> {order.id}</p>
                <p><strong>Escrow Hash:</strong> {order.escrow_hash || 'Pending...'}</p>
                <p><strong>Buyer:</strong> {order.buyer.wallet_address || 'Not connected'}</p>
                <p><strong>Seller:</strong> {order.seller.wallet_address || 'Not connected'}</p>
            </div>
        </div>
      </div>

    </div>
  );
};

export default OrderDetail;


