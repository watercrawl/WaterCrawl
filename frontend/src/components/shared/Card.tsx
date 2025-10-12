import React from 'react';
import { twMerge } from 'tailwind-merge';

// Card props interface
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Title props interface
interface TitleProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

// Body props interface
interface BodyProps {
  children: React.ReactNode;
  className?: string;
}

// Footer props interface
interface FooterProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

// Card Component with Compound Components
const Card: React.FC<CardProps> & {
  Title: React.FC<TitleProps>;
  Body: React.FC<BodyProps>;
  Footer: React.FC<FooterProps>;
} = ({ children, className = '' }) => {
  return (
    <div className={twMerge('bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-4', className)}>
      {children}
    </div>
  );
};

// Title Component
const Title: React.FC<TitleProps> = ({ children, className = '', icon }) => {
  return (
    <div className="pb-2 mb-2">
      <h2 className={twMerge('text-lg font-medium text-gray-900 dark:text-white flex items-center', className)}>
        {icon && <span className="me-2">{icon}</span>}
        {children}
      </h2>
    </div>
  );
};

// Body Component
const Body: React.FC<BodyProps> = ({ children, className = '' }) => {
  return (
    <div className={twMerge('py-2', className)}>
      {children}
    </div>
  );
};

// Footer Component
const Footer: React.FC<FooterProps> = ({ children, className = '', bordered = true }) => {
  return (
    <div className={twMerge(
      'pt-2 mt-2', 
      bordered ? 'border-t border-gray-100 dark:border-gray-700' : '',
      className
    )}>
      {children}
    </div>
  );
};

// Attach subcomponents to Card
Card.Title = Title;
Card.Body = Body;
Card.Footer = Footer;

export default Card;
