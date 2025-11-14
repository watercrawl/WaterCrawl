import React, { Fragment } from 'react';

import { useTranslation } from 'react-i18next';

import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  iconBgClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-[90vw]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  icon: Icon,
  iconClassName = 'h-5 w-5 text-primary',
  iconBgClassName = 'bg-primary-soft',
}) => {
  const { t } = useTranslation();
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-card shadow-2xl transition-all`}
              >
                {/* Header */}
                <div className="border-b border-border/50 bg-muted/30 px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <div className={`rounded-lg p-2 ${iconBgClassName}`}>
                          <Icon className={iconClassName} />
                        </div>
                      )}
                      <div className="flex-1">
                        <Dialog.Title as="h3" className="text-lg font-bold text-foreground">
                          {title}
                        </Dialog.Title>
                        {description && (
                          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                        )}
                      </div>
                    </div>
                    {showCloseButton && (
                      <button
                        type="button"
                        className="ms-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        onClick={onClose}
                      >
                        <span className="sr-only">{t('common.close')}</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6">{children}</div>

                {/* Footer */}
                {footer && (
                  <div className="flex items-center justify-end gap-3 border-t border-border/50 bg-muted/20 px-6 py-4">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
