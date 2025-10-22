import React from 'react';
import { Switch } from '@headlessui/react';
import { FieldProps } from '../types/schema';
import { InfoTooltip } from '../../shared/FormComponents';
import { useDirection } from '../../../contexts/DirectionContext';

export const SwitchWidget: React.FC<FieldProps> = ({
  schema,
  value,
  onChange,
  onBlur,
  disabled,
}) => {
  const { direction } = useDirection();
  return (
    <Switch.Group>
      <div className="flex items-center gap-x-3">
        <Switch
          checked={value || false}
          onChange={onChange}
          disabled={schema.disabled || disabled}
          onBlur={onBlur}
          className={`${
            value ? 'bg-primary' : 'bg-muted'
          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
        >
          <span
            className={`${
              value ? (direction === 'rtl' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out`}
          />
        </Switch>
        {(schema.title || schema.description) && (
          <div className="flex-1">
            <div className="flex items-center gap-x-1">
              {schema.title && (
                <Switch.Label className="cursor-pointer text-sm font-medium text-foreground">
                  {schema.title}
                </Switch.Label>
              )}
              {schema.description && <InfoTooltip content={schema.description} />}
            </div>
          </div>
        )}
      </div>
    </Switch.Group>
  );
};
