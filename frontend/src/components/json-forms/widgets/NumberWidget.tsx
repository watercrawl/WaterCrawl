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
      onChange={e => {
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
      className={`block w-full rounded-md shadow-sm border bg-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm ${
        hasError ? 'border-error focus:border-error focus:ring-error' : 'border-input-border'
      }`}
    />
  );
};
