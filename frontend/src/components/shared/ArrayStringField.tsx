import React, { useState } from 'react';
import { FormInput, InfoTooltip } from './FormComponents';
import Button from './Button';
import { PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';

interface ArrayStringFieldProps {
  label: string;
  tooltipContent?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

const ArrayStringField: React.FC<ArrayStringFieldProps> = ({
  label,
  tooltipContent,
  values,
  onChange,
  placeholder = 'Enter a value',
  className = '',
}) => {
  const [newValue, setNewValue] = useState('');

  const handleAddValue = () => {
    if (newValue.trim()) {
      const updatedValues = [...values, newValue.trim()];
      onChange(updatedValues);
      setNewValue('');
    }
  };

  const handleRemoveValue = (valueToRemove: string) => {
    const updatedValues = values.filter(value => value !== valueToRemove);
    onChange(updatedValues);
  };

  // Note: We could add keyboard event handling here if FormInput supported it

  return (
    <div className={className}>
      <div className="flex items-center space-x-1 mb-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {tooltipContent && <InfoTooltip content={tooltipContent} />}
      </div>
      <div className="flex space-x-2">
        <div className="flex-1">
          <FormInput
            label=""
            value={newValue}
            onChange={setNewValue}
            type="text"
            placeholder={placeholder}
            className="w-full"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className='!px-3 !py-2 h-[40px] mt-1'
          onClick={handleAddValue}
          disabled={!newValue.trim()}
        >
          <PlusIcon className="h-5 w-5" />
        </Button>
      </div>

      {values.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-2">
            {values.map((value, index) => (
              <span
                key={`${label}-${index}`}
                className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm"
              >
                {value}
                <button
                  type="button"
                  onClick={() => handleRemoveValue(value)}
                  className="ml-1.5 inline-flex items-center justify-center rounded-full h-4 w-4 bg-blue-200 dark:bg-blue-800 hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors"
                  aria-label="Remove"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArrayStringField;
