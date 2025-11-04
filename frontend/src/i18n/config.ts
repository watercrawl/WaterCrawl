import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { applyFontConfig } from './fontConfig';

i18n
  .use(HttpBackend)
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    backend: {
      loadPath: '/locales/{{lng}}.json', // Path to translation files
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
i18n.on('languageChanged', lng => {
  applyFontConfig(lng);
});

// Apply initial font configuration
applyFontConfig(i18n.language);

export default i18n;
