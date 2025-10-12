import { formatDistanceToNow as dateFnsFormatDistanceToNow } from 'date-fns';
import { Locale } from 'date-fns';

/**
 * Localized wrapper for formatDistanceToNow
 * Use this with the useDateLocale hook to get proper localization
 */
export const formatDistanceToNowLocalized = (
  date: Date | number,
  locale: Locale,
  options?: { addSuffix?: boolean; includeSeconds?: boolean }
): string => {
  return dateFnsFormatDistanceToNow(date, {
    ...options,
    locale,
  });
};
