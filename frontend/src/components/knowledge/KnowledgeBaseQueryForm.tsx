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
import { classNames } from '../../utils/classNames';
import { AxiosError } from 'axios';

interface IFormInput {
  query: string;
  top_k: number;
  search_type: "similarity" | "similarity_score_threshold" | "mmr";
}

interface KnowledgeBaseQueryFormProps {
  knowledgeBaseId: string;
}

const KnowledgeBaseQueryForm: React.FC<KnowledgeBaseQueryFormProps> = ({ knowledgeBaseId }) => {
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
    register('query', { required: 'Query cannot be empty' });
  }, [register]);

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
      toast.success('Query successful!');
    } catch (error) {
      if(error instanceof AxiosError){
        toast.error(error.response?.data?.message || 'Failed to execute query.');
      }else{
        toast.error('Failed to execute query.');
      }
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 items-start">
          <div className="w-full">
            <FormInput
              label=""
              value={query}
              onChange={setQuery}
              type="text"
              placeholder="Enter your query..."
              className="w-full text-lg"
            />
            {errors.query && <p className="mt-2 text-sm text-red-600">{errors.query.message}</p>}
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 hidden md:block">
              Enter your query to search the knowledge base for relevant results.
            </p>
          </div>
          <div className="w-full pt-1">
            <button
              type="submit"
              disabled={isQuerying}
              className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isQuerying ? 'Querying...' : 'Run Query'}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
          <TabList className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 min-w-max">
            <Tab className={({ selected }) => classNames('px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none', selected ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300')}>Options</Tab>
            <Tab className={({ selected }) => classNames('px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none', selected ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300')}>Results</Tab>
            <Tab className={({ selected }) => classNames('px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none', selected ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300')}>API</Tab>
          </TabList>
          <TabPanels className="mt-4">
            <TabPanel>
              <Card>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Options</h3>
                <div>
                  <label htmlFor="top_k" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Number of Results
                  </label>
                  <input
                    id="top_k"
                    type="number"
                    {...register('top_k', {
                      valueAsNumber: true,
                      required: 'Number of results is required',
                      min: { value: 1, message: 'Must be at least 1' },
                      max: { value: 50, message: 'Must be at most 50' },
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
                      Results ({results.length} {results.length === 1 ? 'chunk' : 'chunks'} found)
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
                      <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setViewMode('rendered')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'rendered'
                              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                        >
                          Rendered
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
                          JSON
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
                  <p className="text-gray-500 dark:text-gray-400">Run a query to see the results here.</p>
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
