import React from 'react';
import { FieldProps } from '../types/schema';

export const CheckboxWidget: React.FC<FieldProps> = ({
  schema,
  value,
  onChange,
  errors,
  required,
}) => {
  const hasError = errors && errors.length > 0;
  const ui = schema.ui || {};

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(e.target.checked)}
        className={`
          h-4 w-4 rounded border-gray-300 text-primary-600 
          focus:ring-primary-600 dark:border-gray-600 
          dark:focus:ring-primary-500 dark:ring-offset-gray-800
          ${hasError ? 'border-red-500 dark:border-red-500' : ''}
          ${ui.inputClassName || ''}
        `}
        required={required}
        disabled={schema.readOnly}
      />
      {schema.title && (
        <label
          className={`ml-2 block text-sm text-gray-900 dark:text-white ${
            ui.labelClassName || ''
          }`}
        >
          {schema.title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
    </div>
  );
};
