import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  endAdornment?: React.ReactNode;
}

/**
 * Standalone Input component for use without React Hook Form
 * For forms using React Hook Form, use FormInput instead
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  required = false,
  endAdornment,
  className = '',
  disabled = false,
  id,
  name,
  ...props
}) => {
  const inputId = id || name;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ms-1 text-error">*</span>}
        </label>
      )}
      <div className="ltr relative">
        <input
          id={inputId}
          name={name}
          disabled={disabled}
          className={`block w-full rounded-md border bg-input text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm ${error ? 'border-error focus:border-error focus:ring-error' : 'border-input-border'} ${endAdornment ? 'pe-10' : ''} ${className} ${disabled && 'cursor-not-allowed bg-muted opacity-50'} `}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 end-0 flex items-center pe-3">{endAdornment}</div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};
