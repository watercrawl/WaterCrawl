import React, { createContext, useContext, useEffect, useState } from 'react';

type Direction = 'rtl' | 'ltr';

interface DirectionContextType {
  direction: Direction;
  toggleDirection: () => void;
  setDirection: (direction: Direction) => void;
}

const DirectionContext = createContext<DirectionContextType | undefined>(undefined);

export const DirectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [direction, setDirectionState] = useState<Direction>(() => {
    if (typeof window !== 'undefined') {
      const savedDirection = localStorage.getItem('direction') as Direction;
      return savedDirection || 'ltr';
    }
    return 'ltr';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    // Set dir attribute on both html and body
    root.setAttribute('dir', direction);
    body.setAttribute('dir', direction);

    // Save to localStorage
    localStorage.setItem('direction', direction);
  }, [direction]);

  const toggleDirection = () => {
    setDirectionState(prev => (prev === 'rtl' ? 'ltr' : 'rtl'));
  };

  const setDirection = (newDirection: Direction) => {
    setDirectionState(newDirection);
  };

  return (
    <DirectionContext.Provider value={{ direction, toggleDirection, setDirection }}>
      {children}
    </DirectionContext.Provider>
  );
};

export const useDirection = () => {
  const context = useContext(DirectionContext);
  if (context === undefined) {
    throw new Error('useDirection must be used within a DirectionProvider');
  }
  return context;
};
