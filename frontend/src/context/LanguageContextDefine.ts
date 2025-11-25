import { createContext } from 'react';
import { pl } from '../utils/translations';

export type Language = 'pl' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof pl;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

