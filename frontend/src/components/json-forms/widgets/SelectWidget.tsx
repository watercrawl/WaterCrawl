import React from 'react';

import { FieldProps, SelectOption } from '../types/schema';

export const SelectWidget: React.FC<FieldProps> = ({
  schema,
  value,
  onChange,
  onBlur,
  errors,
  required,
}) => {
  const hasError = errors && errors.length > 0;
  const ui = schema.ui || {};

  const getOptions = (): SelectOption[] => {
    // First check for UI options
    if (ui.options) {
      return ui.options;
    }

    // Then check for enum values
    if (schema.enum) {
      // If enumNames is provided, use it for labels
      if (schema.enumNames && schema.enumNames.length === schema.enum.length) {
        return schema.enum.map((value, index) => ({
          label: schema.enumNames![index],
          value: value,
        }));
      }

      // Otherwise use enum values for both label and value
      return schema.enum.map(value => ({
        label: String(value),
        value: value,
      }));
    }

    return [];
  };

  const options = getOptions();

  return (
    <select
      value={value === undefined ? '' : value}
      onChange={e => {
        const selectedOption = options.find(opt => String(opt.value) === e.target.value);
        onChange(selectedOption ? selectedOption.value : e.target.value);
      }}
      onBlur={onBlur}
      className={`block w-full rounded-md border bg-input py-1.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${hasError ? 'border-error' : 'border-input-border'} ${ui.inputClassName || ''}`}
      required={required}
      disabled={schema.disabled}
    >
      {ui.placeholder && (
        <option value="" disabled={required}>
          {ui.placeholder}
        </option>
      )}
      {options.map((option, index) => (
        <option key={index} value={String(option.value)} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
