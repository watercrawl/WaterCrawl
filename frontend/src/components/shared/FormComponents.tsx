import React from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export const OptionGroup: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, description, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-4 ${className}`}>
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{title} {subtitle}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
    {children}
  </div>
);

export const FormInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  type?: string;
  className?: string;
}> = ({ label, value, onChange, placeholder, helpText, disabled, type = 'text', className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full h-10 px-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 ltr"
      placeholder={placeholder}
    />
    {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
  </div>
);

export const FormSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, children, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    <div className="space-y-1">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h2>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
    {children}
  </div>
);

export const InfoTooltip: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <div className="group relative inline-block">
      <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
      <div className="hidden group-hover:block absolute z-10 w-64 p-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 left-1/2 -translate-x-1/2 mt-1">
        {content}
      </div>
    </div>
  );
};
