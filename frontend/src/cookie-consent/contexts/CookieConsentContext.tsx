'use client';

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';

import { useTranslation } from 'react-i18next';

import { CookieConsentBanner } from '../components/CookieConsentBanner';
import {
  COOKIE_CONFIG_KEY,
  CookieCategory,
  validateCookieConsent,
  getCookieCategories,
} from '../constants/cookieConfig';
import { initializeGoogleAnalytics } from '../utils/analytics';

import { useSettings } from '../../contexts/SettingsProvider';
import { initSentry } from '../../sentry';

interface CookieConsentContextType {
  isConsentGiven: boolean;
  selectedCategories: string[];
  updateConsent: (categories: string[] | undefined) => void;
  privacyUrl: string;
  isClient: boolean;
  categories: CookieCategory[];
}

const CookieConsentContext = createContext<CookieConsentContextType>({
  isConsentGiven: false,
  selectedCategories: [],
  updateConsent: () => {},
  categories: [],
  isClient: false,
  privacyUrl: '',
});

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [isConsentGiven, setIsConsentGiven] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['necessary']);
  const [isClient, setIsClient] = useState(false);
  const [analyticsInitialized, setAnalyticsInitialized] = useState(false);
  const [marketingInitialized, setMarketingInitialized] = useState(false);
  const { settings } = useSettings();
  const sentryRef = useRef<boolean>(false);

  // Get translated cookie categories
  const translatedCategories = useMemo(() => getCookieCategories(t), [t]);

  useEffect(() => {
    // Check if consent was previously given
    try {
      const storedConsent = localStorage.getItem(COOKIE_CONFIG_KEY);

      if (storedConsent) {
        const parsedConsent = JSON.parse(storedConsent);
        const validatedCategories = validateCookieConsent(parsedConsent);

        setIsConsentGiven(parsedConsent.given);
        setSelectedCategories(validatedCategories);
      }
    } catch (error) {
      console.error('Error reading cookie consent:', error);
      // Reset consent if there's an error
      localStorage.removeItem(COOKIE_CONFIG_KEY);
    }
    // Ensure this only runs on client side
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!settings || settings.is_enterprise_mode_active) return;
    if (!sentryRef.current) {
      sentryRef.current = true;
      initSentry();
    }
  }, [settings?.is_enterprise_mode_active, settings]);

  const initializeAnalytics = useCallback(() => {
    console.log('Initializing analytics');
    if (settings?.google_analytics_id) {
      initializeGoogleAnalytics(settings.google_analytics_id);
    }
    if (!sentryRef.current) {
      sentryRef.current = true;
      initSentry();
    }
  }, [settings?.google_analytics_id]);

  const initializeMarketing = useCallback(() => {
    console.log('Initializing marketing');
  }, []);

  const updateConsent = (categories: string[] | undefined) => {
    if (!isClient || !settings?.is_enterprise_mode_active) return;

    // If no categories are provided, use an empty array
    const inputCategories = categories || [];

    // Always include necessary cookies
    const finalCategories = ['necessary', ...inputCategories];

    try {
      // Store consent in localStorage
      const consentData = {
        given: true,
        categories: finalCategories,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(COOKIE_CONFIG_KEY, JSON.stringify(consentData));

      setIsConsentGiven(true);
      setSelectedCategories(finalCategories);
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  };

  useEffect(() => {
    if (!settings?.is_enterprise_mode_active) return;
    // Initialize analytics if analytics category is selected
    if (selectedCategories.includes('analytics') && !analyticsInitialized) {
      initializeAnalytics();
      setAnalyticsInitialized(true);
    }

    // Initialize marketing category
    if (selectedCategories.includes('marketing') && !marketingInitialized) {
      initializeMarketing();
      setMarketingInitialized(true);
    }
  }, [
    selectedCategories,
    settings?.is_enterprise_mode_active,
    initializeAnalytics,
    initializeMarketing,
    analyticsInitialized,
    marketingInitialized,
  ]);

  return (
    <CookieConsentContext.Provider
      value={{
        isConsentGiven,
        selectedCategories,
        updateConsent,
        privacyUrl: settings?.policy_url || '',
        categories: translatedCategories,
        isClient,
      }}
    >
      <CookieConsentBanner />
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  return context;
};
