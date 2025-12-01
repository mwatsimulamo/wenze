import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
      <footer className="bg-slate-900 dark:bg-gray-950 text-gray-400 py-12 mt-auto">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Wenze" className="h-10 w-auto" />
              <span className="text-xl font-bold text-white">WENZE</span>
            </div>
            <p className="text-sm text-center md:text-left">
              © 2024 WENZE. Tous droits réservés. Fait avec ❤️ à Goma.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm hover:text-white transition">Conditions</a>
              <a href="#" className="text-sm hover:text-white transition">Confidentialité</a>
              <a href="#" className="text-sm hover:text-white transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
