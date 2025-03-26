import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon } from '@heroicons/react/24/outline';

const ENTERPRISE_FEATURES = [
  'Unlimited team members',
  'Unlimited pages credit',
  'Custom crawling rules',
  'Priority support',
  'Custom integrations',
  'Dedicated account manager',
] as const;

export const EnterprisePlan: React.FC = () => {
  return (
    <div className="mx-auto mt-12 max-w-5xl rounded-2xl ring-1 ring-gray-200 dark:ring-gray-700 lg:mx-0 lg:flex lg:max-w-none">
      <div className="p-6 sm:p-8 lg:flex-auto">
        <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
          Enterprise plan
        </h3>
        <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
          Looking for custom features, unlimited crawling, or special requirements? Our enterprise plan
          is designed for businesses that need more.
        </p>
        <div className="mt-6 flex items-center gap-x-4">
          <h4 className="flex-none text-sm font-semibold leading-6 text-blue-600 dark:text-blue-400">
            What's included
          </h4>
          <div className="h-px flex-auto bg-gray-100 dark:bg-gray-800" />
        </div>
        <ul
          role="list"
          className="mt-4 grid grid-cols-1 gap-3 text-sm leading-6 text-gray-600 dark:text-gray-300 sm:grid-cols-2"
        >
          {ENTERPRISE_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-x-2">
              <CheckIcon className="h-5 w-4 flex-none text-blue-600 dark:text-blue-400" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0 lg:flex lg:items-center">
        <div className="h-full w-full rounded-xl bg-gray-50 dark:bg-gray-800 py-8 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-12">
          <div className="mx-auto max-w-xs px-8">
            <p className="text-base font-semibold text-gray-600 dark:text-gray-300">
              Custom pricing
            </p>
            <p className="mt-4 flex items-baseline justify-center gap-x-2">
              <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Contact us
              </span>
            </p>
            <Link
              to="mailto:enterprise@watercrawl.dev"
              className="mt-8 block w-full rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
