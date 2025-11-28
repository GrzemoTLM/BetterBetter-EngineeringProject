import React, { createContext } from 'react';

export interface SettingsRefreshContextType {
  refreshSettings: () => Promise<void>;
}

export const SettingsRefreshContext = createContext<SettingsRefreshContextType | undefined>(undefined);

export const SettingsRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  return <>{children}</>;
};

export interface UserSettingsExtended {
  // ...existing fields...
  favourite_disciplines?: number[];
  favourite_bet_types?: number[];
}
