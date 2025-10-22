import React from 'react';

interface LoginButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ children, onClick }) => {
  return (
    <button
      className="flex w-full items-center justify-center gap-x-2 rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
