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
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          {...register(name)}
          type={type}
          id={name}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full rounded-md shadow-sm
            text-gray-900 dark:text-white
            bg-white dark:bg-gray-700
            border-gray-300 dark:border-gray-600
            focus:border-primary-500 dark:focus:border-primary-400
            focus:ring-primary-500 dark:focus:ring-primary-400
            sm:text-sm
            ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}
            ${endAdornment ? 'pr-10' : ''}
            ${className}
            ${disabled && 'opacity-50 cursor-not-allowed'}
          `}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
