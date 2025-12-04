import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { currencyConverter, getExchangeRate, refreshExchangeRate } from '../utils/currencyConverter';

interface ExchangeRateContextType {
  rate: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined);

export const useExchangeRate = () => {
  const context = useContext(ExchangeRateContext);
  if (!context) {
    throw new Error('useExchangeRate must be used within an ExchangeRateProvider');
  }
  return context;
};

export const ExchangeRateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rate, setRate] = useState<number>(getExchangeRate());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshExchangeRate();
      const newRate = getExchangeRate();
      setRate(newRate);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du taux');
      if (import.meta.env.DEV) {
        console.error('Error refreshing exchange rate:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Récupérer le taux au chargement
    const initializeRate = async () => {
      setLoading(true);
      try {
        // Forcer la récupération du taux réel
        await currencyConverter.fetchRealTimeRate();
        const currentRate = getExchangeRate();
        setRate(currentRate);
        
        // Vérifier la date de dernière mise à jour
        const savedTime = localStorage.getItem('fc_to_ada_rate_time');
        if (savedTime) {
          setLastUpdated(new Date(parseInt(savedTime)));
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement du taux');
        if (import.meta.env.DEV) {
          console.error('Error initializing exchange rate:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeRate();

    // Rafraîchir le taux toutes les 5 minutes
    const interval = setInterval(() => {
      refresh();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <ExchangeRateContext.Provider value={{ rate, loading, error, refresh, lastUpdated }}>
      {children}
    </ExchangeRateContext.Provider>
  );
};






