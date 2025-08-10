import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useTeam } from '../../../contexts/TeamContext';
import { formatDistanceToNow } from 'date-fns';
import UsageLimitBox from '../../../components/shared/UsageLimitBox';
import { useSettings } from '../../../contexts/SettingsProvider';

const KnowledgeBasePage: React.FC = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setItems } = useBreadcrumbs();
  const { currentSubscription } = useTeam();
  const { settings } = useSettings();

  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      try {
        const response = await knowledgeBaseApi.list();
        setKnowledgeBases(response.results);
      } catch (error) {
        console.error('Failed to fetch knowledge bases:', error);
        toast.error('Failed to load knowledge bases');
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnowledgeBases();
  }, []);

  useEffect(() => {
    setItems([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Knowledge Bases', href: '/dashboard/knowledge-base', current: true },
    ]);
  }, [setItems]);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Knowledge Base<small className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">beta</small></h1>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                Create and manage knowledge bases for your AI-powered search applications.
              </p>
            </div>

            {/* Compact Usage Status */}
            {currentSubscription && (
              <div className="hidden sm:block">
                <UsageLimitBox
                  label="Usage"
                  current={knowledgeBases.length}
                  limit={currentSubscription.number_of_knowledge_bases}
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/dashboard/knowledge-base/new"
            className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${currentSubscription && currentSubscription.number_of_knowledge_bases !== -1 && knowledgeBases.length >= currentSubscription.number_of_knowledge_bases
                ? 'text-gray-400 bg-gray-300 cursor-not-allowed'
                : 'text-white bg-primary-600 hover:bg-primary-700'
              }`}
            {...(currentSubscription && currentSubscription.number_of_knowledge_bases !== -1 && knowledgeBases.length >= currentSubscription.number_of_knowledge_bases
              ? { onClick: (e) => e.preventDefault() }
              : {})}
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Knowledge Base
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ) : knowledgeBases.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No knowledge bases yet. Create one to get started.
            </div>
            <div className="mt-4">
              <Link
                to="/dashboard/knowledge-base/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Create Knowledge Base
              </Link>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  Models
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  Items
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  Status
                </th>
                {settings?.is_enterprise_mode_active && (
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                  >
                    Cost Per Document
                  </th>
                )}
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  Created
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {knowledgeBases.map((kb) => (
                <tr key={kb.uuid}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-200 sm:pl-6">
                    <Link to={`/dashboard/knowledge-base/${kb.uuid}`} className="hover:text-primary-600">
                      {kb.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Embedding: <strong>{kb.embedding_model?.name || '-'}</strong> <br />Summarization: <strong>{kb.summarization_model?.name || '-'}</strong>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {kb.document_count}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <StatusBadge status={kb.status} />
                  </td>
                  {settings?.is_enterprise_mode_active && (
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {kb.knowledge_base_each_document_cost}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {kb.created_at ? formatDistanceToNow(new Date(kb.created_at)) : 'Unknown'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex items-center justify-end space-x-4">
                      <Link to={`/dashboard/knowledge-base/${kb.uuid}`} className="text-gray-400 hover:text-primary-500" title="View Chunks">
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/dashboard/knowledge-base/${kb.uuid}/edit`}
                        className="text-gray-400 hover:text-primary-500"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
