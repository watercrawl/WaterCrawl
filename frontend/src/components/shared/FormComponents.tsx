import React from 'react';

import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export const OptionGroup: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, description, children, className = '' }) => (
  <div className={`space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm ${className}`}>
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-foreground">
        {title} {subtitle}
      </h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
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
}> = ({
  label,
  value,
  onChange,
  placeholder,
  helpText,
  disabled,
  type = 'text',
  className = '',
}) => (
  <div className={className}>
    <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="ltr h-10 w-full rounded-md border border-border bg-input px-3 text-foreground focus:border-border focus:outline-none disabled:bg-muted"
      placeholder={placeholder}
    />
    {helpText && <p className="mt-1 text-xs text-muted-foreground">{helpText}</p>}
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
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {children}
  </div>
);

export const InfoTooltip: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <div className="group relative inline-flex items-center">
      <QuestionMarkCircleIcon className="h-4 w-4 cursor-help text-muted-foreground hover:text-foreground transition-colors" />
      <div className="absolute bottom-full left-1/2 z-50 mb-2 hidden w-64 max-w-xs -translate-x-1/2 rounded-md border border-border bg-card p-2 text-xs text-muted-foreground shadow-lg group-hover:block">
        {content}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border" />
      </div>
    </div>
  );
};
