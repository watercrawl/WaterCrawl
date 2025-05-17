import { useEffect, useState } from 'react';

export const useIsTabletOrMobile = () => {
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(false);

  useEffect(() => {
    const checkIfTabletOrMobile = () => {
      setIsTabletOrMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfTabletOrMobile();

    // Add event listener
    window.addEventListener('resize', checkIfTabletOrMobile);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkIfTabletOrMobile);
    };
  }, []);

  return isTabletOrMobile;
};

export default useIsTabletOrMobile;
