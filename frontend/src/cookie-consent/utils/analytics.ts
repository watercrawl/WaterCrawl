// @ts-nocheck
export const initializeGoogleAnalytics = (gtagId?: string) => {
  try {
    // If no gtag ID is provided, do nothing
    if (!gtagId) return;

    // Ensure we're in a browser environment
    if (typeof window === 'undefined') return;

    // Create script tag for Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
    document.head.appendChild(script);

    console.log(`Google Analytics script added with ID: ${gtagId}`);

    // Initialize gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    // Configure Google Analytics
    window.gtag('js', new Date());
    window.gtag('config', gtagId, {
      'anonymize_ip': true,
      'cookie_flags': 'SameSite=Strict'
    });

    console.log(`Google Analytics initialized with ID: ${gtagId}`);
  } catch (error) {
    console.error('Error initializing Google Analytics:', error);
  }
};

export const removeGoogleAnalytics = (gtagId?: string) => {
  try {
    // If no gtag ID is provided, do nothing
    if (!gtagId) return;

    // Ensure we're in a browser environment
    if (typeof window === 'undefined') return;

    // Remove Google Analytics script
    const scripts = document.head.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      const script = scripts[i];
      if (script.src.includes(`googletagmanager.com/gtag/js?id=${gtagId}`)) {
        script.remove();
      }
    }

    // Clear dataLayer and gtag
    window.dataLayer = [];
    delete window.gtag;

    // Remove GA cookies
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      if (name.includes(`_ga_${gtagId}`) || name.includes('_ga') || name.includes('_gid')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
      }
    });

    console.log(`Google Analytics removed for ID: ${gtagId}`);
  } catch (error) {
    console.error('Error removing Google Analytics:', error);
  }
};
