import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  LogOut, 
  User, 
  Mail, 
  Shield, 
  Star, 
  Edit2, 
  Save, 
  X,
  Wallet,
  Package,
  ShoppingCart,
  CheckCircle
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  reputation_score: number;
  is_verified: boolean;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
  });

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalProducts: 0,
  });

  // Fetch profile data
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setProfile(data);
        setEditForm({
          full_name: data.full_name || '',
          username: data.username || '',
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Count orders as buyer
      const { count: buyerOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user?.id);

      // Count orders as seller
      const { count: sellerOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user?.id);

      // Count products
      const { count: products } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user?.id);

      setStats({
        totalOrders: buyerOrders || 0,
        totalSales: sellerOrders || 0,
        totalProducts: products || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Refresh profile
      fetchProfile();
      alert('Photo de profil mise à jour !');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Erreur lors du téléchargement de la photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          username: editForm.username,
        })
        .eq('id', user?.id);

      if (error) throw error;

      fetchProfile();
      setEditing(false);
      alert('Profil mis à jour !');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p className="text-gray-500">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-dark mb-8">Mon Espace</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card - Left Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Cover Background */}
            <div className="h-24 bg-gradient-to-r from-primary to-blue-600"></div>
            
            {/* Avatar Section */}
            <div className="relative px-6 pb-6">
              <div className="relative -mt-12 mb-4">
                <div className="relative inline-block">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition border border-gray-200 disabled:opacity-50"
                  >
                    {uploading ? (
                      <svg className="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <Camera className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-dark">
                    {profile?.full_name || 'Utilisateur'}
                  </h2>
                  {profile?.is_verified && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                {profile?.username && (
                  <p className="text-gray-500">@{profile.username}</p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xl font-bold text-dark">{stats.totalProducts}</p>
                  <p className="text-xs text-gray-500">Produits</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xl font-bold text-dark">{stats.totalSales}</p>
                  <p className="text-xs text-gray-500">Ventes</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xl font-bold text-dark">{stats.totalOrders}</p>
                  <p className="text-xs text-gray-500">Achats</p>
                </div>
              </div>

              {/* Reputation */}
              <div className="flex items-center gap-2 p-3 bg-wzp/10 rounded-xl mb-4">
                <Star className="w-5 h-5 text-wzp" />
                <div>
                  <p className="text-sm font-medium text-dark">Réputation</p>
                  <p className="text-xs text-gray-500">{profile?.reputation_score || 0} points WZP</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition"
              >
                <LogOut className="w-5 h-5" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-dark">Informations du profil</h3>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 text-primary hover:text-blue-700 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Enregistrer
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nom complet</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Votre nom complet"
                    />
                  ) : (
                    <p className="text-dark font-medium">{profile?.full_name || 'Non renseigné'}</p>
                  )}
                </div>
              </div>

              {/* Username */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold mt-0.5">@</span>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nom d'utilisateur</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="votre_pseudo"
                    />
                  ) : (
                    <p className="text-dark font-medium">{profile?.username || 'Non renseigné'}</p>
                  )}
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-dark font-medium">{user?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Membre depuis</label>
                  <p className="text-dark font-medium">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Récemment'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-dark mb-4">Actions rapides</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="/products/new"
                className="flex items-center gap-3 p-4 bg-primary/5 hover:bg-primary/10 rounded-xl transition group"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-dark">Vendre</p>
                  <p className="text-xs text-gray-500">Ajouter un produit</p>
                </div>
              </a>

              <a
                href="/products"
                className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-dark">Acheter</p>
                  <p className="text-xs text-gray-500">Voir le marché</p>
                </div>
              </a>

              <a
                href="/orders"
                className="flex items-center gap-3 p-4 bg-wzp/5 hover:bg-wzp/10 rounded-xl transition group"
              >
                <div className="w-10 h-10 bg-wzp/10 rounded-lg flex items-center justify-center group-hover:bg-wzp/20 transition">
                  <Wallet className="w-5 h-5 text-wzp" />
                </div>
                <div>
                  <p className="font-medium text-dark">Commandes</p>
                  <p className="text-xs text-gray-500">Voir mes commandes</p>
                </div>
              </a>
            </div>
          </div>

          {/* Wallet Placeholder */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-400">Wallet Cardano (V2)</h3>
                <p className="text-sm text-gray-400">
                  Cette section affichera votre solde ADA et vos WZP à l'avenir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
