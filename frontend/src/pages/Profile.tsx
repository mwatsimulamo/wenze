import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getWZPTotal } from '../utils/getWZPTotal';
import { 
  Camera, 
  User, 
  Mail, 
  AtSign,
  Save,
  Check,
  ArrowLeft,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Profile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
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
  
  const [form, setForm] = useState({
    full_name: '',
    username: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWZPTotal();
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
          <svg className="animate-spin h-8 w-8 sm:h-10 sm:w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p className="text-gray-500 text-sm sm:text-base">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-1 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Link 
          to="/dashboard" 
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark">Mon Profil</h1>
          <p className="text-gray-500 mt-0.5 sm:mt-1 text-sm sm:text-base">Gérez vos informations</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Cover & Avatar */}
        <div className="relative">
          <div className="h-24 sm:h-32 bg-gradient-to-r from-primary via-blue-500 to-violet-500"></div>
          
          <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl border-4 border-white shadow-xl object-cover bg-white"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl border-4 border-white shadow-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-bold text-white">
                    {form.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 text-white"
              >
                {uploading ? (
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
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

        {/* Form */}
        <div className="pt-16 sm:pt-20 px-4 sm:px-8 pb-6 sm:pb-8">
          {/* Success Message */}
          {saved && (
            <div className="mb-4 sm:mb-6 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-green-50 text-green-600 rounded-lg sm:rounded-xl border border-green-100 animate-fade-in">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">Profil mis à jour !</span>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                Nom complet
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition outline-none text-dark text-sm sm:text-base"
                placeholder="Votre nom complet"
              />
            </div>

            {/* Username */}
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                <AtSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition outline-none text-dark text-sm sm:text-base"
                placeholder="votre_pseudo"
              />
              <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-400">
                Votre identifiant unique sur la plateforme
              </p>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                Adresse email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-100 border border-gray-200 rounded-lg sm:rounded-xl text-gray-500 cursor-not-allowed text-sm sm:text-base"
              />
              <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-400">
                L'email ne peut pas être modifié
              </p>
            </div>

            {/* WZP Points */}
            <div className="pt-3 sm:pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg sm:rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Points WZP</p>
                    <p className="text-lg sm:text-xl font-bold text-amber-600">{wzpTotal.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    Gagnés via transactions ADA
                  </p>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="pt-3 sm:pt-4 border-t border-gray-100">
              <p className="text-xs sm:text-sm text-gray-500">
                Membre depuis{' '}
                <span className="font-medium text-dark">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'récemment'
                  }
                </span>
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-6 sm:mt-8 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold py-3.5 sm:py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Enregistrer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
