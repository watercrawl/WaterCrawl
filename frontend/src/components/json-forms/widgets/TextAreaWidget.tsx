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
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={ui.placeholder}
      required={required}
      disabled={schema.disabled}
      readOnly={schema.readOnly}
      rows={ui.rows || 3}
      cols={ui.cols}
      className={`w-full border bg-transparent px-3 py-2 ${
        hasError ? 'border-error' : 'border-border'
      } rounded-md text-foreground focus:outline-none focus:ring-1 ${
        hasError ? 'focus:border-error focus:ring-error' : 'focus:border-primary focus:ring-primary'
      } transition-colors ${ui.inputClassName || ''}`}
    />
  );
};
