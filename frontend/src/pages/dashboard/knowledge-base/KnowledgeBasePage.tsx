import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useTeam } from '../../../contexts/TeamContext';
import UsageLimitBox from '../../../components/shared/UsageLimitBox';
import { useDateLocale } from '../../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../../utils/dateUtils';
import { useSettings } from '../../../contexts/SettingsProvider';
import { useTranslation } from 'react-i18next';

const KnowledgeBasePage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
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
        toast.error(t('settings.knowledgeBase.toast.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnowledgeBases();
  }, [t]);

  useEffect(() => {
    setItems([
      { label: t('common.dashboard'), href: '/dashboard' },
      { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base', current: true },
    ]);
  }, [setItems, t]);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('settings.knowledgeBase.title')}<small className="ms-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{t('settings.knowledgeBase.beta')}</small></h1>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {t('settings.knowledgeBase.subtitle')}
              </p>
            </div>

            {/* Compact Usage Status */}
            {currentSubscription && (
              <div className="hidden sm:block">
                <UsageLimitBox
                  label={t('settings.knowledgeBase.usage')}
                  current={knowledgeBases.length}
                  limit={currentSubscription.number_of_knowledge_bases}
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ms-16 sm:flex-none">
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
            <PlusIcon className="-ms-1 me-2 h-5 w-5" aria-hidden="true" />
            {t('settings.knowledgeBase.newButton')}
          </Link>
        </div>
      </div>

      {/* Beta Notice Box */}
      <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ms-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {t('settings.knowledgeBase.betaNotice.title')}
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                {t('settings.knowledgeBase.betaNotice.description')}
              </p>
              <p className="mt-2">
                {t('settings.knowledgeBase.betaNotice.feedback')}
              </p>
            </div>
          </div>
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
              {t('settings.knowledgeBase.noKnowledgeBases')}
            </div>
            <div className="mt-4">
              <Link
                to="/dashboard/knowledge-base/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="-ms-1 me-2 h-5 w-5" aria-hidden="true" />
                {t('settings.knowledgeBase.createButton')}
              </Link>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 ps-4 pe-3 text-start text-sm font-semibold text-gray-900 dark:text-gray-200 sm:ps-6"
                >
                  {t('settings.knowledgeBase.table.name')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  {t('settings.knowledgeBase.table.models')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  {t('settings.knowledgeBase.table.items')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  {t('settings.knowledgeBase.table.status')}
                </th>
                {settings?.is_enterprise_mode_active && (
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-gray-200"
                  >
                    {t('settings.knowledgeBase.table.costPerDocument')}
                  </th>
                )}
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  {t('settings.knowledgeBase.table.created')}
                </th>
                <th scope="col" className="relative py-3.5 ps-3 pe-4 sm:pe-6">
                  <span className="sr-only">{t('settings.knowledgeBase.table.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {knowledgeBases.map((kb) => (
                <tr key={kb.uuid}>
                  <td className="whitespace-nowrap py-4 ps-4 pe-3 text-sm font-medium text-gray-900 dark:text-gray-200 sm:ps-6">
                    <Link to={`/dashboard/knowledge-base/${kb.uuid}`} className="hover:text-primary-600">
                      {kb.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.knowledgeBase.table.embedding')}: <strong>{kb.embedding_model?.name || 'N/A'}</strong> <br />{t('settings.knowledgeBase.table.summarization')}: <strong>{kb.summarization_model?.name || 'N/A'}</strong>
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
                    {kb.created_at ? formatDistanceToNowLocalized(new Date(kb.created_at), dateLocale) : t('common.unknown')}
                  </td>
                  <td className="relative whitespace-nowrap py-4 ps-3 pe-4 text-end text-sm font-medium sm:pe-6">
                    <div className="flex items-center justify-end gap-x-4">
                      <Link to={`/dashboard/knowledge-base/${kb.uuid}`} className="text-gray-400 hover:text-primary-500" title={t('settings.knowledgeBase.table.viewChunks')}>
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
