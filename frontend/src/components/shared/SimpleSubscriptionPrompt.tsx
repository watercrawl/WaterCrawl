import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export const SimpleSubscriptionPrompt: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-50" />
      
      <div className="relative p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Activate Your WaterCrawl Account
          </h3>

          <p className="text-gray-600 dark:text-gray-300">
            Choose a subscription plan to start using WaterCrawl's powerful web crawling features.
          </p>

          <Link
            to="/dashboard/plans"
            className="group inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            View Available Plans
            <ArrowRightIcon className="ml-2 -mr-1 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
