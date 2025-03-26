import React from 'react';

export const SpiderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3a1 1 0 100 2 1 1 0 000-2zM12 19a1 1 0 100 2 1 1 0 000-2zM6 12a1 1 0 100 2 1 1 0 000-2zM18 12a1 1 0 100 2 1 1 0 000-2zM7.05 7.05a1 1 0 100 2 1 1 0 000-2zM16.95 7.05a1 1 0 100 2 1 1 0 000-2zM7.05 14.95a1 1 0 100 2 1 1 0 000-2zM16.95 14.95a1 1 0 100 2 1 1 0 000-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4v7M12 13v6M7 12H4M20 12h-3M8.5 8.5L12 12M15.5 8.5L12 12M8.5 15.5L12 12M15.5 15.5L12 12"
      />
    </svg>
  );
};

export default SpiderIcon;
