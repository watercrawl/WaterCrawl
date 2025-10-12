export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  essential: boolean;
}

export const COOKIE_CONFIG_KEY = 'cookie_consent';

// Base category definitions with translation keys
export const COOKIE_CATEGORY_DEFINITIONS = [
  {
    id: 'necessary',
    nameKey: 'cookieConsent.categories.necessary.name',
    descriptionKey: 'cookieConsent.categories.necessary.description',
    essential: true
  },
  {
    id: 'analytics',
    nameKey: 'cookieConsent.categories.analytics.name',
    descriptionKey: 'cookieConsent.categories.analytics.description',
    essential: false
  },
  {
    id: 'marketing',
    nameKey: 'cookieConsent.categories.marketing.name',
    descriptionKey: 'cookieConsent.categories.marketing.description',
    essential: false
  }
];

// Helper function to get translated categories
export const getCookieCategories = (t: (key: string) => string): CookieCategory[] => {
  return COOKIE_CATEGORY_DEFINITIONS.map(def => ({
    id: def.id,
    name: t(def.nameKey),
    description: t(def.descriptionKey),
    essential: def.essential
  }));
};

// Legacy export for backward compatibility (uses English by default)
export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'necessary',
    name: 'Necessary Cookies',
    description: 'These cookies are essential for the website to function properly and cannot be disabled.',
    essential: true
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
    essential: false
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description: 'These cookies are used to track visitors across websites to provide more relevant advertising and content.',
    essential: false
  }
];

// Utility function to validate and sanitize cookie consent
export const validateCookieConsent = (consent: any): string[] => {
  if (!consent || !consent.categories) {
    return ['necessary'];
  }

  const validCategories = COOKIE_CATEGORIES.map(cat => cat.id);
  return consent.categories.filter((cat: string) =>
    validCategories.includes(cat) || cat === 'necessary'
  );
};
