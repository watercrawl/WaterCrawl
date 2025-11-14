import { useCallback } from 'react';

import { API_URL } from '../utils/env';

export const useApiDocumentation = () => {
  const getBaseUrl = useCallback(() => {
    let url = API_URL;
    if (!url || !/^https?:\/\//i.test(url)) {
      url = window.location.origin;
    }
    return url;
  }, []);

  return {
    getBaseUrl,
  };
};
