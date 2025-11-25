/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiService from '../services/api';

interface DateFormatContextType {
  dateFormat: string;
  setDateFormat: (format: string) => void;
  isLoading: boolean;
}

export const DateFormatContext = createContext<DateFormatContextType | undefined>(undefined);

interface DateFormatProviderProps {
  children: ReactNode;
}

export const DateFormatProvider: React.FC<DateFormatProviderProps> = ({ children }) => {
  const [dateFormat, setDateFormatState] = useState<string>('DD/MM/YYYY');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDateFormat = async () => {
      try {
        const settings = await apiService.getSettings();
        setDateFormatState(settings.date_format || 'DD/MM/YYYY');
      } catch (error) {
        console.error('Failed to load date format:', error);
        setDateFormatState('DD/MM/YYYY');
      } finally {
        setIsLoading(false);
      }
    };

    loadDateFormat();
  }, []);

  const setDateFormat = useCallback((format: string) => {
    setDateFormatState(format);
  }, []);

  return (
    <DateFormatContext.Provider value={{ dateFormat, setDateFormat, isLoading }}>
      {children}
    </DateFormatContext.Provider>
  );
};

