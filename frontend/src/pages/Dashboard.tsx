import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-secondary mb-6">Mon Espace</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profil Card */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Mon Profil</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>ID:</strong> {user?.id}</p>
          <p className="mt-2 text-sm text-gray-500">
            Les données complètes (nom, avatar, réputation) viendront de la table 'profiles'.
          </p>
        </div>

        {/* Wallet Placeholder Card */}
        <div className="card bg-gray-50 border-dashed border-2 border-gray-300">
          <h2 className="text-xl font-bold mb-4 text-gray-500">Wallet Cardano (V2)</h2>
          <p className="text-gray-500 italic">
            Cette section affichera votre solde ADA et vos UZP convertis à l'avenir.
          </p>
          <button className="mt-4 px-4 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed">
            Gérer mon Wallet (Bientôt)
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-secondary mt-10 mb-4">Mes Activités récentes</h2>
      <div className="card">
        <p className="text-center text-gray-500 py-8">Aucune activité récente.</p>
      </div>
    </div>
  );
};

export default Dashboard;


