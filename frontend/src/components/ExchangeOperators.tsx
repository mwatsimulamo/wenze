import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeftRight, Phone, MessageCircle, ExternalLink, X, ChevronDown } from 'lucide-react';

interface ExchangeOperator {
  id: string;
  name: string;
  type: 'online' | 'local';
  website?: string;
  phone?: string;
  whatsapp?: string;
  description: {
    fr: string;
    sw: string;
  };
}

const exchangeOperators: ExchangeOperator[] = [
  {
    id: 'adaex',
    name: 'AdaEx',
    type: 'online',
    website: 'https://app.adaex.app/',
    description: {
      fr: 'Plateforme en ligne pour échanger ADA ↔ FC via Mobile Money',
      sw: 'Jukwaa la mtandaoni la kubadilisha ADA ↔ FC kupitia Mobile Money',
    },
  },
  {
    id: 'yann',
    name: 'Yann Exchange',
    type: 'local',
    phone: '+243999320786',
    whatsapp: '+243999320786',
    description: {
      fr: 'Opérateur local - Réponse instantanée via WhatsApp ou Appel',
      sw: 'Mwendeshaji wa ndani - Jibu la papo hapo kupitia WhatsApp au Simu',
    },
  },
  {
    id: 'jules',
    name: 'Jules Exchange',
    type: 'local',
    phone: '+243970204238',
    whatsapp: '+243970204238',
    description: {
      fr: 'Opérateur local - Réponse instantanée via WhatsApp ou Appel',
      sw: 'Mwendeshaji wa ndani - Jibu la papo hapo kupitia WhatsApp au Simu',
    },
  },
];

interface ExchangeOperatorsProps {
  variant?: 'button' | 'card';
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

const ExchangeOperators: React.FC<ExchangeOperatorsProps> = ({ 
  variant = 'button',
  externalOpen,
  onExternalOpenChange
}) => {
  const { language, t } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Utiliser l'état externe si fourni, sinon utiliser l'état interne
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (onExternalOpenChange) {
      onExternalOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  const handleWhatsApp = (phone: string) => {
    const message = language === 'fr' 
      ? 'Bonjour, je souhaite échanger des ADA contre des FC via WENZE.'
      : 'Hujambo, nataka kubadilisha ADA na FC kupitia WENZE.';
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWebsite = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'card') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="group aspect-square sm:aspect-auto flex flex-col items-center justify-center sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 sm:p-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl text-white shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 transition-all active:scale-[0.97] sm:hover:-translate-y-1 w-full"
        >
          <div className="w-14 h-14 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-2xl sm:rounded-xl flex items-center justify-center">
            <ArrowLeftRight className="w-7 h-7 sm:w-6 sm:h-6" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-base sm:text-lg font-bold">
              {language === 'fr' ? 'Échanger' : 'Badilisha'}
            </p>
            <p className="text-orange-100 text-[10px] sm:text-xs hidden sm:block">
              ADA ↔ FC
            </p>
          </div>
        </button>

        {/* Modal pour Card */}
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Operators List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {exchangeOperators.map((operator) => (
                  <div
                    key={operator.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {operator.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {operator.description[language]}
                        </p>
                      </div>
                      {operator.type === 'online' && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                          {language === 'fr' ? 'En ligne' : 'Mtandaoni'}
                        </span>
                      )}
                      {operator.type === 'local' && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                          {language === 'fr' ? 'Local' : 'Ndani'}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {operator.website && (
                        <button
                          onClick={() => handleWebsite(operator.website!)}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {language === 'fr' ? 'Ouvrir le site' : 'Fungua tovuti'}
                        </button>
                      )}
                      {operator.whatsapp && (
                        <button
                          onClick={() => handleWhatsApp(operator.whatsapp!)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-sm font-medium"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </button>
                      )}
                      {operator.phone && (
                        <button
                          onClick={() => handleCall(operator.phone!)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg transition text-sm font-medium"
                        >
                          <Phone className="w-4 h-4" />
                          {operator.phone}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  {language === 'fr' 
                    ? '💡 Les opérateurs locaux répondent généralement en quelques minutes'
                    : '💡 Waendeshaji wa ndani hujibu kwa kawaida ndani ya dakika chache'}
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Variant Button (pour Navbar)
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition shadow-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
        title={language === 'fr' ? 'Échanger ADA ↔ FC' : 'Badilisha ADA ↔ FC'}
      >
        <ArrowLeftRight size={16} />
        <span className="hidden lg:inline">ADA ↔ FC</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
              <h3 className="font-bold text-lg">
                {language === 'fr' ? 'Opérateurs d\'Échange' : 'Waendeshaji wa Ubadilishaji'}
              </h3>
              <p className="text-orange-100 text-xs mt-1">
                {language === 'fr' ? 'Choisissez un opérateur' : 'Chagua mwendeshaji'}
              </p>
            </div>

            {/* Operators List */}
            <div className="max-h-96 overflow-y-auto p-3 space-y-2">
              {exchangeOperators.map((operator) => (
                <div
                  key={operator.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {operator.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {operator.description[language]}
                      </p>
                    </div>
                    {operator.type === 'online' && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-semibold rounded">
                        {language === 'fr' ? 'En ligne' : 'Mtandaoni'}
                      </span>
                    )}
                    {operator.type === 'local' && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-semibold rounded">
                        {language === 'fr' ? 'Local' : 'Ndani'}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5">
                    {operator.website && (
                      <button
                        onClick={() => {
                          handleWebsite(operator.website!);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition text-xs font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {language === 'fr' ? 'Site' : 'Tovuti'}
                      </button>
                    )}
                    {operator.whatsapp && (
                      <button
                        onClick={() => {
                          handleWhatsApp(operator.whatsapp!);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-xs font-medium"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </button>
                    )}
                    {operator.phone && (
                      <button
                        onClick={() => {
                          handleCall(operator.phone!);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary hover:bg-primary-600 text-white rounded-lg transition text-xs font-medium"
                      >
                        <Phone className="w-3 h-3" />
                        {language === 'fr' ? 'Appeler' : 'Piga simu'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                {language === 'fr' 
                  ? '💡 Réponses instantanées'
                  : '💡 Majibu ya papo hapo'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExchangeOperators;

