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
  search_type: 'similarity' | 'similarity_score_threshold' | 'mmr';
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<IFormInput>({
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

  const onSubmit: SubmitHandler<IFormInput> = async data => {
    setQuery(data.query);
    setTopK(data.top_k);
    setResults(null);
    setIsQuerying(true);
    setSelectedTab(1); // Switch to results tab
    try {
      const response = await knowledgeBaseApi.query(knowledgeBaseId, {
        query: data.query,
        top_k: data.top_k,
      });
      setResults(response);
      toast.success(t('settings.knowledgeBase.query.success'));
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || t('settings.knowledgeBase.query.error'));
      } else {
        toast.error(t('settings.knowledgeBase.query.error'));
      }
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col items-start space-y-4 md:flex-row md:gap-x-4 md:space-y-0">
          <div className="w-full">
            <FormInput
              label=""
              value={query}
              onChange={setQuery}
              type="text"
              placeholder={t('settings.knowledgeBase.query.placeholder')}
              className="w-full text-lg"
            />
            {errors.query && <p className="mt-2 text-sm text-error">{errors.query.message}</p>}
            <p className="mt-1.5 hidden text-sm text-muted-foreground md:block">
              {t('settings.knowledgeBase.query.helpText')}
            </p>
          </div>
          <div className="w-full pt-1">
            <button
              type="submit"
              disabled={isQuerying}
              className="w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {isQuerying
                ? t('settings.knowledgeBase.query.querying')
                : t('settings.knowledgeBase.query.runButton')}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
          <TabList className="flex min-w-max gap-x-1 border-b border-border">
            <Tab
              className={({ selected }) =>
                classnames({
                  'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none': true,
                  'border-b-2 border-border text-foreground': selected,
                  'text-muted-foreground hover:text-foreground': !selected,
                })
              }
            >
              {t('settings.knowledgeBase.query.options.title')}
            </Tab>
            <Tab
              className={({ selected }) =>
                classnames({
                  'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none': true,
                  'border-b-2 border-border text-foreground': selected,
                  'text-muted-foreground hover:text-foreground': !selected,
                })
              }
            >
              {t('common.results')}
            </Tab>
            <Tab
              className={({ selected }) =>
                classnames({
                  'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none': true,
                  'border-b-2 border-border text-foreground': selected,
                  'text-muted-foreground hover:text-foreground': !selected,
                })
              }
            >
              API
            </Tab>
          </TabList>
          <TabPanels className="mt-4">
            <TabPanel>
              <Card>
                <h3 className="text-lg font-medium text-foreground">
                  {t('settings.knowledgeBase.query.options.title')}
                </h3>
                <div>
                  <label htmlFor="top_k" className="block text-sm font-medium text-foreground">
                    {t('settings.knowledgeBase.query.options.topK')}
                  </label>
                  <input
                    id="top_k"
                    type="number"
                    {...register('top_k', {
                      valueAsNumber: true,
                      required: t('settings.knowledgeBase.query.options.topKRequired'),
                      min: { value: 1, message: t('settings.knowledgeBase.query.options.topKMin') },
                      max: {
                        value: 50,
                        message: t('settings.knowledgeBase.query.options.topKMax'),
                      },
                    })}
                    className="mt-1 block w-full rounded-md border-input-border shadow-sm focus:border-primary focus:ring-primary sm:w-1/4 sm:text-sm"
                  />
                  {errors.top_k && (
                    <p className="mt-2 text-sm text-error">{errors.top_k.message}</p>
                  )}
                </div>
              </Card>
            </TabPanel>
            <TabPanel>
              {!isQuerying && results && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">
                      {t('settings.knowledgeBase.query.resultsCount', {
                        count: results.length,
                        unit:
                          results.length === 1
                            ? t('settings.knowledgeBase.query.chunk')
                            : t('settings.knowledgeBase.query.chunks'),
                      })}
                    </h3>
                    <div className="flex items-center gap-x-3">
                      <span className="text-sm text-muted-foreground">
                        {t('settings.knowledgeBase.query.viewLabel')}
                      </span>
                      <div className="flex items-center gap-x-1 rounded-lg bg-muted p-1">
                        <button
                          type="button"
                          onClick={() => setViewMode('rendered')}
                          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                            viewMode === 'rendered'
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {t('settings.knowledgeBase.query.rendered')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('json')}
                          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                            viewMode === 'json'
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
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
                    <div className="mt-2 overflow-hidden rounded-md border border-border">
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
                          theme: 'vs-dark',
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
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {t('settings.knowledgeBase.query.noResults')}
                  </p>
                </div>
              )}
            </TabPanel>
            <TabPanel>
              <KnowledgeBaseApiDocumentation
                knowledgeBaseId={knowledgeBaseId}
                query={query}
                top_k={topK}
              />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </form>
  );
};

export default KnowledgeBaseQueryForm;
