import { useContext } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';

export const useCurrency = () => {
  const context = useContext(CurrencyContext);

  if (context === undefined) {
    return {
      currency: 'USD' as const,
      setCurrency: () => {},
      formatCurrency: (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      getCurrencySymbol: () => '$',
      isLoading: false,
    };
  }

  return context;
};

