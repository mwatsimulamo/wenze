import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  Zap,
  CheckCircle,
  Star,
  TrendingUp,
  Smartphone,
  Shirt,
  UtensilsCrossed,
  Wand2,
  Hammer,
  Briefcase,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";

interface HomeStats {
  users: number;
  orders: number;
  completedOrders: number;
}

const Home = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [{ count: usersCount }, { count: ordersCount }, { count: completedCount }] =
          await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase.from("orders").select("*", { count: "exact", head: true }),
            supabase
              .from("orders")
              .select("*", { count: "exact", head: true })
              .eq("status", "completed"),
          ]);

        setStats({
          users: usersCount || 0,
          orders: ordersCount || 0,
          completedOrders: completedCount || 0,
        });
      } catch (e) {
        console.warn("Impossible de charger les statistiques:", e);
        setStats({ users: 0, orders: 0, completedOrders: 0 });
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchTrendingProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            *,
            profiles:seller_id(full_name, avatar_url, reputation_score, is_verified)
          `)
          .eq("status", "available")
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) throw error;
        setTrendingProducts(data || []);
      } catch (error) {
        console.error("Error fetching trending products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchStats();
    fetchTrendingProducts();
  }, []);

  const formatStat = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M+`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K+`;
    return value.toString();
  };

  const categories = [
    { id: "electronics", name: "Électronique", icon: Smartphone, color: "bg-blue-500" },
    { id: "fashion", name: "Mode", icon: Shirt, color: "bg-pink-500" },
    { id: "food", name: "Aliments", icon: UtensilsCrossed, color: "bg-orange-500" },
    { id: "beauty", name: "Beauté", icon: Wand2, color: "bg-purple-500" },
    { id: "diy", name: "Bricolage", icon: Hammer, color: "bg-yellow-500" },
    { id: "service", name: "Services", icon: Briefcase, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* 1. HERO SECTION SIMPLIFIÉ */}
      <div className="relative bg-gradient-to-br from-primary/5 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 min-h-[80vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <img
            src="/image.png"
            alt="Wenze Marketplace"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-cyan-50/50 dark:from-slate-900/50 dark:via-transparent dark:to-slate-950/50" />
        </div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {t("home.badge") || "Marketplace N°1 en RDC"}
            </div>

            {/* Titre */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
              {t("home.title") || "Le Commerce"} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-cyan-500">
                {t("home.subtitle") || "Réinventé en RDC"}
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t("home.description") ||
                "Fini les arnaques. Avec notre système Escrow blockchain, l'argent est bloqué jusqu'à la livraison. Achetez, vendez, respirez."}
            </p>

            {/* CTA Principal */}
            <Link
              to="/products"
              className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary-600 hover:scale-105 shadow-xl shadow-primary/25 transition-all duration-300 mb-8"
            >
              <ShoppingBag className="w-6 h-6" />
              Explorer le marché
              <ArrowRight className="w-5 h-5" />
            </Link>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center lg:justify-start gap-8 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Escrow Blockchain</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Vendeurs Vérifiés</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Support 24/7</span>
              </div>
            </div>
            </div>

            {/* Image Section */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
                <img
                  src="/image.png"
                  alt="Wenze Marketplace - Commerce sécurisé en RDC"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-green-500 p-2 rounded-xl">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Sécurisé par Blockchain</p>
                        <p className="text-xs text-slate-200">Fonds protégés en escrow</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS MINIMALISTES */}
      <div className="container mx-auto px-4 lg:px-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary mb-2">
                {loadingStats ? "…" : formatStat(stats?.users ?? 0)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("home.stats.users") || "Utilisateurs"}
              </div>
            </div>
            <div className="text-center border-l border-r border-slate-200 dark:border-slate-700">
              <div className="text-4xl font-extrabold text-primary mb-2">
                {loadingStats ? "…" : formatStat(stats?.orders ?? 0)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("home.stats.transactions") || "Transactions"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary mb-2">
                {loadingStats ? "…" : formatStat(stats?.completedOrders ?? 0)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Escrow complétés
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CATÉGORIES POPULAIRES */}
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Parcourir par catégorie
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Trouvez exactement ce que vous cherchez
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center hover:border-primary hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <category.icon className="w-8 h-8 text-white" />
              </div>
              <div className="font-semibold text-slate-900 dark:text-white">
                {category.name}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. PRODUITS TENDANCES */}
      {!loadingProducts && trendingProducts.length > 0 && (
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Produits tendances
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Les produits les plus populaires en ce moment
              </p>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
            >
              Voir tout
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {trendingProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                image_url={product.image_url}
                price_ada={product.price_ada}
                price_fc={product.price_fc}
                location={product.location}
                category={product.category}
                created_at={product.created_at}
                seller={product.profiles}
                isTrending={true}
              />
            ))}
          </div>
          <div className="text-center mt-8 md:hidden">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-primary font-semibold"
            >
              Voir tout
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}

      {/* 5. COMMENT ÇA MARCHE */}
      <div className="container mx-auto px-4 lg:px-8">
        <div className="bg-gradient-to-br from-primary/5 to-cyan-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              Comment ça marche ?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Trois étapes simples pour acheter et vendre en toute sécurité
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Choisissez un produit
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Parcourez notre marketplace et trouvez ce qui vous intéresse
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Paiement sécurisé
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Les fonds sont bloqués en escrow blockchain jusqu'à la livraison
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Confirmez la réception
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Validez votre commande et les fonds sont libérés automatiquement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. CTA FINAL */}
      <div className="container mx-auto px-4 lg:px-8">
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui font confiance à WENZE
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/products"
              className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-slate-100 transition-colors"
            >
              Explorer le marché
            </Link>
            <Link
              to="/signup"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
