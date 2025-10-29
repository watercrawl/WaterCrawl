import React, { Fragment, useState, useRef, useEffect } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Transition } from '@headlessui/react';

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
  placeholder = 'Select an option',
  className = '',
  label,
  disabled = false
}) => {
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
  
  const filteredItems = query === ''
    ? items
    : items.filter((item) => {
        return item.label.toLowerCase().includes(query.toLowerCase());
      });

  // Get the display value for the selected item
  const getDisplayValue = (value: string) => {
    const item = items.find((item) => item.id === value);
    return item?.label || '';
  };

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
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
          <div className="relative w-full rounded-t-md rounded-b-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-left sm:text-sm overflow-hidden">
            {/* Combobox button for dropdown toggling */}
            <Combobox.Button className="w-full text-left">
              <ComboboxInput
                className="w-full border-none py-2 pl-10 pr-4 text-sm leading-5 text-gray-900 dark:text-white bg-transparent focus:ring-0 cursor-pointer"
                placeholder={placeholder}
                displayValue={() => getDisplayValue(value)}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
                disabled={disabled}
                onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent click bubbling
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
            </Combobox.Button>
            
            {/* Clear button outside Combobox.Button to ensure it works separately */}
            {value && (
              <div 
                className="absolute inset-y-0 right-0 flex items-center pr-2 z-10"
              >
                <button
                  type="button"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange('');
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  disabled={disabled}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              className={`
                ${position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}
                absolute z-10 max-h-60 w-full overflow-auto 
                rounded-md bg-white dark:bg-gray-800 py-1 text-base 
                shadow-lg ring-1 ring-black ring-opacity-5 
                focus:outline-none sm:text-sm border border-gray-200 dark:border-gray-700
                scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600
              `}
            >
              {filteredItems.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                  Nothing found.
                </div>
              ) : (
                // Check if we have any items with categories
                filteredItems.some(item => item.category) ? (
                  // Group by category
                  [...new Set(filteredItems.map(item => item.category || 'Other'))].map(category => {
                    const categoryItems = filteredItems.filter(item => (item.category || 'Other') === category);
                    return (
                      <div key={category}>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
                          {category}
                        </div>
                        {categoryItems.map((item) => (
                          <ComboboxOption
                            key={item.id}
                            className={({ active }: { active: boolean }) =>
                              `relative select-none py-2 pl-10 pr-4 ${
                                item.disabled ? 'cursor-not-allowed text-gray-400 dark:text-gray-500' :
                                active ? 'cursor-default bg-primary-600 text-white' : 'cursor-default text-gray-900 dark:text-white'
                              }`
                            }
                            value={item.id}
                            disabled={disabled || item.disabled}
                          >
                            {({ selected, active }: { selected: boolean; active: boolean }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {item.label}
                                </span>
                                {selected ? (
                                  <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                    active ? 'text-white' : 'text-primary-600'
                                  }`}>
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
                  filteredItems.map((item) => (
                    <ComboboxOption
                      key={item.id}
                      className={({ active }: { active: boolean }) =>
                        `relative select-none py-2 pl-10 pr-4 ${
                          item.disabled ? 'cursor-not-allowed text-gray-400 dark:text-gray-500' :
                          active ? 'cursor-default bg-primary-600 text-white' : 'cursor-default text-gray-900 dark:text-white'
                        }`
                      }
                      value={item.id}
                      disabled={disabled || item.disabled}
                    >
                      {({ selected, active }: { selected: boolean; active: boolean }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {item.label}
                          </span>
                          {selected ? (
                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-primary-600'
                            }`}>
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </ComboboxOption>
                  ))
                )
              )}
            </ComboboxOptions>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
};

export default ComboboxComponent;
