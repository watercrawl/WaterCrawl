import React from 'react';
import { FieldProps } from '../types/schema';

export const NumberWidget: React.FC<FieldProps> = ({
  schema,
  value,
  onChange,
  onBlur,
  errors,
  required,
  disabled,
}) => {
  const hasError = errors && errors.length > 0;

  return (
    <input
      type="number"
      value={value || ''}
      onChange={(e) => {
        const val = e.target.value;
        const numberValue = val === '' ? undefined : Number(val);
        onChange(numberValue);
      }}
      onBlur={onBlur}
      placeholder={schema.placeholder}
      required={required}
      disabled={schema.disabled || disabled}
      readOnly={schema.readOnly}
      min={schema.minimum}
      max={schema.maximum}
      step={schema.multipleOf}
      className={`block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 dark:focus:ring-primary-500 dark:bg-gray-800 sm:text-sm sm:leading-6 ${
        hasError ? 'ring-red-500 focus:ring-red-500' : ''
      }`}
    />
  );
};
