import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ShoppingBag, User as UserIcon, Wallet } from 'lucide-react';
import { connectWallet } from '../blockchain/connectWallet';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleConnectWallet = async () => {
    const address = await connectWallet();
    if (address) {
      setWalletAddress(address);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-primary text-white shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/logo.png" 
              alt="WENZE" 
              className="h-10 w-auto object-contain bg-white rounded-full p-1 shadow-md" 
              onError={(e) => {
                // Fallback si l'image n'est pas trouvée
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* Fallback Logo text if image fails */}
            <div className="hidden h-10 w-10 bg-white rounded-full flex items-center justify-center text-primary font-extrabold shadow-md">
              W
            </div>
            <span className="font-bold text-2xl tracking-tight hidden sm:block">WENZE</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="font-medium hover:text-accent transition">Marché</Link>
            {user && <Link to="/orders" className="font-medium hover:text-accent transition">Commandes</Link>}
            
            {user ? (
              <div className="flex items-center space-x-3 ml-4">
                <button 
                  onClick={handleConnectWallet}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition shadow-sm ${walletAddress ? 'bg-green-500 hover:bg-green-600' : 'bg-white text-primary hover:bg-gray-100'}`}
                >
                  <Wallet size={18} />
                  <span>{walletAddress ? 'Connecté' : 'Wallet'}</span>
                </button>
                
                <Link to="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition" title="Mon Profil">
                  <UserIcon size={24} />
                </Link>
                
                <button onClick={handleSignOut} className="p-2 hover:bg-red-500 rounded-full transition" title="Déconnexion">
                  <X size={24} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="font-medium hover:text-accent">Connexion</Link>
                <Link to="/signup" className="bg-white text-primary font-bold px-5 py-2 rounded-full hover:bg-gray-100 transition shadow-md">
                  Rejoindre
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white text-gray-800 px-4 pt-4 pb-6 space-y-3 shadow-xl border-t border-gray-100 absolute w-full left-0">
           <Link 
             to="/products" 
             className="block px-4 py-3 rounded-lg hover:bg-gray-50 font-medium text-lg"
             onClick={() => setIsMenuOpen(false)}
           >
             Marché
           </Link>
           {user && (
             <Link 
               to="/orders" 
               className="block px-4 py-3 rounded-lg hover:bg-gray-50 font-medium text-lg"
               onClick={() => setIsMenuOpen(false)}
             >
               Commandes
             </Link>
           )}
           {!user && (
             <div className="grid grid-cols-2 gap-4 mt-4">
                <Link 
                  to="/login" 
                  className="block text-center py-3 rounded-lg border border-gray-200 font-medium text-primary hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link 
                  to="/signup" 
                  className="block text-center py-3 rounded-lg bg-primary text-white font-bold shadow-md hover:bg-blue-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  S'inscrire
                </Link>
             </div>
           )}
           {user && (
             <>
                <div className="border-t border-gray-100 my-2"></div>
                <button 
                  onClick={() => { handleConnectWallet(); setIsMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-left font-medium text-blue-600"
                >
                   <Wallet size={20} />
                   <span>{walletAddress ? 'Wallet Connecté' : 'Connecter Wallet'}</span>
                </button>
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserIcon size={20} />
                  <span>Mon Espace</span>
                </Link>
                <button 
                  onClick={() => { handleSignOut(); setIsMenuOpen(false); }} 
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-500 font-medium"
                >
                  <X size={20} />
                  <span>Déconnexion</span>
                </button>
             </>
           )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;


