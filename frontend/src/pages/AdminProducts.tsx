import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Search, Trash2, AlertTriangle, X } from 'lucide-react';

interface ProductWithSeller {
  id: string;
  title: string;
  price_ada: number;
  category: string;
  created_at: string;
  status: string;
  seller: {
    id: string;
    full_name: string;
    email: string;
  };
}

const AdminProducts = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [sellers, setSellers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    productId: string;
    productTitle: string;
    sellerName: string;
  } | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkSellerName, setBulkSellerName] = useState('');

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchSellers();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Gérer les erreurs de chargement
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <h2 className="text-xl font-bold text-dark mb-2">Accès non autorisé</h2>
          <p className="text-gray-500">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:seller_id(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts = data?.map((p: any) => ({
        ...p,
        seller: p.profiles || { id: p.seller_id, full_name: 'Inconnu', email: '' }
      })) || [];

      setProducts(formattedProducts);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Erreur', 'Impossible de charger les produits. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (data) {
        setSellers(data.filter((s: any) => s.full_name));
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeleting(productId);
    try {
      // Récupérer d'abord les IDs des commandes liées
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id')
        .eq('product_id', productId);

      const orderIds = ordersData?.map(o => o.id) || [];

      // Supprimer les messages liés
      if (orderIds.length > 0) {
        await supabase
          .from('messages')
          .delete()
          .in('order_id', orderIds);
      }

      // Supprimer les ratings liés
      if (orderIds.length > 0) {
        await supabase
          .from('ratings')
          .delete()
          .in('order_id', orderIds);
      }

      // Supprimer les commandes liées
      if (orderIds.length > 0) {
        await supabase
          .from('orders')
          .delete()
          .in('id', orderIds);
      }

      // Enfin, supprimer le produit
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (productError) throw productError;

      toast.success('Produit supprimé', 'Le produit et toutes ses données associées ont été supprimés.');
      setShowDeleteConfirm(null);
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error('Erreur', 'Impossible de supprimer le produit: ' + (error.message || ''));
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkSellerName.trim()) {
      toast.warning('Nom requis', 'Veuillez entrer le nom du vendeur.');
      return;
    }

    setDeleting('bulk');
    try {
      // Trouver les IDs des vendeurs correspondants
      const { data: sellerProfiles, error: sellerError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${bulkSellerName.trim()}%`);

      if (sellerError) throw sellerError;

      if (!sellerProfiles || sellerProfiles.length === 0) {
        toast.warning('Aucun vendeur trouvé', `Aucun vendeur trouvé avec le nom "${bulkSellerName}"`);
        setDeleting(null);
        return;
      }

      const sellerIds = sellerProfiles.map(s => s.id);

      // Trouver tous les produits de ces vendeurs
      const { data: productsToDelete, error: productsError } = await supabase
        .from('products')
        .select('id')
        .in('seller_id', sellerIds);

      if (productsError) throw productsError;

      if (!productsToDelete || productsToDelete.length === 0) {
        toast.warning('Aucun produit', `Aucun produit trouvé pour "${bulkSellerName}"`);
        setDeleting(null);
        return;
      }

      const productIds = productsToDelete.map(p => p.id);

      // Récupérer les IDs des commandes liées
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id')
        .in('product_id', productIds);

      const orderIds = ordersData?.map(o => o.id) || [];

      // Supprimer les messages
      if (orderIds.length > 0) {
        await supabase
          .from('messages')
          .delete()
          .in('order_id', orderIds);
      }

      // Supprimer les ratings
      if (orderIds.length > 0) {
        await supabase
          .from('ratings')
          .delete()
          .in('order_id', orderIds);
      }

      // Supprimer les commandes
      if (orderIds.length > 0) {
        await supabase
          .from('orders')
          .delete()
          .in('id', orderIds);
      }

      // Supprimer les produits
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', productIds);

      if (deleteError) throw deleteError;

      toast.success(
        'Produits supprimés', 
        `${productsToDelete.length} produit(s) de "${bulkSellerName}" ont été supprimés.`
      );
      setShowBulkDelete(false);
      setBulkSellerName('');
      fetchProducts();
    } catch (error: any) {
      console.error('Error bulk deleting:', error);
      toast.error('Erreur', 'Impossible de supprimer les produits: ' + (error.message || ''));
    } finally {
      setDeleting(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.seller.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeller = !selectedSeller || p.seller.id === selectedSeller;
    
    return matchesSearch && matchesSeller;
  });

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
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark">Gestion des Produits</h1>
            <p className="text-gray-500 mt-1">Administration et suppression des produits</p>
          </div>
          
          <button
            onClick={() => setShowBulkDelete(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Suppression en masse
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit ou vendeur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
            />
          </div>
          
          <select
            value={selectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
          >
            <option value="">Tous les vendeurs</option>
            {sellers.map(seller => (
              <option key={seller.id} value={seller.id}>{seller.full_name}</option>
            ))}
          </select>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vendeur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Prix</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-dark">{product.title}</div>
                    <div className="text-xs text-gray-500">{product.category}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-700">{product.seller.full_name}</div>
                    <div className="text-xs text-gray-500">{product.seller.email}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">{product.price_ada} ADA</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(product.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setShowDeleteConfirm({
                        productId: product.id,
                        productTitle: product.title,
                        sellerName: product.seller.full_name
                      })}
                      disabled={deleting === product.id}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {deleting === product.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Suppression...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun produit trouvé</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-dark">Confirmer la suppression</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Produit:</strong> {showDeleteConfirm.productTitle}
              </p>
              <p className="text-sm text-amber-800 mt-1">
                <strong>Vendeur:</strong> {showDeleteConfirm.sellerName}
              </p>
              <p className="text-xs text-amber-700 mt-2 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Toutes les commandes, messages et ratings associés seront également supprimés.</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteProduct(showDeleteConfirm.productId)}
                disabled={deleting === showDeleteConfirm.productId}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-dark">Suppression en masse</h3>
              <button
                onClick={() => {
                  setShowBulkDelete(false);
                  setBulkSellerName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Entrez le nom du vendeur pour supprimer tous ses produits :
            </p>

            <input
              type="text"
              placeholder="Ex: Olivier M, Kaota..."
              value={bulkSellerName}
              onChange={(e) => setBulkSellerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary mb-4"
            />

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-700 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Tous les produits, commandes, messages et ratings de ce vendeur seront supprimés définitivement.</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBulkDelete(false);
                  setBulkSellerName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting === 'bulk' || !bulkSellerName.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting === 'bulk' ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Supprimer tous les produits
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

