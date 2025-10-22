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
        className={`h-4 w-4 rounded border-input-border text-primary focus:ring-primary ${hasError ? 'border-error' : ''} ${ui.inputClassName || ''} `}
        required={required}
        disabled={schema.readOnly}
      />
      {schema.title && (
        <label className={`ms-2 block text-sm text-foreground ${ui.labelClassName || ''}`}>
          {schema.title}
          {required && <span className="ms-1 text-error">*</span>}
        </label>
      )}
    </div>
  );
};
