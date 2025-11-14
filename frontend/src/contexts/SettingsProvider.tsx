import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { ErrorPage } from '../pages/custom/ErrorPage';
import { InstallPage } from '../pages/custom/InstallPage';
import { LoadingPage } from '../pages/custom/LoadingPage';
import { settingsApi } from '../services/api/settings';
import { Settings } from '../types/settings';

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  error: Error | null;
  reloadSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  error: null,
  reloadSettings: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(() => {
    setLoading(true);
    setError(null);
    settingsApi
      .getSettings()
      .then(data => {
        setSettings(data);
      })
      .catch(err => {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Show a loading spinner while fetching settings
  if (loading) {
    return <LoadingPage />;
  }

  // Show an error message if settings failed to load
  if (error) {
    return <ErrorPage error={error} onRetry={fetchSettings} />;
  }

  // Render children only when settings are loaded successfully
  return (
    <SettingsContext.Provider value={{ settings, loading, error, reloadSettings: fetchSettings }}>
      {settings?.is_installed ? children : <InstallPage />}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
