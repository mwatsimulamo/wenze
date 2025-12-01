import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Zap, ShoppingBag } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 lg:py-24 text-center bg-gradient-to-b from-white to-gray-50">
      
      {/* Hero Section */}
      <div className="max-w-4xl px-4 mb-16 animate-fade-in-up">
        <div className="inline-block bg-blue-50 text-primary px-4 py-1 rounded-full text-sm font-bold mb-6 tracking-wide uppercase">
          L'innovation made in Goma 🌋
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-dark mb-6 tracking-tight leading-tight">
          L'Avenir du Commerce <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Sécurisé & Rapide</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          WENZE réinvente l'échange à Goma. Achetez, Vendez, Echangez avec une garantie de sécurité totale grâce à la technologie Blockchain.
        </p>

        <div className="flex justify-center">
          <Link to="/login" className="btn-primary text-lg px-10 py-4 rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition flex items-center gap-2">
            <ShoppingBag size={20} />
            Commencer
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-6 mt-8">
        <div className="card group hover:bg-primary hover:text-white transition-all duration-300 border-none shadow-lg p-8 text-left rounded-3xl">
          <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition">
            <ShieldCheck className="text-primary group-hover:text-white h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Confiance Absolue</h3>
          <p className="text-gray-500 group-hover:text-blue-100 leading-relaxed">
            Fini les arnaques. Vos fonds sont protégés par Escrow jusqu'à ce que vous validiez la réception. La sécurité bancaire, simplifiée.
          </p>
        </div>

        <div className="card group hover:bg-wzp hover:text-white transition-all duration-300 border-none shadow-lg p-8 text-left rounded-3xl">
          <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition">
            <TrendingUp className="text-wzp group-hover:text-white h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Gagnez +</h3>
          <p className="text-gray-500 group-hover:text-orange-100 leading-relaxed">
            Chaque échange compte. Cumulez des points WZP et débloquez des avantages exclusifs à travers la ville.
          </p>
        </div>

        <div className="card group hover:bg-dark hover:text-white transition-all duration-300 border-none shadow-lg p-8 text-left rounded-3xl">
          <div className="bg-gray-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition">
            <Zap className="text-dark group-hover:text-white h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Vitesse Éclair</h3>
          <p className="text-gray-500 group-hover:text-gray-400 leading-relaxed">
            Connectez votre Wallet en 2 secondes. Transactions instantanées et transparentes. Le Web3 à portée de main.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;


