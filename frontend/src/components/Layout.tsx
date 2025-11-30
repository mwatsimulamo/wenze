import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-dark text-gray-400 py-8 text-center mt-auto">
        <p className="mb-2">© 2024 WENZE. Tous droits réservés.</p>
        <p className="text-sm text-gray-600">Fait avec ❤️ à Goma.</p>
      </footer>
    </div>
  );
};

export default Layout;


