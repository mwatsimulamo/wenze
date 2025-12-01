import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'fr' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traductions
const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.market': 'Marché',
    'nav.orders': 'Commandes',
    'nav.login': 'Connexion',
    'nav.join': 'Rejoindre',
    'nav.dashboard': 'Tableau de bord',
    'nav.profile': 'Mon Profil',
    'nav.logout': 'Déconnexion',
    'nav.wallet': 'Wallet',
    'nav.connect_wallet': 'Connecter Wallet',
    'nav.wallet_connected': 'Connecté',
    
    // Home
    'home.badge': "L'innovation made in Goma 🌋",
    'home.title': "L'Avenir du Commerce",
    'home.subtitle': 'Sécurisé & Rapide',
    'home.description': 'WENZE réinvente l\'échange à Goma. Achetez, vendez, échangez avec une garantie de sécurité totale grâce à la technologie Blockchain.',
    'home.start': 'Commencer maintenant',
    'home.become_seller': 'Devenir Vendeur',
    'home.feature1.title': 'Confiance Absolue',
    'home.feature1.desc': 'Fini les arnaques. Vos fonds sont protégés par Escrow jusqu\'à ce que vous validiez la réception. La sécurité bancaire, simplifiée.',
    'home.feature2.title': 'Gagnez +',
    'home.feature2.desc': 'Chaque échange compte. Cumulez des points UZP et débloquez des avantages exclusifs à travers la ville.',
    'home.feature3.title': 'Vitesse Éclair',
    'home.feature3.desc': 'Connectez votre Wallet en 2 secondes. Transactions instantanées et transparentes. Le Web3 à portée de main.',
    'home.cta.title': 'Prêt à commencer ?',
    'home.cta.desc': 'Rejoignez des milliers d\'utilisateurs qui font confiance à Wenze.',
    'home.cta.button': 'Créer un compte gratuit',
    
    // Products
    'products.title': 'Découvrez le Marché',
    'products.subtitle': 'Téléphones, vêtements, ordinateurs et plus encore.',
    'products.sell': 'Vendre',
    'products.search': 'Rechercher un produit...',
    'products.all': 'Tout',
    'products.electronics': 'Téléphones',
    'products.fashion': 'Mode',
    'products.digital': 'Ordinateurs',
    'products.services': 'Services',
    'products.home': 'Maison',
    'products.other': 'Autres',
    'products.count': '{count} produit(s)',
    'products.sort.recent': 'Récents',
    'products.sort.price_low': 'Prix ↑',
    'products.sort.price_high': 'Prix ↓',
    'products.empty.title': 'Aucun produit trouvé',
    'products.empty.no_results': 'Aucun résultat pour "{query}"',
    'products.empty.no_category': 'Pas de produits dans cette catégorie',
    'products.empty.add': 'Ajouter un produit',
    'products.buy': 'Acheter',
    
    // Orders
    'orders.title': 'Mes Commandes',
    'orders.empty': 'Vous n\'avez aucune commande pour le moment.',
    
    // Chat
    'chat.title': 'Messagerie Sécurisée',
    'chat.placeholder': 'Écrivez votre message...',
    'chat.send': 'Envoyer',
    'chat.negotiation.active': 'Négociation en cours - Prix proposé:',
    'chat.negotiation.propose': 'Proposer un prix et bloquer en escrow',
    'chat.negotiation.propose_amount': 'Montant à proposer (ADA)...',
    'chat.negotiation.propose_and_block': 'Proposer et bloquer',
    'chat.negotiation.confirm_price': 'Confirmer le prix proposé',
    'chat.negotiation.new_price': 'Nouveau prix...',
    'chat.negotiation.confirm': 'Confirmer',
    'chat.negotiation.accept': 'Accepter',
    'chat.negotiation.counter': 'Contre-proposer',
    'chat.negotiation.counter_price': 'Votre prix...',
    'chat.negotiation.send': 'Envoyer',
    'chat.negotiation.cancel': 'Annuler la négociation',
    'chat.negotiation.refuse': 'Refuser',
    'chat.negotiation.cancel_confirm': 'Annuler',
    
    // Stats
    'home.stats.users': 'Utilisateurs',
    'home.stats.transactions': 'Transactions',
    'home.stats.secure': 'Sécurisé',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.close': 'Fermer',
  },
  sw: {
    // Navigation
    'nav.market': 'Soko',
    'nav.orders': 'Maagizo',
    'nav.login': 'Ingia',
    'nav.join': 'Jiunge',
    'nav.dashboard': 'Dashibodi',
    'nav.profile': 'Wasifu Wangu',
    'nav.logout': 'Toka',
    'nav.wallet': 'Mkoba',
    'nav.connect_wallet': 'Unganisha Mkoba',
    'nav.wallet_connected': 'Imeunganishwa',
    
    // Home
    'home.badge': 'Ubunifu kutoka Goma 🌋',
    'home.title': 'Siku za Usalama wa Biashara',
    'home.subtitle': 'Salama na Haraka',
    'home.description': 'WENZE inarekebisha biashara Goma. Nunua, uuze, badilisha kwa dhamana kamili ya usalama kwa teknolojia ya Blockchain.',
    'home.start': 'Anza Sasa',
    'home.become_seller': 'Kuwa Muuzaji',
    'home.feature1.title': 'Kuaminika Kabisa',
    'home.feature1.desc': 'Hakuna udanganyifu tena. Fedha zako zinalindwa na Escrow hadi uthibitishwe kupokea. Usalama wa benki, rahisi.',
    'home.feature2.title': 'Pata Zaidi',
    'home.feature2.desc': 'Kila biashara ni muhimu. Pata alama za UZP na fungua faida za pekee katika jiji.',
    'home.feature3.title': 'Kasi ya Mwanga',
    'home.feature3.desc': 'Unganisha Mkoba wako kwa sekunde 2. Biashara za papo hapo na wazi. Web3 mkononi mwako.',
    'home.cta.title': 'Tayari kuanza?',
    'home.cta.desc': 'Jiunge na maelfu ya watumiaji wanaoamini Wenze.',
    'home.cta.button': 'Tengeneza Akaunti Bure',
    
    // Products
    'products.title': 'Gundua Soko',
    'products.subtitle': 'Simu, nguo, kompyuta na zaidi.',
    'products.sell': 'Uza',
    'products.search': 'Tafuta bidhaa...',
    'products.all': 'Zote',
    'products.electronics': 'Simu',
    'products.fashion': 'Mitindo',
    'products.digital': 'Kompyuta',
    'products.services': 'Huduma',
    'products.home': 'Nyumbani',
    'products.other': 'Nyingine',
    'products.count': 'Bidhaa {count}',
    'products.sort.recent': 'Hivi karibuni',
    'products.sort.price_low': 'Bei ↑',
    'products.sort.price_high': 'Bei ↓',
    'products.empty.title': 'Hakuna bidhaa zilizopatikana',
    'products.empty.no_results': 'Hakuna matokeo kwa "{query}"',
    'products.empty.no_category': 'Hakuna bidhaa katika jamii hii',
    'products.empty.add': 'Ongeza bidhaa',
    'products.buy': 'Nunua',
    
    // Orders
    'orders.title': 'Maagizo Yangu',
    'orders.empty': 'Huna maagizo yoyote kwa sasa.',
    
    // Chat
    'chat.title': 'Ujumbe Salama',
    'chat.placeholder': 'Andika ujumbe wako...',
    'chat.send': 'Tuma',
    'chat.negotiation.active': 'Mazungumzo yanaendelea - Bei iliyopendekezwa:',
    'chat.negotiation.propose': 'Pendekeza bei na weka kwenye escrow',
    'chat.negotiation.propose_amount': 'Kiasi cha kupendekeza (ADA)...',
    'chat.negotiation.propose_and_block': 'Pendekeza na weka',
    'chat.negotiation.confirm_price': 'Thibitisha bei iliyopendekezwa',
    'chat.negotiation.new_price': 'Bei mpya...',
    'chat.negotiation.confirm': 'Thibitisha',
    'chat.negotiation.accept': 'Kubali',
    'chat.negotiation.counter': 'Pendekeza kinyume',
    'chat.negotiation.counter_price': 'Bei yako...',
    'chat.negotiation.send': 'Tuma',
    'chat.negotiation.cancel': 'Ghairi mazungumzo',
    'chat.negotiation.refuse': 'Kataa',
    'chat.negotiation.cancel_confirm': 'Ghairi',
    
    // Stats
    'home.stats.users': 'Watumiaji',
    'home.stats.transactions': 'Biashara',
    'home.stats.secure': 'Salama',
    
    // Common
    'common.loading': 'Inapakia...',
    'common.error': 'Hitilafu',
    'common.success': 'Mafanikio',
    'common.cancel': 'Ghairi',
    'common.save': 'Hifadhi',
    'common.delete': 'Futa',
    'common.edit': 'Hariri',
    'common.close': 'Funga',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wenze-language') as Language;
      return saved || 'fr';
    }
    return 'fr';
  });

  useEffect(() => {
    localStorage.setItem('wenze-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || key;
    // Remplace les placeholders {key} par les valeurs
    if (params) {
      Object.keys(params).forEach(paramKey => {
        text = text.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

