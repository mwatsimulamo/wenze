import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { t } = useLanguage();
  return (
    <div className="relative px-1 sm:px-0">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 mb-10 sm:mb-16">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-1/2 -right-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-violet-500/20 rounded-full blur-[80px] sm:blur-[120px]" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-cyan-500/20 rounded-full blur-[60px] sm:blur-[100px]" />
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>

        <div className="relative z-10 px-5 py-12 sm:px-12 sm:py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur rounded-full text-xs sm:text-sm text-violet-200 mb-6 sm:mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t('home.badge')}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight leading-tight animate-fade-in-up">
            {t('home.title')}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
              {t('home.subtitle')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed animate-fade-in-up px-2" style={{ animationDelay: '0.1s' }}>
            {t('home.description')}
          </p>

          {/* CTA Button */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-base sm:text-lg font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-300 active:scale-95 sm:hover:-translate-y-1 group"
            >
              {t('home.start')}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-16 mt-10 sm:mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">10K+</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{t('home.stats.users')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">50K+</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{t('home.stats.transactions')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">100%</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{t('home.stats.secure')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-10 sm:mb-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark dark:text-white mb-3 sm:mb-4">
            {t('home.feature1.title') === 'Confiance Absolue' ? 'Pourquoi choisir Wenze ?' : 'Kwa nini kuchagua Wenze?'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base px-4">
            {t('home.feature1.title') === 'Confiance Absolue' ? 'Une plateforme pensée pour simplifier vos échanges tout en garantissant votre sécurité.' : 'Jukwaa lililokusudiwa kurahisisha biashara zako huku ukihakikisha usalama wako.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Feature 1 */}
          <div className="group relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/20 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-dark dark:text-white mb-2 sm:mb-3">{t('home.feature1.title')}</h3>
              <p className="text-gray-500 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                {t('home.feature1.desc')}
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 hover:border-wzp/30 dark:hover:border-wzp/50 hover:shadow-xl hover:shadow-wzp/5 dark:hover:shadow-wzp/20 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-wzp/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-wzp to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-wzp/20 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-dark dark:text-white mb-2 sm:mb-3">{t('home.feature2.title')}</h3>
              <p className="text-gray-500 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                {t('home.feature2.desc')}
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 hover:border-violet-500/30 dark:hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/5 dark:hover:shadow-violet-500/20 transition-all duration-500 overflow-hidden sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-dark dark:text-white mb-2 sm:mb-3">{t('home.feature3.title')}</h3>
              <p className="text-gray-500 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                {t('home.feature3.desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-primary via-blue-600 to-violet-600 p-6 sm:p-8 md:p-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-1/2 -right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-300 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
              {t('home.cta.title')}
            </h3>
            <p className="text-blue-100 text-sm sm:text-base">
              {t('home.cta.desc')}
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:shadow-xl transition-all active:scale-95 sm:hover:-translate-y-0.5 shrink-0 text-sm sm:text-base"
          >
            {t('home.cta.button')}
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
