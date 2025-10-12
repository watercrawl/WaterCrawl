import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PaginatedResponse } from '../../types/common';
import { UsageHistory, ContentType } from '../../types/usage_history';
import { usageHistoryApi } from '../../services/api/usage_history';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import { useIsTabletOrMobile } from '../../hooks/useMediaQuery';
import { Pagination } from '../../components/shared/Pagination';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useDateLocale } from '../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';
import {
    DocumentTextIcon,
    MagnifyingGlassIcon,
    MapIcon,
    BookOpenIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import SpiderIcon from '../../components/icons/SpiderIcon';
import toast from 'react-hot-toast';
import { useSettings } from '../../contexts/SettingsProvider';

// Content type options for filtering - will use t() inside component
const CONTENT_TYPE_OPTIONS = [
    { value: '', key: 'usage.filters.allTypes' },
    { value: ContentType.CrawlRequest, key: 'crawl.title' },
    { value: ContentType.SitemapRequest, key: 'sitemap.title' },
    { value: ContentType.SearchRequest, key: 'search.title' },
    { value: ContentType.KnowledgeBaseDocument, key: 'knowledgeBase.document' },
];

const getContentTypeIcon = (contentType: ContentType) => {
    switch (contentType) {
        case ContentType.CrawlRequest:
            return <SpiderIcon className="h-4 w-4" />;
        case ContentType.SitemapRequest:
            return <MapIcon className="h-4 w-4" />;
        case ContentType.SearchRequest:
            return <MagnifyingGlassIcon className="h-4 w-4" />;
        case ContentType.KnowledgeBaseDocument:
            return <BookOpenIcon className="h-4 w-4" />;
        default:
            return <DocumentTextIcon className="h-4 w-4" />;
    }
};

const getContentTypeLabel = (contentType: ContentType, t: any) => {
    switch (contentType) {
        case ContentType.CrawlRequest:
            return t('crawl.title');
        case ContentType.SitemapRequest:
            return t('sitemap.title');
        case ContentType.SearchRequest:
            return t('search.title');
        case ContentType.KnowledgeBaseDocument:
            return t('knowledgeBase.document');
        default:
            return t('common.unknown');
    }
};

const isContentIdClickable = (contentType: ContentType) => {
    return [
        ContentType.CrawlRequest,
        ContentType.SitemapRequest,
        ContentType.SearchRequest
    ].includes(contentType);
};

interface UsageHistoryCardProps {
    usage: UsageHistory;
    onContentIdClick: (contentType: ContentType, contentId: string) => void;
}

const UsageHistoryCard: React.FC<UsageHistoryCardProps> = ({ usage, onContentIdClick }) => {
    const { t } = useTranslation();
    const dateLocale = useDateLocale();
    return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-x-3">
                <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                    {getContentTypeIcon(usage.content_type)}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getContentTypeLabel(usage.content_type, t)}
                    </p>
                    {isContentIdClickable(usage.content_type) ? (
                        <button
                            onClick={() => onContentIdClick(usage.content_type, usage.content_id)}
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                        >
                            {t('usage.contentId')}: {usage.content_id}
                        </button>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('usage.contentId')}: {usage.content_id}
                        </p>
                    )}
                </div>
            </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('usage.requestedCredits')}
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {usage.requested_page_credit}
                </p>
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('usage.usedCredits')}
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {usage.used_page_credit}
                </p>
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('apiKeys.title')}
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white truncate">
                    {usage.team_api_key?.name || t('usage.webInterface')}
                </p>
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('activityLogs.table.created')}
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDistanceToNowLocalized(new Date(usage.created_at), dateLocale)} {t('common.ago')}
                </p>
            </div>
        </div>
    </div>
    );
};

const UsageHistoryPage: React.FC = () => {
    const { t } = useTranslation();
    const dateLocale = useDateLocale();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [usageHistory, setUsageHistory] = useState<PaginatedResponse<UsageHistory> | null>(null);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedContentType, setSelectedContentType] = useState<string>('');
    const [selectedApiKey, setSelectedApiKey] = useState<string>('');
    const { setItems } = useBreadcrumbs();
    const { settings } = useSettings();

    const isTabletOrMobile = useIsTabletOrMobile();

    // Helper functions for navigation
    const getDetailPageUrl = (contentType: ContentType, contentId: string) => {
        switch (contentType) {
            case ContentType.CrawlRequest:
                return `/dashboard/logs/crawls/${contentId}`;
            case ContentType.SitemapRequest:
                return `/dashboard/logs/sitemaps/${contentId}`;
            case ContentType.SearchRequest:
                return `/dashboard/logs/searches/${contentId}`;
            default:
                return null;
        }
    };

    const handleContentIdClick = (contentType: ContentType, contentId: string) => {
        const url = getDetailPageUrl(contentType, contentId);
        if (url) {
            navigate(url);
        }
    };

    useEffect(() => {
        setItems([
            { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
            { label: t('usage.history'), href: '/dashboard/logs/usage', current: true },
        ]);
    }, [setItems, t]);

    // Initialize filters from URL params
    useEffect(() => {
        const contentTypeParam = searchParams.get('contentType') || '';
        const apiKeyParam = searchParams.get('apiKey') || '';
        setSelectedContentType(contentTypeParam);
        setSelectedApiKey(apiKeyParam);
    }, [searchParams]);

    // Fetch API keys for filter dropdown
    useEffect(() => {
        const fetchApiKeys = async () => {
            try {
                const data = await apiKeysApi.list(1);
                setApiKeys(data.results || []);
            } catch (error) {
                console.error('Failed to fetch API keys:', error);
            }
        };
        fetchApiKeys();
    }, []);

    const fetchUsageHistory = useCallback(async (
        page: number,
        contentType?: ContentType,
        apiKey?: string
    ) => {
        try {
            setLoading(true);
            const params: any = { page };
            if (contentType) params.contentType = contentType;
            if (apiKey) params.teamApiKey = apiKey;

            const data = await usageHistoryApi.list(
                page,
                20,
                apiKey,
                contentType
            );
            setUsageHistory(data);
        } catch (error) {
            console.error('Failed to fetch usage history:', error);
            toast.error(t('usage.fetchError'));
            setUsageHistory(null);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchUsageHistory(
            currentPage,
            selectedContentType as ContentType,
            selectedApiKey
        );
    }, [currentPage, selectedContentType, selectedApiKey, fetchUsageHistory, t]);

    // Update URL when content type filter changes
    const handleContentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newContentType = e.target.value;
        setSelectedContentType(newContentType);
        setCurrentPage(1);

        const newParams = new URLSearchParams(searchParams);
        if (newContentType) {
            newParams.set('contentType', newContentType);
        } else {
            newParams.delete('contentType');
        }
        setSearchParams(newParams);
    };

    // Update URL when API key filter changes
    const handleApiKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newApiKey = e.target.value;
        setSelectedApiKey(newApiKey);
        setCurrentPage(1);

        const newParams = new URLSearchParams(searchParams);
        if (newApiKey) {
            newParams.set('apiKey', newApiKey);
        } else {
            newParams.delete('apiKey');
        }
        setSearchParams(newParams);
    };

    if (loading && !usageHistory) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    const hasNoData = !usageHistory || usageHistory.count === 0;

    return (
        <div className="h-full">
            <div className="px-4 sm:px-8 py-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('usage.history')}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('usage.subtitle')}
                </p>

                <div className="mt-8">
                    {/* Filters */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Content Type Filter */}
                        <div>
                            <label htmlFor="content-type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('usage.filters.contentType')}
                            </label>
                            <select
                                id="content-type-filter"
                                value={selectedContentType}
                                onChange={handleContentTypeChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                {CONTENT_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {t(option.key)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* API Key Filter */}
                        <div>
                            <label htmlFor="api-key-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('usage.filters.apiKey')}
                            </label>
                            <select
                                id="api-key-filter"
                                value={selectedApiKey}
                                onChange={handleApiKeyChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="">{t('usage.filters.allApiKeys')}</option>
                                {apiKeys.map((apiKey) => (
                                    <option key={apiKey.uuid} value={apiKey.uuid}>
                                        {apiKey.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {hasNoData ? (
                        <div className="text-center py-12">
                            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('usage.noHistory')}</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {selectedContentType || selectedApiKey
                                    ? t('usage.noResultsFiltered')
                                    : t('usage.getStarted')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {loading && (
                                <div className="flex items-center justify-center gap-x-2 text-gray-600 dark:text-gray-300 mb-4">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                                    <span className="text-xs text-gray-600 dark:text-gray-300">{t('common.loading')}</span>
                                </div>
                            )}

                            {/* Mobile and Tablet Card View */}
                            {isTabletOrMobile ? (
                                <div className={loading ? "opacity-70 pointer-events-none transition-opacity" : ""}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {usageHistory?.results.map((usage) => (
                                            <UsageHistoryCard key={usage.uuid} usage={usage} onContentIdClick={handleContentIdClick} />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Desktop Table View */
                                <div className={loading ? "opacity-70 pointer-events-none transition-opacity" : ""}>
                                    <div className="mt-8 flex flex-col">
                                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                            <div className="inline-block min-w-full py-2 align-middle px-4 sm:px-6 lg:px-8">
                                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 rounded-lg">
                                                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                                            <tr>
                                                                <th scope="col" className="py-3.5 ps-4 pe-3 text-start text-sm font-semibold text-gray-900 dark:text-white sm:ps-6">
                                                                    {t('usage.contentType')}
                                                                </th>
                                                                <th scope="col" className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-white">
                                                                    {t('usage.contentId')}
                                                                </th>
                                                                {settings?.is_enterprise_mode_active && (
                                                                    <>
                                                                        <th scope="col" className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-white">
                                                                            {t('usage.requestedCredits')}
                                                                        </th>
                                                                        <th scope="col" className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-white">
                                                                            {t('usage.usedCredits')}
                                                                        </th>
                                                                    </>
                                                                )}
                                                                <th scope="col" className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-white">
                                                                    {t('apiKeys.title')}
                                                                </th>
                                                                <th scope="col" className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-white">
                                                                    {t('usage.requestedAt')}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                                            {usageHistory?.results.map((usage) => (
                                                                <tr key={usage.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                                                                    <td className="whitespace-nowrap py-4 ps-4 pe-3 text-sm font-medium text-gray-900 dark:text-white sm:ps-6">
                                                                        <div className="flex items-center gap-x-2">
                                                                            <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                                                                                {getContentTypeIcon(usage.content_type)}
                                                                            </div>
                                                                            <span>{getContentTypeLabel(usage.content_type, t)}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                        <div className="flex items-center gap-x-2">
                                                                            {isContentIdClickable(usage.content_type) && (
                                                                                <Link
                                                                                    to={getDetailPageUrl(usage.content_type, usage.content_id) || '#'}
                                                                                    className="max-w-[200px] truncate block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer text-start"
                                                                                    title={usage.content_id}
                                                                                >
                                                                                    <EyeIcon className="h-4 w-4" />
                                                                                </Link>
                                                                            )}
                                                                            <span className="max-w-[200px] truncate block" title={usage.content_id}>
                                                                                {usage.content_id}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    {settings?.is_enterprise_mode_active && (
                                                                        <>
                                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                                                                                {usage.requested_page_credit}
                                                                            </td>
                                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                                                                                {usage.used_page_credit}
                                                                            </td>
                                                                        </>
                                                                    )}

                                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                        {usage.team_api_key?.name || t('usage.webInterface')}
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                        {formatDistanceToNowLocalized(new Date(usage.created_at), dateLocale)} {t('common.ago')}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Pagination */}
                            {usageHistory && usageHistory.count > 20 && (
                                <div className="mt-6">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalItems={usageHistory.count}
                                        itemsPerPage={20}
                                        hasNextPage={usageHistory.next !== null}
                                        hasPreviousPage={usageHistory.previous !== null}
                                        onPageChange={setCurrentPage}
                                        loading={loading}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsageHistoryPage;
