import React from 'react';
import { FieldProps } from '../types/schema';

export const RadioWidget: React.FC<FieldProps> = ({
  schema,
  value,
  onChange,
  onBlur,
  errors,
  required,
}) => {
  const hasError = errors && errors.length > 0;
  const ui = schema.ui || {};
  const options = ui.options || schema.enum?.map(value => ({ label: value, value })) || [];

  return (
    <div className={`space-y-2 ${ui.inline ? 'flex gap-x-4 space-y-0' : ''}`}>
      {options.map((option, index) => (
        <label
          key={index}
          className={`inline-flex items-center ${schema.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
            ui.labelClassName || ''
          }`}
        >
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={schema.disabled}
            required={required}
            className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 ${hasError ? 'border-red-500' : ''} ${
              ui.inputClassName || ''
            }`}
          />
          <span className="ms-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
        </label>
      ))}
    </div>
  );
};
