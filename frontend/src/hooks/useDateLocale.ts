import { useTranslation } from 'react-i18next';
import { Locale } from 'date-fns';
import { enUS, de, fr, es, it, ptBR, ja, zhCN, ar, faIR } from 'date-fns/locale';

// Map i18n language codes to date-fns locales
const localeMap: Record<string, Locale> = {
  en: enUS,
  de: de,
  fr: fr,
  es: es,
  it: it,
  pt: ptBR,
  ja: ja,
  zh: zhCN,
  ar: ar,
  fa: faIR,
};

/**
 * Hook to get the current date-fns locale based on i18n language
 */
export const useDateLocale = (): Locale => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language.split('-')[0]; // Handle cases like 'en-US'

  return localeMap[currentLang] || enUS;
};
