import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getWZPTotal } from '../utils/getWZPTotal';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  User, 
  Mail, 
  AtSign,
  Save,
  Check,
  ArrowLeft,
  Award,
  Edit3,
  ShieldCheck,
  Calendar,
  TrendingUp,
  Package,
  ShoppingCart
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_verified?: boolean;
  wallet_address?: string;
}

const Profile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wzpTotal, setWzpTotal] = useState<number>(0);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalOrders: 0,
  });
  
  const [form, setForm] = useState({
    full_name: '',
    username: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWZPTotal();
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
        setForm({
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

  const fetchWZPTotal = async () => {
    if (user?.id) {
      const total = await getWZPTotal(user.id);
      setWzpTotal(total);
    }
  };

  const fetchStats = async () => {
    if (!user?.id) return;
    
    try {
      const [products, sales, orders] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', user.id),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'completed'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('buyer_id', user.id),
      ]);

      setStats({
        totalProducts: products.count || 0,
        totalSales: sales.count || 0,
        totalOrders: orders.count || 0,
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

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      fetchProfile();
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
          full_name: form.full_name,
          username: form.username,
        })
        .eq('id', user?.id);

      if (error) throw error;

      fetchProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  };

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
    <div className="max-w-4xl mx-auto px-4 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Retour au tableau de bord</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Mon Profil</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos informations personnelles</p>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {saving ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800 animate-fade-in">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Profil mis à jour avec succès !</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card - Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-r from-primary via-blue-500 to-violet-500 relative">
              <div className="absolute bottom-0 left-6 transform translate-y-1/2">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-800 shadow-xl object-cover bg-white"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-800 shadow-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {form.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary rounded-xl shadow-lg flex items-center justify-center hover:bg-primary-600 transition disabled:opacity-50 text-white"
                  >
                    {uploading ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <Camera className="w-5 h-5" />
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
            </div>

            {/* Profile Info */}
            <div className="pt-16 pb-6 px-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {form.full_name || 'Utilisateur'}
                </h2>
                {profile?.is_verified && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    Vérifié
                  </div>
                )}
              </div>
              {profile?.username && (
                <p className="text-slate-500 dark:text-slate-400 mb-6">@{profile.username}</p>
              )}

              {/* Form Fields */}
              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    <User className="w-4 h-4 text-slate-400" />
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-slate-600 transition outline-none text-slate-900 dark:text-white"
                    placeholder="Votre nom complet"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    <AtSign className="w-4 h-4 text-slate-400" />
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-slate-600 transition outline-none text-slate-900 dark:text-white"
                    placeholder="votre_pseudo"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Votre identifiant unique sur la plateforme
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    L'email ne peut pas être modifié
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* WZP Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Points WZP</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{wzpTotal.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
              Gagnés via transactions ADA
            </p>
          </div>

          {/* Stats Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Produits</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{stats.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Ventes</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{stats.totalSales}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-violet-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Achats</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{stats.totalOrders}</span>
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Membre depuis</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'récemment'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
