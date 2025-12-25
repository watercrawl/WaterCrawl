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
    <div className={`space-y-1.5 ${ui.inline ? 'flex gap-x-3 space-y-0' : ''}`}>
      {options.map((option, index) => (
        <label
          key={index}
          className={`inline-flex items-center ${schema.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
            ui.labelClassName || ''
          }`}
        >
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={e => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={schema.disabled}
            required={required}
            className={`h-3.5 w-3.5 border-input-border text-primary focus:ring-primary focus:ring-1 ${hasError ? 'border-error' : ''} ${
              ui.inputClassName || ''
            }`}
          />
          <span className="ms-1.5 text-sm text-foreground">{option.label}</span>
        </label>
      ))}
    </div>
  );
};
