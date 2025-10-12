import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import faTranslations from './locales/fa.json';
import deTranslations from './locales/de.json';
import frTranslations from './locales/fr.json';
import esTranslations from './locales/es.json';
import itTranslations from './locales/it.json';
import ptTranslations from './locales/pt.json';
import jaTranslations from './locales/ja.json';
import zhTranslations from './locales/zh.json';
import arTranslations from './locales/ar.json';
import { applyFontConfig } from './fontConfig';

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      fa: {
        translation: faTranslations,
      },
      de: {
        translation: deTranslations,
      },
      fr: {
        translation: frTranslations,
      },
      es: {
        translation: esTranslations,
      },
      it: {
        translation: itTranslations,
      },
      pt: {
        translation: ptTranslations,
      },
      ja: {
        translation: jaTranslations,
      },
      zh: {
        translation: zhTranslations,
      },
      ar: {
        translation: arTranslations,
      },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'zh', 'ar', 'fa'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    debug: false,
    
    // Fallback behavior
    returnNull: false,
    returnEmptyString: false,
    returnObjects: false,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    
    // React options
    react: {
      useSuspense: false,
    },
  });

// Apply font configuration when language changes
i18n.on('languageChanged', (lng) => {
  applyFontConfig(lng);
});

// Apply initial font configuration
applyFontConfig(i18n.language);

export default i18n;
