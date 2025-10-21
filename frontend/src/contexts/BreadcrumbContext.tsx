import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbContextType {
  items: BreadcrumbItem[];
  setItems: React.Dispatch<React.SetStateAction<BreadcrumbItem[]>>;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const BreadcrumbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);
  const location = useLocation();

  // This effect will run on every route change and set the default breadcrumbs.
  // A component can then override this by calling `setItems` in its own effect.
  useEffect(() => {
    // setItems([]);
  }, [location.pathname]);

  return (
    <BreadcrumbContext.Provider value={{ items, setItems }}>{children}</BreadcrumbContext.Provider>
  );
};

export const useBreadcrumbs = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  return context;
};
