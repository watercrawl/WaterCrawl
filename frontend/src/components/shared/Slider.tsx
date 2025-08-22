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
  formatValue = (val) => val.toString(),
  description
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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          {showValue && (
            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {formatValue(displayValue)}
            </span>
          )}
        </div>
      )}

      {isReadOnly ? (
        <div className="w-full">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg h-2 relative">
            {/* Single position indicator for read-only */}
            <div 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded-full -mt-1 border-2 border-white dark:border-gray-800"
            />
          </div>
          <div className="flex justify-center mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Fixed at {formatValue(min)}
            </span>
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
              className={`
                w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
                disabled:cursor-not-allowed disabled:opacity-50
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary-600
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:hover:bg-primary-700
                [&::-webkit-slider-thumb]:transition-colors
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary-600
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-white
                [&::-moz-range-thumb]:shadow-md
                [&::-moz-range-thumb]:hover:bg-primary-700
                [&::-moz-range-thumb]:transition-colors
                [&::-moz-range-thumb]:border-none
                [&::-moz-range-track]:bg-transparent
              `}
            />
          </div>
          
          {/* Min/Max labels */}
          <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatValue(min)}</span>
            <span>{formatValue(max)}</span>
          </div>
        </div>
      )}

      {description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
};

export default Slider;
