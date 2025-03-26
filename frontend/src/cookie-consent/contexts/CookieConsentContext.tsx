'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  COOKIE_CATEGORIES,
  COOKIE_CONFIG_KEY,
  CookieCategory,
  validateCookieConsent
} from '../constants/cookieConfig';
import { CookieConsentBanner } from '../components/CookieConsentBanner';
import { useSettings } from '../../contexts/SettingsProvider';
import { initializeGoogleAnalytics } from '../utils/analytics';

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
  updateConsent: () => { },
  categories: [],
  isClient: false,
  privacyUrl: '',
});

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConsentGiven, setIsConsentGiven] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['necessary']);
  const [isClient, setIsClient] = useState(false);
  const [analyticsInitialized, setAnalyticsInitialized] = useState(false);
  const [marketingInitialized, setMarketingInitialized] = useState(false);
  const { settings } = useSettings();

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

  const initializeAnalytics = () => {
    console.log('Initializing analytics');
    if (settings?.google_analytics_id) {
      initializeGoogleAnalytics(settings.google_analytics_id);
    }
  };

  const initializeMarketing = () => {
    console.log('Initializing marketing');
  };

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
        timestamp: new Date().toISOString()
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
  }, [selectedCategories, settings?.is_enterprise_mode_active]);

  return (
    <CookieConsentContext.Provider
      value={{
        isConsentGiven,
        selectedCategories,
        updateConsent,
        privacyUrl: settings?.policy_url || '',
        categories: COOKIE_CATEGORIES,
        isClient
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