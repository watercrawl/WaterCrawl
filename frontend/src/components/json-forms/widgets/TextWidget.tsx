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
      className="block w-full rounded-md border border-input-border bg-input px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
};
