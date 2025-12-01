import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Users, TrendingUp } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Fonction pour traduire les erreurs Supabase en français
const translateError = (errorMessage: string): string => {
  const errorTranslations: { [key: string]: string } = {
    'User already registered': 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.',
    'A user with this email address has already been registered': 'Cette adresse email est déjà utilisée. Veuillez vous connecter ou utiliser une autre adresse.',
    'Email rate limit exceeded': 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
    'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
    'Unable to validate email address: invalid format': 'Format d\'email invalide. Veuillez vérifier votre adresse.',
    'Signup requires a valid password': 'Veuillez entrer un mot de passe valide.',
    'To signup, please provide your email': 'Veuillez entrer votre adresse email.',
  };

  // Vérifier si le message contient une des clés connues
  for (const [key, value] of Object.entries(errorTranslations)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Si l'erreur contient "already" et "email", c'est probablement un doublon
  if (errorMessage.toLowerCase().includes('already') && errorMessage.toLowerCase().includes('email')) {
    return 'Cette adresse email est déjà utilisée. Veuillez vous connecter.';
  }

  // Retourner le message original si pas de traduction
  return errorMessage;
};

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'error' | 'warning'>('error');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Vérification côté client
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setErrorType('error');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) {
      setError(translateError(error.message));
      setErrorType('error');
      setLoading(false);
    } else if (data?.user?.identities?.length === 0) {
      // Supabase retourne un user mais sans identities si l'email existe déjà
      setError('Cette adresse email est déjà utilisée. Veuillez vous connecter.');
      setErrorType('warning');
      setLoading(false);
    } else {
      alert('Inscription réussie ! Vérifiez votre email ou connectez-vous.');
      navigate('/login');
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-wenze-dark via-primary to-blue-600">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-40 left-10 w-80 h-80 bg-wzp rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-300 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo */}
          <div className="mb-8 animate-fade-in">
            <img src="/logo.png" alt="Wenze" className="h-16 w-auto animate-float" />
          </div>

          <h1 className="text-5xl font-bold mb-4 animate-slide-up">
            Rejoignez <span className="text-wzp">Wenze</span>
          </h1>
          <p className="text-xl text-blue-100 mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Créez votre compte et commencez à vendre ou acheter en toute sécurité.
          </p>

          {/* Stats / Benefits */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Users className="w-8 h-8 text-wzp mb-3" />
              <h3 className="text-2xl font-bold">10K+</h3>
              <p className="text-sm text-blue-200">Utilisateurs actifs</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <TrendingUp className="w-8 h-8 text-wzp mb-3" />
              <h3 className="text-2xl font-bold">50K+</h3>
              <p className="text-sm text-blue-200">Transactions réussies</p>
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-wzp rounded-full flex items-center justify-center text-xl font-bold">
                JM
              </div>
              <div>
                <p className="font-semibold">Jean-Marc K.</p>
                <p className="text-sm text-blue-200">Vendeur vérifié</p>
              </div>
            </div>
            <p className="text-blue-100 italic">
              "Wenze m'a permis de développer mon business en toute confiance. Le système d'escrow est vraiment rassurant !"
            </p>
          </div>

          {/* Trust Badge */}
          <div className="mt-8 flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Shield className="w-5 h-5 text-wzp" />
            <p className="text-sm text-blue-200">
              Vos données sont protégées et ne seront jamais partagées
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-gray-50">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.png" alt="Wenze" className="h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-dark">
              Rejoignez <span className="text-primary">Wenze</span>
            </h1>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-dark">Créer un compte</h2>
              <p className="text-gray-500 mt-2">C'est gratuit et rapide</p>
            </div>

            {error && (
              <div className={`p-4 rounded-xl mb-6 text-sm border animate-slide-up ${
                errorType === 'warning' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-red-50 text-red-600 border-red-100'
              }`}>
                <p className="font-medium mb-1">
                  {errorType === 'warning' ? '⚠️ Attention' : '❌ Erreur'}
                </p>
                <p>{error}</p>
                {errorType === 'warning' && (
                  <Link to="/login" className="inline-block mt-2 text-primary font-semibold hover:underline">
                    → Se connecter
                  </Link>
                )}
              </div>
            )}

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3.5 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              {googleLoading ? 'Inscription en cours...' : 'Continuer avec Google'}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-sm text-gray-400">ou avec votre email</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none text-base"
                  placeholder="Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none text-base"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none text-base"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-2">Minimum 6 caractères</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Création du compte...
                  </span>
                ) : (
                  'Créer mon compte'
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-8 text-center text-gray-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            En créant un compte, vous acceptez nos{' '}
            <a href="#" className="underline hover:text-gray-600">Conditions d'utilisation</a>
            {' '}et notre{' '}
            <a href="#" className="underline hover:text-gray-600">Politique de confidentialité</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
