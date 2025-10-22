import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      <div className="mb-1 flex items-center gap-x-1">
        <label className="block text-sm font-medium text-foreground">{label}</label>
        {tooltipContent && <InfoTooltip content={tooltipContent} />}
      </div>
      <div className="flex gap-x-2">
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
          className="mt-1 h-[40px] !px-3 !py-2"
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
                className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-sm text-primary"
              >
                {value}
                <button
                  type="button"
                  onClick={() => handleRemoveValue(value)}
                  className="ms-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-primary/20"
                  aria-label={t('common.remove')}
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
