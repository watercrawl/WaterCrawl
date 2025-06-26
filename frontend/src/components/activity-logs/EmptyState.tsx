import React from 'react';
import { SpiderIcon } from '../icons/SpiderIcon';
import { Link } from 'react-router-dom';

export const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center">
        <SpiderIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No crawl requests yet</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Get started by creating your first crawl request in the playground.
      </p>
      <div className="mt-6">
        <Link
          to="/dashboard/crawl"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
        >
          Go to Crawl Playground
        </Link>
      </div>
    </div>
  );
};
