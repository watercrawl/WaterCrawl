import { Switch as HeadlessSwitch, Field, Label } from '@headlessui/react';
import React from 'react';
import { InfoTooltip } from './FormComponents';
import { useDirection } from '../../contexts/DirectionContext';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  const { direction } = useDirection();
  return (
    <Field>
      <div className="flex items-center gap-x-3">
        <HeadlessSwitch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={`${
            checked ? 'bg-primary' : 'bg-muted'
          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span
            className={`${
              checked ? (direction === 'rtl' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </HeadlessSwitch>
        <div className="flex-1">
          <div className="flex items-center gap-x-1">
            <Label className="cursor-pointer text-sm font-medium text-foreground">{label}</Label>
            {description && <InfoTooltip content={description} />}
          </div>
        </div>
      </div>
    </Field>
  );
};
