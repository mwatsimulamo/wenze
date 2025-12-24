import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useBlockchain } from "../context/BlockchainContext";
import { supabase } from "../lib/supabase";
import {
  Menu,
  X,
  User as UserIcon,
  Wallet,
  LogOut,
  ChevronDown,
  Copy,
  Check,
  Settings,
  LayoutDashboard,
  ArrowLeftRight,
  Camera,
  Package,
  Sun,
  Moon,
  Languages,
  Phone,
  MessageCircle,
  ExternalLink,
  Lightbulb,
} from "lucide-react";
import WalletModal, { WalletData } from "./WalletModal";
import ExchangeOperators from "./ExchangeOperators";
import { logger } from "../utils/logger";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { wallet: connectedWallet, connectWallet, disconnectWallet, network } = useBlockchain();
  const navigate = useNavigate();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    if (data) setProfile(data);
  }, [user]);

  const fetchNotificationCount = useCallback(async () => {
    if (!user) return;

    try {
      // Récupérer uniquement les NOUVELLES commandes de l'utilisateur (acheteur ou vendeur)
      // Nouvelles = créées dans les dernières 24 heures
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      const oneDayAgoISO = oneDayAgo.toISOString();

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, buyer_id, seller_id, status, created_at, updated_at, order_mode, proposed_price, final_price, escrow_status"
        )
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .neq("status", "completed")
        .neq("status", "disputed")
        .gte("created_at", oneDayAgoISO); // Uniquement les commandes créées dans les dernières 24h

      if (ordersError) {
        logger.error("Error fetching orders for notifications:", ordersError);
        return;
      }

      let count = 0;

      if (orders && orders.length > 0) {
        // Compter uniquement les NOUVELLES commandes nécessitant une action
        for (const order of orders) {
          const isBuyer = order.buyer_id === user.id;
          const isSeller = order.seller_id === user.id;

          // Pour le vendeur : uniquement les NOUVELLES commandes (créées dans les dernières 24h)
          if (isSeller) {
            // Nouvelle commande en attente
            if (order.status === "pending") {
              count++;
            }
            // Nouvelle commande payée (escrow ouvert)
            else if (order.status === "escrow_web2") {
              count++;
            }
            // Nouvelle négociation en attente d'acceptation par le vendeur
            else if (
              order.order_mode === "negotiation" &&
              order.proposed_price &&
              !order.final_price &&
              order.status === "pending"
            ) {
              count++;
            }
          }

          // Pour l'acheteur : commande confirmée (mais seulement si la commande est nouvelle)
          if (isBuyer) {
            if (order.status === "shipped") {
              count++;
            }
            // Négociation acceptée, paiement en attente (nouvelle)
            if (
              order.order_mode === "negotiation" &&
              order.final_price &&
              order.escrow_status !== "open" &&
              order.status === "pending"
            ) {
              count++;
            }
          }
        }
      }

      setNotificationCount(count);
    } catch (error) {
      logger.error("Error fetching notification count:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchNotificationCount();
      // Polling toutes les 30 secondes pour les nouvelles notifications (optimisé)
      const interval = setInterval(() => {
        fetchNotificationCount();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setNotificationCount(0);
    }
  }, [user, fetchProfile, fetchNotificationCount]);

  // Écouter l'événement pour ouvrir automatiquement le modal wallet
  useEffect(() => {
    const handleOpenWalletModal = () => {
      setIsWalletModalOpen(true);
    };

    window.addEventListener('open-wallet-modal', handleOpenWalletModal);
    return () => {
      window.removeEventListener('open-wallet-modal', handleOpenWalletModal);
    };
  }, []);

  // Fermer le menu mobile en cliquant en dehors
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menuElement = document.querySelector(".mobile-menu-container");
      const buttonElement = document.querySelector(".mobile-menu-button");

      if (
        menuElement &&
        !menuElement.contains(target) &&
        buttonElement &&
        !buttonElement.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleWalletConnect = async (walletData: WalletData) => {
    connectWallet(walletData);
    
    // Sauvegarder automatiquement l'adresse wallet dans le profil
    if (user && walletData.addressBech32) {
      try {
        await supabase
          .from('profiles')
          .update({ wallet_address: walletData.addressBech32 })
          .eq('id', user.id);
        console.log('✅ Adresse wallet sauvegardée dans le profil');
      } catch (error) {
        console.warn('⚠️ Erreur lors de la sauvegarde de l\'adresse wallet:', error);
      }
    }
  };

  const copyWalletAddress = () => {
    if (connectedWallet?.addressBech32) {
      navigator.clipboard.writeText(connectedWallet.addressBech32);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    setShowWalletDropdown(false);
  };

  const handleSignOut = async () => {
    await signOut();
    disconnectWallet();
    navigate("/login");
  };

  const formatAddress = (address: string) => {
    if (address.length > 16) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  return (
    <>
      <nav className="bg-primary text-white shadow-lg sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src="/logo.png"
                alt="WENZE"
                className="h-10 w-auto object-contain bg-white rounded-full p-1 shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
              <div className="hidden h-10 w-10 bg-white rounded-full flex items-center justify-center text-primary font-extrabold shadow-md">
                W
              </div>
              <span className="font-bold text-2xl tracking-tight hidden sm:block">
                WENZE
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              {user && (
                <Link
                  to="/dashboard"
                  className="font-medium hover:text-accent transition"
                >
                  {t("nav.dashboard")}
                </Link>
              )}
              <Link
                to="/products"
                className="font-medium hover:text-accent transition"
              >
                {t("nav.market")}
              </Link>
              {user && (
                <Link
                  to="/orders"
                  className="relative font-medium hover:text-accent transition flex items-center gap-2"
                >
                  {t("nav.orders")}
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-lg">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="p-2 hover:bg-white/10 rounded-full transition flex items-center gap-1"
                  title="Changer la langue"
                  aria-label="Language selector"
                >
                  <Languages className="w-5 h-5" />
                  <span className="text-xs font-bold">
                    {language.toUpperCase()}
                  </span>
                </button>
                {showLangDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                    <button
                      onClick={() => {
                        setLanguage("fr");
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 ${
                        language === "fr"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <span className="text-sm font-semibold">FR</span>
                      <span>Français</span>
                    </button>
                    <button
                      onClick={() => {
                        setLanguage("sw");
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 ${
                        language === "sw"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <span className="text-sm font-semibold">SW</span>
                      <span>Kiswahili (DRC)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dark/Light Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-white/10 rounded-full transition"
                title={theme === "dark" ? "Mode clair" : "Mode sombre"}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {user ? (
                <div className="flex items-center space-x-3 ml-4">
                  {/* Exchange Operators Button */}
                  <ExchangeOperators variant="button" />

                  {/* Wallet Button */}
                  {connectedWallet ? (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowWalletDropdown(!showWalletDropdown)
                        }
                        // Changement ici : Emerald vers Cyan (plus proche du bleu)
                        className="flex items-center space-x-2 px-2 py-1.5 rounded-full text-sm font-medium transition shadow-sm bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white border border-white/10"
                      >
                        <img
                          src={connectedWallet.icon}
                          alt={connectedWallet.name}
                          className="w-5 h-5 rounded-full bg-white/20 p-0.5"
                        />
                        <span>
                          {connectedWallet.balance.toLocaleString("fr-FR", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          <span className="text-xs">t₳</span>
                        </span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${
                            showWalletDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Dropdown - Compact */}
                      {showWalletDropdown && (
                        <div className="absolute right-0 mt-2 w-72 bg-[#0d1421] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-fade-in">
                          <div className="p-3 border-b border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                                <span className="text-white text-sm font-medium">
                                  {connectedWallet.name}
                                </span>
                              </div>
                              <span className="text-emerald-400 font-bold">
                                {connectedWallet.balance.toLocaleString(
                                  "fr-FR",
                                  { maximumFractionDigits: 4 }
                                )}{" "}
                                t₳
                              </span>
                            </div>
                            <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2">
                              <code className="flex-1 text-xs text-gray-400 font-mono truncate">
                                {formatAddress(connectedWallet.addressBech32)}
                              </code>
                              <button
                                onClick={copyWalletAddress}
                                className="p-1 hover:bg-white/10 rounded transition"
                              >
                                {addressCopied ? (
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="p-2">
                            <button
                              onClick={handleDisconnectWallet}
                              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition flex items-center gap-2"
                            >
                              <LogOut className="w-4 h-4" />
                              Déconnecter
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsWalletModalOpen(true)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition shadow-sm bg-white text-primary hover:bg-gray-100"
                    >
                      <Wallet size={18} />
                      <span>Wallet</span>
                    </button>
                  )}

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowProfileDropdown(!showProfileDropdown)
                      }
                      className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-full transition"
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <UserIcon size={18} />
                        </div>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          showProfileDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showProfileDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                        {/* Profile Info */}
                        <div className="p-4 bg-gradient-to-r from-primary to-blue-600">
                          <div className="flex items-center gap-3">
                            {profile?.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt="Profile"
                                className="w-12 h-12 rounded-full object-cover border-2 border-white/50"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                <UserIcon size={24} className="text-white" />
                              </div>
                            )}
                            <div className="text-white">
                              <p className="font-semibold">
                                {profile?.full_name || "Utilisateur"}
                              </p>
                              <p className="text-sm text-blue-100 truncate">
                                {user?.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <Link
                            to="/dashboard"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                          >
                            <LayoutDashboard className="w-5 h-5 text-gray-400" />
                            <span className="font-medium">
                              {t("nav.dashboard")}
                            </span>
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                          >
                            <Settings className="w-5 h-5 text-gray-400" />
                            <span className="font-medium">
                              {t("nav.profile")}
                            </span>
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                          <button
                            onClick={() => {
                              setShowProfileDropdown(false);
                              handleSignOut();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">
                              {t("nav.logout")}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="font-medium hover:text-accent">
                    {t("nav.login")}
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-white text-primary font-bold px-5 py-2 rounded-full hover:bg-slate-100 transition shadow-md"
                  >
                    {t("nav.join")}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                className="mobile-menu-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu-container md:hidden bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-xl border-t border-gray-100 dark:border-gray-800 absolute w-full left-0 max-h-[calc(100vh-4rem)] overflow-y-auto z-[60] relative">
            <div className="px-4 pt-4 pb-6 space-y-4">
              {/* User Profile Section - En haut si connecté */}
              {user && (
                <>
                  <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-4 -mx-1">
                    <div className="flex items-center gap-3 mb-3">
                      {/* Profile Photo */}
                      <div className="relative">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Profile"
                            className="w-16 h-16 rounded-xl object-cover border-2 border-white/30"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                            <UserIcon size={28} className="text-white" />
                          </div>
                        )}
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-lg shadow flex items-center justify-center"
                        >
                          <Camera size={14} className="text-primary" />
                        </Link>
                      </div>

                      {/* Profile Info */}
                      <div className="flex-1 min-w-0 text-white">
                        <p className="font-semibold text-lg truncate">
                          {profile?.full_name || "Utilisateur"}
                        </p>
                        <p className="text-sm text-blue-100 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Quick Profile Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-center gap-2 py-2.5 bg-white/20 rounded-lg text-white text-sm font-medium active:bg-white/30 transition"
                      >
                        <Settings size={18} />
                        <span>{t("nav.profile")}</span>
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-center gap-2 py-2.5 bg-white/20 rounded-lg text-white text-sm font-medium active:bg-white/30 transition"
                      >
                        <LayoutDashboard size={18} />
                        <span>{t("nav.dashboard")}</span>
                      </Link>
                    </div>
                  </div>

                  {/* Séparateur visuel */}
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700"></div>
                </>
              )}

              {/* Navigation Principale */}
              <div className="space-y-2">
                <h3 className="px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("nav.market")}
                </h3>
                <Link
                  to="/products"
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 font-medium text-base transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Package size={22} className="text-primary" />
                  <span>{t("nav.market")}</span>
                </Link>
              </div>

              {user && (
                <div className="space-y-2">
                  <h3 className="px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Navigation
                  </h3>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 font-medium text-base transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard size={22} className="text-primary" />
                    <span>{t("nav.dashboard")}</span>
                  </Link>
                  <Link
                    to="/orders"
                    className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 font-medium text-base transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Package size={22} className="text-primary" />
                    <span>{t("nav.orders")}</span>
                    {notificationCount > 0 && (
                      <span className="ml-auto flex items-center justify-center min-w-[24px] h-[24px] px-2 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* Wallet & Exchange Section */}
              {user && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700"></div>

                  <div className="space-y-2">
                    <h3 className="px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Wallet & Échange
                    </h3>

                    {/* Exchange Operators Button Mobile */}
                    <button
                      onClick={() => {
                        setShowExchangeModal(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 text-left font-medium text-orange-600 dark:text-orange-400 active:bg-orange-100 dark:active:bg-orange-900/30 transition"
                    >
                      <ArrowLeftRight size={22} />
                      <div className="flex-1">
                        <span className="block font-semibold">
                          {language === 'fr' ? 'Échanger ADA ↔ FC' : 'Badilisha ADA ↔ FC'}
                        </span>
                        <span className="text-xs text-orange-500 dark:text-orange-400">
                          {language === 'fr' ? 'Opérateurs disponibles' : 'Waendeshaji walio nao'}
                        </span>
                      </div>
                    </button>

                    {/* Mobile Wallet Section */}
                    {connectedWallet ? (
                      <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={connectedWallet.icon}
                              alt={connectedWallet.name}
                              className="w-7 h-7 rounded-lg"
                            />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                              {connectedWallet.name}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                            {connectedWallet.balance.toLocaleString("fr-FR", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            <span className="text-sm">t₳</span>
                          </span>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2.5 mb-3">
                          <p className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">
                            {formatAddress(connectedWallet.addressBech32)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            handleDisconnectWallet();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-center py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 rounded-lg transition"
                        >
                          Déconnecter le wallet
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setIsWalletModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-left font-medium text-primary dark:text-blue-400 active:bg-blue-100 dark:active:bg-blue-900/30 transition"
                      >
                        <Wallet size={22} />
                        <span className="font-semibold">
                          {t("nav.connect_wallet")}
                        </span>
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Paramètres */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700"></div>

              <div className="space-y-2">
                <h3 className="px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Paramètres
                </h3>

                {/* Language Selector Mobile */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Languages size={20} className="text-primary" />
                    <span className="font-medium text-base">
                      Lugha / Langue
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setLanguage("fr");
                        setIsMenuOpen(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                        language === "fr"
                          ? "bg-primary text-white shadow-md"
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      FR
                    </button>
                    <button
                      onClick={() => {
                        setLanguage("sw");
                        setIsMenuOpen(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                        language === "sw"
                          ? "bg-primary text-white shadow-md"
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      SW
                    </button>
                  </div>
                </div>

                {/* Dark Mode Toggle Mobile */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Moon size={20} className="text-primary" />
                    ) : (
                      <Sun size={20} className="text-primary" />
                    )}
                    <span className="font-medium text-base">Thème</span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-full bg-white dark:bg-gray-700 shadow-sm transition active:scale-95"
                    aria-label="Toggle theme"
                  >
                    {theme === "dark" ? (
                      <Sun className="w-6 h-6 text-yellow-500" />
                    ) : (
                      <Moon className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Boutons Login/Signup si non connecté */}
              {!user && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/login"
                      className="block text-center py-3.5 rounded-xl border-2 border-primary font-semibold text-primary hover:bg-primary/5 active:bg-primary/10 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t("nav.login")}
                    </Link>
                    <Link
                      to="/signup"
                      className="block text-center py-3.5 rounded-xl bg-primary text-white font-bold shadow-md hover:bg-blue-700 active:bg-blue-800 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t("nav.join")}
                    </Link>
                  </div>
                </>
              )}

              {/* Bouton Déconnexion - Bien visible en bas */}
              {user && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-red-200 to-transparent dark:via-red-800"></div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 text-white font-bold text-base shadow-lg transition transform active:scale-95"
                  >
                    <LogOut size={24} />
                    <span>{t("nav.logout")}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnect}
      />

      {/* Exchange Operators Modal (for mobile) */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm md:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {language === 'fr' ? 'Opérateurs d\'Échange' : 'Waendeshaji wa Ubadilishaji'}
                  </h2>
                  <p className="text-orange-100 text-sm mt-1">
                    {language === 'fr' 
                      ? 'Choisissez un opérateur pour échanger ADA ↔ FC' 
                      : 'Chagua mwendeshaji kubadilisha ADA ↔ FC'}
                  </p>
                </div>
                <button
                  onClick={() => setShowExchangeModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Operators List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* AdaEx */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">AdaEx</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'fr' 
                        ? 'Plateforme en ligne pour échanger ADA ↔ FC via Mobile Money'
                        : 'Jukwaa la mtandaoni la kubadilisha ADA ↔ FC kupitia Mobile Money'}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                    {language === 'fr' ? 'En ligne' : 'Mtandaoni'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    window.open('https://app.adaex.app/', '_blank', 'noopener,noreferrer');
                    setShowExchangeModal(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  {language === 'fr' ? 'Ouvrir le site' : 'Fungua tovuti'}
                </button>
              </div>

              {/* Yann Exchange */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Yann Exchange</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'fr' 
                        ? 'Opérateur local - Réponse instantanée via WhatsApp ou Appel'
                        : 'Mwendeshaji wa ndani - Jibu la papo hapo kupitia WhatsApp au Simu'}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                    {language === 'fr' ? 'Local' : 'Ndani'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const message = language === 'fr' 
                        ? 'Bonjour, je souhaite échanger des ADA contre des FC via WENZE.'
                        : 'Hujambo, nataka kubadilisha ADA na FC kupitia WENZE.';
                      window.open(`https://wa.me/243999320786?text=${encodeURIComponent(message)}`, '_blank');
                      setShowExchangeModal(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = 'tel:+243999320786';
                      setShowExchangeModal(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg transition text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    +243 999320786
                  </button>
                </div>
              </div>

              {/* Jules Exchange */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Jules Exchange</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'fr' 
                        ? 'Opérateur local - Réponse instantanée via WhatsApp ou Appel'
                        : 'Mwendeshaji wa ndani - Jibu la papo hapo kupitia WhatsApp au Simu'}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                    {language === 'fr' ? 'Local' : 'Ndani'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const message = language === 'fr' 
                        ? 'Bonjour, je souhaite échanger des ADA contre des FC via WENZE.'
                        : 'Hujambo, nataka kubadilisha ADA na FC kupitia WENZE.';
                      window.open(`https://wa.me/243970204238?text=${encodeURIComponent(message)}`, '_blank');
                      setShowExchangeModal(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = 'tel:+243970204238';
                      setShowExchangeModal(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg transition text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    +243 970204238
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                {language === 'fr' 
                  ? 'Les opérateurs locaux répondent généralement en quelques minutes'
                  : 'Waendeshaji wa ndani hujibu kwa kawaida ndani ya dakika chache'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showWalletDropdown || showProfileDropdown || showLangDropdown || showExchangeModal) && (
        <div
          className="fixed inset-0 z-30 md:z-30"
          onClick={() => {
            setShowWalletDropdown(false);
            setShowProfileDropdown(false);
            setShowLangDropdown(false);
            setShowExchangeModal(false);
          }}
        />
      )}
    </>
  );
};

export default Navbar;
