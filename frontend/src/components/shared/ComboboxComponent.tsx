import React, { Fragment, useState, useRef, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  Transition,
} from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

export interface ComboboxItem {
  id: string;
  label: string;
  category?: string;
  disabled?: boolean;
}

interface ComboboxComponentProps {
  items: ComboboxItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
}

const ComboboxComponent: React.FC<ComboboxComponentProps> = ({
  items,
  value,
  onChange,
  placeholder,
  className = '',
  label,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('common.selectOption');
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to check for available space and apply appropriate positioning
  const updateDropdownPosition = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const minSpaceNeeded = 200; // Minimum space needed for dropdown

    // Set position based on available space
    if (spaceBelow < minSpaceNeeded && rect.top > minSpaceNeeded) {
      setPosition('top');
    } else {
      setPosition('bottom');
    }
  };

  // Check position on mount, resize, and scroll
  useEffect(() => {
    const handlePositionUpdate = () => {
      setTimeout(updateDropdownPosition, 0);
    };

    // Initial check
    updateDropdownPosition();

    // Add event listeners
    window.addEventListener('resize', handlePositionUpdate);
    window.addEventListener('scroll', handlePositionUpdate, true);

    return () => {
      window.removeEventListener('resize', handlePositionUpdate);
      window.removeEventListener('scroll', handlePositionUpdate, true);
    };
  }, []);

  const filteredItems =
    query === ''
      ? items
      : items.filter(item => {
          return item.label.toLowerCase().includes(query.toLowerCase());
        });

  // Get the display value for the selected item
  const getDisplayValue = (value: string) => {
    const item = items.find(item => item.id === value);
    return item?.label || '';
  };

  return (
    <div className={className} ref={containerRef}>
      {label && <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>}
      <Combobox
        value={value}
        onChange={(newValue: string | null) => {
          onChange(newValue || '');
          updateDropdownPosition();
        }}
        disabled={disabled}
        as="div"
        className="relative"
      >
        <div className="group relative w-full cursor-pointer rounded-md focus:border-b-0">
          {/* Input container */}
          <div className="relative w-full overflow-hidden rounded-b-md rounded-t-md border border-input-border text-start sm:text-sm">
            {/* Combobox button for dropdown toggling */}
            <Combobox.Button className="w-full text-start">
              <ComboboxInput
                className="w-full cursor-pointer border-none bg-transparent py-2 pe-4 ps-10 text-sm leading-5 text-foreground focus:ring-0"
                placeholder={defaultPlaceholder}
                displayValue={() => getDisplayValue(value)}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setQuery(event.target.value)
                }
                disabled={disabled}
                onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent click bubbling
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
                <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
            </Combobox.Button>

            {/* Clear button outside Combobox.Button to ensure it works separately */}
            {value && (
              <div className="absolute inset-y-0 end-0 z-10 flex items-center pe-2">
                <button
                  type="button"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange('');
                  }}
                  className="text-muted-foreground hover:text-muted-foreground focus:outline-none"
                  disabled={disabled}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Dropdown panel without spacing */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <ComboboxOptions
              className={` ${position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} scrollbar-thin scrollbar-thumb-gray-400 absolute z-10 max-h-60 w-full overflow-auto rounded-md border border-border bg-card py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm`}
            >
              {filteredItems.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none px-4 py-2 text-foreground">
                  {t('common.nothingFound')}
                </div>
              ) : // Check if we have any items with categories
              filteredItems.some(item => item.category) ? (
                // Group by category
                [...new Set(filteredItems.map(item => item.category || 'Other'))].map(category => {
                  const categoryItems = filteredItems.filter(
                    item => (item.category || 'Other') === category
                  );
                  return (
                    <div key={category}>
                      <div className="bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {categoryItems.map(item => (
                        <ComboboxOption
                          key={item.id}
                          className={({ active }: { active: boolean }) =>
                            `relative select-none py-2 pe-4 ps-10 ${
                              item.disabled
                                ? 'cursor-not-allowed text-muted-foreground'
                                : active
                                  ? 'cursor-default bg-primary text-white'
                                  : 'cursor-default text-foreground'
                            }`
                          }
                          value={item.id}
                          disabled={disabled || item.disabled}
                        >
                          {({ selected, active }: { selected: boolean; active: boolean }) => (
                            <>
                              <span
                                className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                              >
                                {item.label}
                              </span>
                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 start-0 flex items-center ps-3 ${
                                    active ? 'text-white' : 'text-primary'
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </ComboboxOption>
                      ))}
                    </div>
                  );
                })
              ) : (
                // Regular flat list
                filteredItems.map(item => (
                  <ComboboxOption
                    key={item.id}
                    className={({ active }: { active: boolean }) =>
                      `relative select-none py-2 pe-4 ps-10 ${
                        item.disabled
                          ? 'cursor-not-allowed text-muted-foreground'
                          : active
                            ? 'cursor-default bg-primary text-white'
                            : 'cursor-default text-foreground'
                      }`
                    }
                    value={item.id}
                    disabled={disabled || item.disabled}
                  >
                    {({ selected, active }: { selected: boolean; active: boolean }) => (
                      <>
                        <span
                          className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                        >
                          {item.label}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 start-0 flex items-center ps-3 ${
                              active ? 'text-white' : 'text-primary'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
};

export default ComboboxComponent;
