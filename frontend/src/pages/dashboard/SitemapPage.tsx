import React from 'react';
import { useLocation } from 'react-router-dom';
import { SitemapForm } from '../../components/sitemap/SitemapForm';
import { SitemapRequest } from '../../types/sitemap';

interface LocationState {
  request?: SitemapRequest;
}

const SitemapPage: React.FC = () => {
  const location = useLocation();
  const { request } = (location.state as LocationState) || {};

  return (
    <div className="px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Sitemap Explorer <small className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">beta</small>
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Discover and visualize website structure with our sitemap generation tool
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Show the SitemapForm by default since there's no specific sitemap configuration check */}
        <SitemapForm initialRequest={request || null} />
      </div>
    </div>
  );
};

export default SitemapPage;
