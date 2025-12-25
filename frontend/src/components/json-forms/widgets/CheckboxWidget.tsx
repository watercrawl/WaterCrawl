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
        onChange={e => onChange(e.target.checked)}
        className={`h-3.5 w-3.5 rounded border-input-border text-primary focus:ring-primary focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${hasError ? 'border-error' : ''} ${ui.inputClassName || ''}`}
        required={required}
        disabled={schema.disabled || schema.readOnly}
      />
      {schema.title && (
        <label className={`ms-1.5 text-sm text-foreground ${ui.labelClassName || ''}`}>
          {schema.title}
          {required && <span className="ms-0.5 text-error">*</span>}
        </label>
      )}
    </div>
  );
};
