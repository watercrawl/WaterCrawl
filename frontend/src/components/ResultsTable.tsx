import React, { useState } from 'react';
import { CrawlRequest, CrawlResult } from '../types/crawl';
import CrawlResultModal from './ResultModal';
import { CrawlResultItems } from './activity-logs/CrawlResultItems';
import { StatusBadge } from './shared/StatusBadge';
import { EyeIcon } from '@heroicons/react/24/outline';
import { DownloadFormatSelector } from './shared/DownloadFormatSelector';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ResultsTableProps {
  request: CrawlRequest;
  results: CrawlResult[];
  isLoading: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  request,
  results,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<CrawlResult | null>(null);
  const navigate = useNavigate();

  const handlePreviewClick = (result: CrawlResult) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  const handleViewDetails = () => {
    if (!request.uuid) return;
    navigate(`/dashboard/logs/crawls/${request.uuid}`);
  };

  return (
    <>
      <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Header info card */}
        <div className="bg-white dark:bg-gray-900/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left side */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white break-all">
                {request.url}
              </h3>
              <div className="flex items-center gap-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 me-2">{t('crawl.results.status')}:</span>
                  <StatusBadge status={request.status} />
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 me-2">{t('crawl.results.documents')}:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{request.number_of_documents || 0}</span>
                </div>
              </div>
            </div>

            {/* Right side - actions */}
            <div className="flex items-center gap-x-3">
              <DownloadFormatSelector request={request} />
              <button
                onClick={handleViewDetails}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 inline-flex items-center gap-x-1 py-1 px-2 border border-gray-200 dark:border-gray-700 rounded"
                title={t('crawl.results.viewDetails')}
              >
                <EyeIcon className="h-4 w-4" />
                <span className="text-xs">{t('crawl.results.details')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results List - always visible */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <CrawlResultItems
            results={results}
            onPreviewClick={handlePreviewClick}
            processing={isLoading}
          />
        </div>
      </div>

      {/* Result Modal */}
      {selectedResult && (
        <CrawlResultModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedResult(null);
          }}
          result={selectedResult}
        />
      )}
    </>
  );
};
