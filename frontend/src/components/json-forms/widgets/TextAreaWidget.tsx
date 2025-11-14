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
      className={`w-full rounded-md border bg-input text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary ${
        hasError ? 'border-error focus:border-error focus:ring-error' : 'border-input-border'
      } ${ui.inputClassName || ''}`}
    />
  );
};
