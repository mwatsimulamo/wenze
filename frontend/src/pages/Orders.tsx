import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            products:product_id(title, image_url),
            buyer:buyer_id(full_name),
            seller:seller_id(full_name)
        `)
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`) // Get orders where I am buyer OR seller
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">En attente</span>;
        case 'escrow_web2': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">Escrow Sécurisé</span>;
        case 'shipped': return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold">Expédié</span>;
        case 'completed': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Terminé</span>;
        case 'disputed': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">Litige</span>;
        default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (loading) return <div className="text-center py-10">Chargement des commandes...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold text-secondary mb-4 sm:mb-6">Mes Commandes</h1>
      
      {orders.length === 0 ? (
        <div className="card text-center py-10">
            <p className="text-gray-500">Vous n'avez aucune commande pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
            {orders.map((order) => {
                const isBuyer = user?.id === order.buyer_id;
                return (
                    <Link key={order.id} to={`/orders/${order.id}`} className="card flex flex-col md:flex-row gap-4 hover:shadow-md transition">
                        <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                             {order.products?.image_url && <img src={order.products.image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{order.products?.title}</h3>
                                    <p className="text-sm text-gray-500">
                                        {isBuyer ? `Vendeur: ${order.seller?.full_name}` : `Acheteur: ${order.buyer?.full_name}`}
                                    </p>
                                </div>
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <span className="font-bold text-primary">{order.amount_ada} ADA</span>
                                <span className="text-xs text-gray-400">Commandé le {new Date(order.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
      )}
    </div>
  );
};

export default Orders;


