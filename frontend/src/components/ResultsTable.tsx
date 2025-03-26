import React, { useState } from 'react';
import { ActivityLogRow } from './activity-logs/ActivityLogRow';
import { ActivityLogExpandedRow } from './activity-logs/ActivityLogExpandedRow';
import { CrawlRequest, CrawlResult } from '../types/crawl';
import ResultModal from './ResultModal';

interface ResultsTableProps {
  request: CrawlRequest;
  results: CrawlResult[];
  isExpanded: boolean;
  isLoading: boolean;
  onRowClick: () => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  request,
  results,
  isExpanded,
  isLoading,
  onRowClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<CrawlResult | null>(null);

  const handlePreviewClick = (result: CrawlResult) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                URL
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Documents
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
            <ActivityLogRow
              request={request}
              isExpanded={isExpanded}
              showDates={false}
              onRowClick={onRowClick}
            />
          </tbody>
        </table>

        {/* Results List */}
        {isExpanded && (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <ActivityLogExpandedRow
              isLoading={false}
              results={results}
              onPreviewClick={handlePreviewClick}
              processing={isLoading}
            />
          </div>
        )}
      </div>

      {/* Result Modal */}
      {selectedResult && (
        <ResultModal
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
