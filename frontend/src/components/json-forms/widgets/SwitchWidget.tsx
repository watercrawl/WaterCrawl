import React from 'react';

import { Switch, SwitchGroup, Label } from '@headlessui/react';

import { FieldProps } from '../types/schema';

import { useDirection } from '../../../contexts/DirectionContext';
import { InfoTooltip } from '../../shared/FormComponents';

// Convert field name to readable label (snake_case/camelCase to Title Case)
const formatFieldName = (name: string): string => {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to spaces
    .replace(/[_-]/g, ' ') // snake_case/kebab-case to spaces
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
};

export const SwitchWidget: React.FC<FieldProps> = ({
  schema,
  path,
  value,
  onChange,
  onBlur,
  disabled,
}) => {
  const { direction } = useDirection();

  // Get display label: use title if available, otherwise format the field name from path
  const fieldName = path.length > 0 ? path[path.length - 1] : '';
  const displayLabel = schema.title || (fieldName ? formatFieldName(fieldName) : '');

  return (
    <SwitchGroup>
      <div className="flex items-center gap-2">
        <Switch
          checked={value || false}
          onChange={onChange}
          disabled={schema.disabled || disabled}
          onBlur={onBlur}
          className={`${
            value ? 'bg-primary' : 'bg-muted'
          } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span
            className={`${
              value ? (direction === 'rtl' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
            } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out`}
          />
        </Switch>
        {(displayLabel || schema.description) && (
          <div className="flex items-center gap-1">
            {displayLabel && (
              <Label className="cursor-pointer text-sm font-medium text-foreground">
                {displayLabel}
              </Label>
            )}
            {schema.description && <InfoTooltip content={schema.description} />}
          </div>
        )}
      </div>
    </SwitchGroup>
  );
};
