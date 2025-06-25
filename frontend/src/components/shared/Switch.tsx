import { Switch as HeadlessSwitch, Field, Label } from '@headlessui/react'
import React from 'react';
import { InfoTooltip } from './FormComponents';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ label, description, checked, onChange }) => {
  return (
    <Field>
      <div className="flex items-center space-x-3">
        <HeadlessSwitch
          checked={checked}
          onChange={onChange}
          className={`${checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
        >
          <span
            className={`${checked ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </HeadlessSwitch>
        <div className="flex-1">
          <div className="flex items-center space-x-1">
            <Label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
              {label}
            </Label>
            {description && <InfoTooltip content={description} />}
          </div>
        </div>
      </div>
    </Field>
  );
};
