import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { usageApi } from '../../services/api/usage';
import { UsageResponse } from '../../types/common';
import { useTranslation } from 'react-i18next';

const DashboardStats: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await usageApi.getUsageStats();
        setData(response);
      } catch (error) {
        console.error('Error fetching usage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-border"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-muted-foreground">{t('usage.errors.loadFailed')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('usage.stats.totalCrawlRequests')}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {data.total_crawls?.toLocaleString()}
              </p>
            </div>
            <div className="text-muted-foreground">
              <ArrowTrendingUpIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('usage.stats.totalResults')}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {data.total_documents?.toLocaleString()}
              </p>
            </div>
            <div className="text-muted-foreground">
              <ArrowTrendingUpIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* API Usage Chart */}
      <div className="rounded-lg border border-border p-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t('usage.crawlRequests')}</h2>
            <p className="text-sm text-muted-foreground">{t('usage.allTime')}</p>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.crawl_history}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis
                dataKey="date"
                className="text-muted-foreground"
                tickFormatter={value =>
                  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
              />
              <YAxis className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                }}
                labelStyle={{ color: 'rgb(156 163 175)' }}
                formatter={(value: number) => [value.toLocaleString(), t('common.crawls')]}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Crawls"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCalls)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
