import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { knowledgeBaseApi } from '../../services/api/knowledgeBase';
import { KnowledgeBaseApiDocumentation } from './KnowledgeBaseApiDocumentation';
import { KnowledgeBaseQueryResult } from './KnowledgeBaseQueryResult';
import Loading from '../shared/Loading';
import { FormInput } from '../shared/FormComponents';
import Card from '../shared/Card';
import Editor from '@monaco-editor/react';
import { AxiosError } from 'axios';
import { classnames } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

interface IFormInput {
  query: string;
  top_k: number;
  search_type: "similarity" | "similarity_score_threshold" | "mmr";
}

interface KnowledgeBaseQueryFormProps {
  knowledgeBaseId: string;
}

const KnowledgeBaseQueryForm: React.FC<KnowledgeBaseQueryFormProps> = ({ knowledgeBaseId }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(3);
  const [results, setResults] = useState<any | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewMode, setViewMode] = useState<'rendered' | 'json'>('rendered');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<IFormInput>({
    defaultValues: {
      query: '',
      top_k: 3,
    },
  });

  useEffect(() => {
    register('query', { required: t('settings.knowledgeBase.query.error') });
  }, [register, t]);

  useEffect(() => {
    setValue('query', query);
  }, [query, setValue]);

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    setQuery(data.query);
    setTopK(data.top_k);
    setResults(null);
    setIsQuerying(true);
    setSelectedTab(1); // Switch to results tab
    try {
      const response = await knowledgeBaseApi.query(knowledgeBaseId, { query: data.query, top_k: data.top_k });
      setResults(response);
      toast.success(t('settings.knowledgeBase.query.success'));
    } catch (error) {
      if(error instanceof AxiosError){
        toast.error(error.response?.data?.message || t('settings.knowledgeBase.query.error'));
      }else{
        toast.error(t('settings.knowledgeBase.query.error'));
      }
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row md:gap-x-4 space-y-4 md:space-y-0 items-start">
          <div className="w-full">
            <FormInput
              label=""
              value={query}
              onChange={setQuery}
              type="text"
              placeholder={t('settings.knowledgeBase.query.placeholder')}
              className="w-full text-lg"
            />
            {errors.query && <p className="mt-2 text-sm text-red-600">{errors.query.message}</p>}
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 hidden md:block">
              {t('settings.knowledgeBase.query.helpText')}
            </p>
          </div>
          <div className="w-full pt-1">
            <button
              type="submit"
              disabled={isQuerying}
              className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isQuerying ? t('settings.knowledgeBase.query.querying') : t('settings.knowledgeBase.query.runButton')}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
          <TabList className="flex gap-x-1 border-b border-gray-200 dark:border-gray-700 min-w-max">
            <Tab className={({ selected }) => classnames({
              'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none': true,
              'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white': selected,
              'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': !selected
            })}>{t('settings.knowledgeBase.query.options.title')}</Tab>
            <Tab className={({ selected }) => classnames({
              'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none': true,
              'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white': selected,
              'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': !selected
            })}>{t('common.results')}</Tab>
            <Tab className={({ selected }) => classnames({
              'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none': true,
              'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white': selected,
              'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': !selected
            })}>API</Tab>
          </TabList>
          <TabPanels className="mt-4">
            <TabPanel>
              <Card>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.knowledgeBase.query.options.title')}</h3>
                <div>
                  <label htmlFor="top_k" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settings.knowledgeBase.query.options.topK')}
                  </label>
                  <input
                    id="top_k"
                    type="number"
                    {...register('top_k', {
                      valueAsNumber: true,
                      required: t('settings.knowledgeBase.query.options.topKRequired'),
                      min: { value: 1, message: t('settings.knowledgeBase.query.options.topKMin') },
                      max: { value: 50, message: t('settings.knowledgeBase.query.options.topKMax') },
                    })}
                    className="mt-1 block w-full sm:w-1/4 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  />
                  {errors.top_k && <p className="mt-2 text-sm text-red-600">{errors.top_k.message}</p>}
                </div>
              </Card>

            </TabPanel>
            <TabPanel>
              {!isQuerying && results && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t('settings.knowledgeBase.query.resultsCount', { 
                        count: results.length, 
                        unit: results.length === 1 ? t('settings.knowledgeBase.query.chunk') : t('settings.knowledgeBase.query.chunks')
                      })}
                    </h3>
                    <div className="flex items-center gap-x-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.knowledgeBase.query.viewLabel')}</span>
                      <div className="flex items-center gap-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setViewMode('rendered')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'rendered'
                              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                        >
                          {t('settings.knowledgeBase.query.rendered')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('json')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'json'
                              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                        >
                          {t('settings.knowledgeBase.query.json')}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {viewMode === 'rendered' ? (
                    <div className="space-y-4">
                      {results.map((result: any, index: number) => (
                        <KnowledgeBaseQueryResult
                          key={`${result.metadata.uuid}-${index}`}
                          result={result}
                          showDocumentLink={true}
                          showSource={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                      <Editor
                        height="500px"
                        defaultLanguage="json"
                        value={JSON.stringify(results, null, 2)}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                          fontSize: 13,
                          lineNumbers: 'on',
                          folding: true,
                          foldingHighlight: true,
                          automaticLayout: true,
                          theme: 'vs-dark'
                        }}
                        theme="vs-dark"
                      />
                    </div>
                  )}
                </div>
              )}
              {isQuerying && (
                <div className="p-6 text-center">
                  <Loading size="lg" />
                </div>
              )}
              {!isQuerying && !results && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">{t('settings.knowledgeBase.query.noResults')}</p>
                </div>
              )}
            </TabPanel>
            <TabPanel>
              <KnowledgeBaseApiDocumentation knowledgeBaseId={knowledgeBaseId} query={query} top_k={topK} />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </form>
  );
};

export default KnowledgeBaseQueryForm;
