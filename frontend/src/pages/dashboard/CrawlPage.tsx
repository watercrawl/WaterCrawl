import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CrawlForm } from '../../components/crawl/CrawlForm';
import { CrawlRequest } from '../../types/crawl';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

const CrawlPage: React.FC = () => {
  const location = useLocation();
  const [initialRequest, setInitialRequest] = useState<CrawlRequest | null>(null);
  const {setItems} = useBreadcrumbs();
  useEffect(() => {
    setItems([
      { label: 'Dashboard', href: '/dashboard'},
      { label: 'Crawl Playground', href: '/dashboard/crawl', current: true },
    ]);
  }, [setItems]);

  useEffect(() => {
    // Load request from navigation state if available
    if (location.state?.request && !initialRequest) {
      setInitialRequest(location.state.request);
    }
  }, [location.state, initialRequest]);

  return (
    <div className="px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Crawl Playground</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Test and experiment with different crawling configurations in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <CrawlForm
          initialRequest={initialRequest}
        />
      </div>
    </div>
  );
};

export default CrawlPage;
