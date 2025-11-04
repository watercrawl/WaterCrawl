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
      className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
    />
  );
};
