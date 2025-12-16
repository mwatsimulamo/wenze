import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CardanoChatBot from "./CardanoChatBot";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
      <Footer />
      <CardanoChatBot />
    </div>
  );
};

export default Layout;
