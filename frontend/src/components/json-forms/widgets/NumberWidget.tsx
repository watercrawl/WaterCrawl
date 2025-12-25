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
  const hasMinMax = schema.minimum !== undefined && schema.maximum !== undefined;
  const min = schema.minimum ?? 0;
  const max = schema.maximum ?? 100;
  const step = schema.multipleOf ?? (schema.type === 'integer' ? 1 : 0.1);
  const isDisabled = schema.disabled || disabled;

  // Show slider + number input when min and max are defined
  if (hasMinMax) {
    const currentValue = value ?? schema.default ?? min;

    return (
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={e => onChange(parseFloat(e.target.value))}
          disabled={isDisabled}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:transition-colors [&::-moz-range-thumb]:hover:bg-primary-hover [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:hover:bg-primary-hover"
        />
        <input
          type="number"
          value={currentValue}
          onChange={e => {
            const val = e.target.value;
            const numberValue = val === '' ? min : Number(val);
            const clampedValue = Math.min(Math.max(numberValue, min), max);
            onChange(clampedValue);
          }}
          onBlur={onBlur}
          min={min}
          max={max}
          step={step}
          disabled={isDisabled}
          className={`w-16 rounded-md border bg-input px-2 py-1 text-center text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${
            hasError ? 'border-error' : 'border-input-border'
          }`}
        />
      </div>
    );
  }

  // Fallback to simple number input
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={e => {
        const val = e.target.value;
        const numberValue = val === '' ? undefined : Number(val);
        onChange(numberValue);
      }}
      onBlur={onBlur}
      placeholder={schema.placeholder}
      required={required}
      disabled={isDisabled}
      readOnly={schema.readOnly}
      min={schema.minimum}
      max={schema.maximum}
      step={schema.multipleOf}
      className={`block w-full rounded-md border bg-input px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${
        hasError ? 'border-error' : 'border-input-border'
      }`}
    />
  );
};
