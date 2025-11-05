import React, { createContext, useContext, useState, useCallback, Fragment } from 'react';

import { useTranslation } from 'react-i18next';

import { Dialog, Transition } from '@headlessui/react';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  requireInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  expectedInput?: string;
  warningMessage?: string;
  onConfirm: () => void | Promise<void>;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    setInputValue('');
    setInputError('');
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setIsOpen(false);
    setInputValue('');
    setInputError('');
    setTimeout(() => setOptions(null), 300);
  }, [isLoading]);

  const handleConfirm = useCallback(async () => {
    if (!options) return;

    // Validate input if required
    if (options.requireInput && options.expectedInput) {
      if (inputValue.trim() !== options.expectedInput.trim()) {
        setInputError(t('common.confirmError', { expected: options.expectedInput }));
        return;
      }
    }

    setIsLoading(true);
    try {
      await options.onConfirm();
      handleClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [options, inputValue, handleClose, t]);

  const getVariantConfig = (variant: ConfirmVariant = 'danger') => {
    const configs = {
      danger: {
        icon: ExclamationTriangleIcon,
        iconBgColor: 'bg-error',
        iconColor: 'text-error-foreground',
        buttonClass: 'bg-error hover:bg-error-strong hover:text-error-soft focus:ring-error',
      },
      warning: {
        icon: ExclamationCircleIcon,
        iconBgColor: 'bg-warning',
        iconColor: 'text-warning-foreground',
        buttonClass: 'bg-warning hover:bg-warning-strong hover:text-warning-soft focus:ring-warning',
      },
      info: {
        icon: InformationCircleIcon,
        iconBgColor: 'bg-info',
        iconColor: 'text-info-foreground',
        buttonClass: 'bg-info hover:bg-info-strong hover:text-info-soft focus:ring-info',
      },
      success: {
        icon: CheckCircleIcon,
        iconBgColor: 'bg-success',
        iconColor: 'text-success-foreground',
        buttonClass: 'bg-success hover:bg-success-strong hover:text-success-soft focus:ring-success',
      },
    };
    return configs[variant];
  };

  const variantConfig = options ? getVariantConfig(options.variant) : getVariantConfig('danger');
  const IconComponent = variantConfig.icon;

  // Check if confirm button should be disabled
  const isConfirmDisabled = isLoading || Boolean(options?.requireInput && options?.expectedInput && inputValue.trim() !== options.expectedInput.trim());

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-6 text-start align-middle shadow-xl transition-all">
                  <div className="space-y-4">
                    {/* Icon and Title */}
                    <div className="flex items-center gap-x-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${variantConfig.iconBgColor}`}>
                        <IconComponent className={`h-6 w-6 ${variantConfig.iconColor}`} aria-hidden="true" />
                      </div>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-foreground">
                        {options.title}
                      </Dialog.Title>
                    </div>

                    {/* Message */}
                    <div>
                      <p className="text-sm text-muted-foreground">{options.message}</p>
                    </div>

                    {/* Warning Message */}
                    {options.warningMessage && (
                      <div className={`rounded-md p-3 ${variantConfig.iconBgColor}`}>
                        <p className={`text-sm ${variantConfig.iconColor}`}>{options.warningMessage}</p>
                      </div>
                    )}

                    {/* Input Field */}
                    {options.requireInput && (
                      <div>
                        {options.inputLabel && (
                          <label
                            htmlFor="confirm-input"
                            className="block text-sm font-medium text-foreground"
                          >
                            {options.inputLabel}
                          </label>
                        )}
                        <input
                          id="confirm-input"
                          type="text"
                          value={inputValue}
                          onChange={e => {
                            setInputValue(e.target.value);
                            setInputError('');
                          }}
                          placeholder={options.inputPlaceholder}
                          className={`mt-2 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${
                            inputError
                              ? 'border-error focus:border-error focus:ring-error'
                              : 'border-input-border bg-input focus:border-primary focus:ring-primary'
                          }`}
                          disabled={isLoading}
                          autoFocus
                        />
                        {inputError && <p className="mt-1 text-sm text-error">{inputError}</p>}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-x-3 pt-2">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        onClick={handleClose}
                        disabled={isLoading}
                      >
                        {options.cancelText || t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        className={`inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          variantConfig.buttonClass
                        }`}
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                      >
                        {isLoading ? (
                          <>
                            <div className="me-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {t('common.deleting')}
                          </>
                        ) : (
                          options.confirmText || t('common.delete')
                        )}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      )}
    </ConfirmContext.Provider>
  );
};
