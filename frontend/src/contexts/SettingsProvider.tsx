import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsApi } from '../services/api/settings';
import { Settings } from '../types/settings';

const COMPATIBLE_BACKEND_VERSION = '0.4.0';

interface SettingsContextType {
    settings: Settings | null;
    loading: boolean;
    error: Error | null;
    isCompatibleBackend: boolean;
    compatibleBackendVersion: string;
    reloadSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: null,
    loading: true,
    isCompatibleBackend: true,
    compatibleBackendVersion: COMPATIBLE_BACKEND_VERSION,
    error: null,
    reloadSettings: () => { },
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isCompatibleBackend, setIsCompatibleBackend] = useState<boolean>(true)
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

    useEffect(() => {
        if (!settings) return;
        if (!settings.api_version || settings.api_version === 'development') {
            setIsCompatibleBackend(true);
            return;
        }

        const extractVersionNumbers = (text: string) => {
            const match = text.match(/[vV]?(\d+)\.(\d+)\.(\d+)/);
            if (match) {
                return [match[1], match[2], match[3]];
            }
            return ["0", "0", "0"];
        };

        const [major, minor, patch]: string[] = COMPATIBLE_BACKEND_VERSION.split('.');
        const [majorBackend, minorBackend, patchBackend]: string[] = extractVersionNumbers(settings.api_version);

        // it is not compatible less than 0.3.0
        setIsCompatibleBackend(
            (major == '*' || major == majorBackend) &&
            (minor == '*' || parseInt(minor) <= parseInt(minorBackend)) &&
            (patch == '*' || parseInt(patch) <= parseInt(patchBackend))
        );
    }, [settings])

    return (
        <SettingsContext.Provider value={{ settings, loading, error, isCompatibleBackend, compatibleBackendVersion: COMPATIBLE_BACKEND_VERSION, reloadSettings: fetchSettings }}>
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
