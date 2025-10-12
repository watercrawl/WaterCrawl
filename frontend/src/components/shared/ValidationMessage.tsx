import React from 'react';
import { ValidationMessageProps } from '../../types/user';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export const ValidationMessage: React.FC<ValidationMessageProps> = ({ message, type }) => {
  const isError = type === 'error';
  const Icon = isError ? XCircleIcon : CheckCircleIcon;
  const baseClasses = 'rounded-md p-4 flex items-center gap-x-2';
  const colorClasses = isError
    ? 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200'
    : 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-200';

  return (
    <div className={`${baseClasses} ${colorClasses}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
