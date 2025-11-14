import React from 'react';

import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

import { ValidationMessageProps } from '../../types/user';

export const ValidationMessage: React.FC<ValidationMessageProps> = ({ message, type }) => {
  const isError = type === 'error';
  const Icon = isError ? XCircleIcon : CheckCircleIcon;
  const baseClasses = 'rounded-md p-4 flex items-center gap-x-2';
  const colorClasses = isError
    ? 'bg-error-soft text-error-strong'
    : 'bg-success-soft text-success-strong';

  return (
    <div className={`${baseClasses} ${colorClasses}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
