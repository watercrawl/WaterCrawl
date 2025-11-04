import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '80vw';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
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
          <div className="fixed inset-0 bg-black bg-opacity-50" />
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
              <Dialog.Panel
                className={`relative w-full ${
                  {
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
                    '80vw': 'w-[80vw] max-w-[80vw]',
                  }[size]
                } transform overflow-hidden rounded-2xl bg-card p-6 text-start align-middle shadow-xl transition-all`}
              >
                <Dialog.Title
                  as="h3"
                  className="pe-8 text-lg font-medium leading-6 text-foreground"
                >
                  {title}
                </Dialog.Title>

                <div className="absolute end-0 top-0 pe-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-card text-muted-foreground hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">{t('common.close')}</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-4">{children}</div>

                {footer && <div className="mt-6">{footer}</div>}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
