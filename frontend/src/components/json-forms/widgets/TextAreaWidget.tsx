import React from 'react';
import { FieldProps } from '../types/schema';

export const TextAreaWidget: React.FC<FieldProps> = ({
  schema,
  value,
  onChange,
  onBlur,
  errors,
  required,
}) => {
  const hasError = errors && errors.length > 0;
  const ui = schema.ui || {};

  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={ui.placeholder}
      required={required}
      disabled={schema.disabled}
      readOnly={schema.readOnly}
      rows={ui.rows || 3}
      cols={ui.cols}
      className={`w-full px-3 py-2 bg-transparent border ${
        hasError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
      } rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 ${
        hasError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-primary-500 focus:border-primary-500'
      } dark:focus:border-primary-500 transition-colors ${ui.inputClassName || ''}`}
    />
  );
};
