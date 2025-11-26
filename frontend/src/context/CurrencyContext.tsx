/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiService from '../services/api';

export type Currency = 'USD' | 'EUR' | 'PLN';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (value: number) => string;
  getCurrencySymbol: () => string;
  isLoading: boolean;
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        // Only load if user is authenticated
        const token = apiService.getToken();
        if (!token) {
          setCurrencyState('USD');
          setIsLoading(false);
          return;
        }

        const settings = await apiService.getSettings();
        setCurrencyState((settings.basic_currency as Currency) || 'USD');
      } catch (error) {
        console.error('Failed to load currency:', error);
        setCurrencyState('USD');
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrency();
  }, []);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  }, []);

  const getCurrencySymbol = useCallback(() => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'PLN':
        return 'zł';
      default:
        return '$';
    }
  }, [currency]);

  const formatCurrency = useCallback((value: number) => {
    if (value === undefined || value === null) return `${getCurrencySymbol()}0`;

    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // For USD, symbol before number; for EUR and PLN, symbol after number
    if (currency === 'USD') {
      return `${getCurrencySymbol()}${formatted}`;
    } else {
      return `${formatted} ${getCurrencySymbol()}`;
    }
  }, [currency, getCurrencySymbol]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, getCurrencySymbol, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

