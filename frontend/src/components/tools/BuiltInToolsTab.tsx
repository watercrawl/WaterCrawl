import { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { SparklesIcon } from '@heroicons/react/24/outline';

import Loading from '../shared/Loading';

import { toolsApi } from '../../services/api/tools';

import ToolCard from './ToolCard';


import type { ToolListItem } from '../../types/tools';

const BuiltInToolsTab: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<ToolListItem[]>([]);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const response = await toolsApi.listTools();
      setTools(response.results || []);
    } catch (error: unknown) {
      console.error('Error fetching built-in tools:', error);
      toast.error(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  if (loading) {
    return <Loading />;
  }

  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
          <SparklesIcon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{t('tools.noBuiltInTools')}</h3>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
          {t('tools.noBuiltInToolsDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tools.map(tool => (
        <ToolCard key={tool.uuid} tool={tool} />
      ))}
    </div>
  );
};

export default BuiltInToolsTab;
