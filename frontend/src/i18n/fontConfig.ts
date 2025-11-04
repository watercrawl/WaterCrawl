/**
 * Font Configuration for Different Languages
 *
 * This file defines font families for each supported language.
 * When a language is selected, the appropriate font is applied to the document.
 */

export interface FontConfig {
  family: string;
  weights: number[];
  lineHeight?: number;
  letterSpacing?: string;
}

export const fontConfigs: Record<string, FontConfig> = {
  // English and other Latin-based languages
  en: {
    family:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    weights: [300, 400, 500, 600, 700, 800],
    lineHeight: 1.5,
    letterSpacing: 'normal',
  },

  // Persian (Farsi)
  fa: {
    family: '"Vazirmatn", ui-sans-serif, system-ui, sans-serif',
    weights: [400, 500, 600, 700],
    lineHeight: 1.8,
    letterSpacing: '0.01em',
  },

  // Arabic
  ar: {
    family: '"Vazirmatn", ui-sans-serif, system-ui, sans-serif',
    weights: [400, 500, 600, 700],
    lineHeight: 1.8,
    letterSpacing: '0.01em',
  },

  // Hebrew
  he: {
    family: '"Vazirmatn", ui-sans-serif, system-ui, sans-serif',
    weights: [400, 500, 600, 700],
    lineHeight: 1.7,
    letterSpacing: '0.01em',
  },

  // Urdu
  ur: {
    family: '"Vazirmatn", ui-sans-serif, system-ui, sans-serif',
    weights: [400, 500, 600, 700],
    lineHeight: 1.8,
    letterSpacing: '0.01em',
  },

  // Spanish, French, German, etc. (use default)
  es: {
    family:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    weights: [300, 400, 500, 600, 700, 800],
    lineHeight: 1.5,
    letterSpacing: 'normal',
  },
};

/**
 * Get font configuration for a language
 * Falls back to English if language not configured
 */
export const getFontConfig = (languageCode: string): FontConfig => {
  return fontConfigs[languageCode] || fontConfigs.en;
};

/**
 * Apply font configuration to the document
 */
export const applyFontConfig = (languageCode: string): void => {
  const config = getFontConfig(languageCode);
  const root = document.documentElement;

  // Apply font family
  root.style.fontFamily = config.family;

  // Apply line height if specified
  if (config.lineHeight) {
    root.style.setProperty('--line-height-base', config.lineHeight.toString());
  }

  // Apply letter spacing if specified
  if (config.letterSpacing) {
    root.style.letterSpacing = config.letterSpacing;
  }
};

/**
 * Helper to check if a language uses a custom font
 */
export const usesCustomFont = (languageCode: string): boolean => {
  const config = fontConfigs[languageCode];
  return config ? config.family.includes('Vazirmatn') : false;
};
