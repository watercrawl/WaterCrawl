import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoryData {
  date: string;
  count: number;
}

interface UsageChartsProps {
  crawlHistory: HistoryData[];
  documentHistory: HistoryData[];
}

const UsageCharts: React.FC<UsageChartsProps> = ({ crawlHistory, documentHistory }) => {
  const chartTooltipStyle = {
    contentStyle: {
      backgroundColor: 'rgb(31 41 55)',
      border: 'none',
      borderRadius: '0.5rem',
      color: 'white'
    },
    labelStyle: { color: 'rgb(156 163 175)' }
  };

  const dateFormatter = (value: string) => 
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Crawls Chart */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Crawl Requests History</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Number of crawl requests over time</p>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={crawlHistory}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCrawls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-gray-600 dark:text-gray-400"
                tickFormatter={dateFormatter}
              />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={chartTooltipStyle.contentStyle}
                labelStyle={chartTooltipStyle.labelStyle}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCrawls)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Documents Chart */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Results History</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Number of results over time</p>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={documentHistory}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-gray-600 dark:text-gray-400"
                tickFormatter={dateFormatter}
              />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={chartTooltipStyle.contentStyle}
                labelStyle={chartTooltipStyle.labelStyle}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDocs)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default UsageCharts;
