import React from 'react';

interface CursorLogoProps {
  className?: string;
  size?: number;
}

export const CursorLogo: React.FC<CursorLogoProps> = ({ className, size = 24 }) => {
  return (
    <img
      src="/logos/cursor.svg"
      alt="Cursor Logo"
      width={size}
      height={size}
      className={className}
    />
  );
};
