import React from 'react';

import { useFormContext } from 'react-hook-form';

import { FormInputProps } from '../../types/user';

export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type,
  placeholder,
  error,
  required = false,
  endAdornment,
  className = '',
  disabled = false,
}) => {
  const { register } = useFormContext();

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ms-1 text-error">*</span>}
      </label>
      <div className="ltr relative">
        <input
          {...register(name)}
          type={type}
          id={name}
          placeholder={placeholder}
          disabled={disabled}
          className={`block w-full rounded-md border bg-input text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm ${error ? 'border-error focus:border-error focus:ring-error' : 'border-input-border'} ${endAdornment ? 'pe-10' : ''} ${className} ${disabled && 'cursor-not-allowed bg-muted opacity-50'} `}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 end-0 flex items-center">{endAdornment}</div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};
