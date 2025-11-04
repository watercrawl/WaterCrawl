import React from 'react';

interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  description?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  disabled = false,
  className = '',
  showValue = true,
  formatValue = val => val.toString(),
  description,
}) => {
  // If min == max, show as read-only
  const isReadOnly = min === max;
  const displayValue = isReadOnly ? min : value;

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    onChange(newValue);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">{label}</label>
          {showValue && (
            <span className="font-mono text-sm text-muted-foreground">
              {formatValue(displayValue)}
            </span>
          )}
        </div>
      )}

      {isReadOnly ? (
        <div className="w-full">
          <div className="relative h-2 w-full rounded-lg bg-muted">
            {/* Single position indicator for read-only */}
            <div className="absolute start-1/2 top-0 -mt-1 h-4 w-4 -translate-x-1/2 transform rounded-full border-2 border-white bg-muted" />
          </div>
          <div className="mt-1 flex justify-center">
            <span className="text-xs text-muted-foreground">Fixed at {formatValue(min)}</span>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <div className="relative">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={handleSliderChange}
              disabled={disabled}
              className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-colors [&::-moz-range-thumb]:hover:bg-primary-hover [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:hover:bg-primary-hover`}
            />
          </div>

          {/* Min/Max labels */}
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{formatValue(min)}</span>
            <span>{formatValue(max)}</span>
          </div>
        </div>
      )}

      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
};

export default Slider;
