import React from 'react';

interface SwitchProps {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ 
  checked, 
  onChange, 
  label, 
  disabled = false,
  className = '' 
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer 
          rounded-full border-2 border-transparent transition-colors 
          duration-200 ease-in-out focus:outline-none focus:ring-2 
          focus:ring-primary-500 focus:ring-offset-2
          ${checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span 
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full 
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
      
      {label && (
        <label 
          className={`
            text-sm font-medium 
            ${disabled ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
          `}
        >
          {label}
        </label>
      )}
    </div>
  );
};
