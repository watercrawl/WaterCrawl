import React, { createContext, useContext, useEffect, useState } from 'react';
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
    reloadSettings: () => { },
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSettings = () => {
        settingsApi.getSettings().then((data) => {
            setSettings(data);
        }).catch((err) => {
            setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        }).finally(() => {
            setLoading(false);
        });
    };
    useEffect(() => {
        fetchSettings();
    }, []);


    return (
        <SettingsContext.Provider value={{ settings, loading, error, reloadSettings: fetchSettings }}>
            {children}
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
