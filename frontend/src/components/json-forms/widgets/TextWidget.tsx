import React from 'react';

import { FieldProps } from '../types/schema';

interface TextWidgetProps extends FieldProps {
  type?: string;
}

export const TextWidget: React.FC<TextWidgetProps> = ({
  schema,
  value,
  onChange,
  onBlur,
  disabled,
  type = 'text',
}) => {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={schema.disabled || disabled}
      placeholder={schema.placeholder}
      className="block w-full rounded-md border border-input-border bg-input text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
    />
  );
};
