import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminProviderApi } from '../../services/api/admin/provider';
import { AdminProviderConfig, AdminLLMModel, AdminEmbeddingModel, VisibilityLevel, AdminLLMModelRequest, AdminEmbeddingModelRequest } from '../../types/admin/provider';
import Loading from '../../components/shared/Loading';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

const ProviderConfigDetailPage: React.FC = () => {
  const { providerConfigId } = useParams<{ providerConfigId: string }>();
  const [providerConfig, setProviderConfig] = useState<AdminProviderConfig | null>(null);
  const [llmModels, setLlmModels] = useState<AdminLLMModel[]>([]);
  const [embeddingModels, setEmbeddingModels] = useState<AdminEmbeddingModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncingLLMs, setIsSyncingLLMs] = useState<boolean>(false);
  const [isSyncingEmbeddings, setIsSyncingEmbeddings] = useState<boolean>(false);
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: 'Admin', href: '/admin' },
      { label: 'Manage LLM Providers', href: '/admin/llm-providers' },
      { label: 'Provider Config Detail', href: `/admin/llm-providers/${providerConfigId}`, current: true },
    ]);
  }, [setItems, providerConfigId]);

  const fetchProviderData = useCallback(async () => {
    if (!providerConfigId) return;
    setLoading(true);
    setError(null);
    try {
      const config = await adminProviderApi.providerConfiguration.get(providerConfigId);
      setProviderConfig(config);

      const [llmResponse, embeddingResponse] = await Promise.all([
        adminProviderApi.llmModel.list(1, 100, config.provider_name), // Assuming max 100 models for now
        adminProviderApi.embeddingModel.list(1, 100, config.provider_name) // Assuming max 100 models for now
      ]);

      setLlmModels(llmResponse.results);
      setEmbeddingModels(embeddingResponse.results);

    } catch (_err) {
      setError('Failed to fetch provider details.');
      toast.error('Failed to fetch provider details.');
    } finally {
      setLoading(false);
    }
  }, [providerConfigId]);

  useEffect(() => {
    fetchProviderData();
  }, [fetchProviderData]);

  const handleSyncLLMs = async () => {
    if (!providerConfigId) return;
    setIsSyncingLLMs(true);
    toast.loading('Syncing LLM models...');
    try {
      await adminProviderApi.providerConfiguration.sync_llm_models(providerConfigId);
      toast.dismiss();
      toast.success('LLM models synced successfully.');
      await fetchProviderData(); // Refresh data
    } catch (_err) {
      toast.dismiss();
      toast.error('Failed to sync LLM models.');
    } finally {
      setIsSyncingLLMs(false);
    }
  };

  const handleSyncEmbeddings = async () => {
    if (!providerConfigId) return;
    setIsSyncingEmbeddings(true);
    toast.loading('Syncing embedding models...');
    try {
      await adminProviderApi.providerConfiguration.sync_provider_embeddings(providerConfigId);
      toast.dismiss();
      toast.success('Embedding models synced successfully.');
      await fetchProviderData(); // Refresh data
    } catch (_err) {
      toast.dismiss();
      toast.error('Failed to sync embedding models.');
    } finally {
      setIsSyncingEmbeddings(false);
    }
  };

  const handleLLMVisibilityChange = async (uuid: string, visibility: VisibilityLevel) => {
    const originalModels = [...llmModels];
    const updatedModels = llmModels.map(m => m.uuid === uuid ? { ...m, visibility_level: visibility } : m);
    setLlmModels(updatedModels);

    try {
      const modelToUpdate = originalModels.find(m => m.uuid === uuid);
      if (modelToUpdate) {
        const requestData: AdminLLMModelRequest = {
            name: modelToUpdate.name,
            key: modelToUpdate.key,
            visibility_level: visibility,
            provider_name: modelToUpdate.provider_name
        };
        await adminProviderApi.llmModel.update(uuid, requestData);
        toast.success('LLM model visibility updated.');
      }
    } catch (_err) {
      setLlmModels(originalModels);
      toast.error('Failed to update LLM model visibility.');
    }
  };

  const handleEmbeddingVisibilityChange = async (uuid: string, visibility: VisibilityLevel) => {
    const originalModels = [...embeddingModels];
    const updatedModels = embeddingModels.map(m => m.uuid === uuid ? { ...m, visibility_level: visibility } : m);
    setEmbeddingModels(updatedModels);

    try {
        const modelToUpdate = originalModels.find(m => m.uuid === uuid);
        if(modelToUpdate) {
            const requestData: AdminEmbeddingModelRequest = {
                name: modelToUpdate.name,
                key: modelToUpdate.key,
                description: modelToUpdate.description,
                dimensions: modelToUpdate.dimensions,
                max_input_length: modelToUpdate.max_input_length,
                truncate: modelToUpdate.truncate,
                visibility_level: visibility,
                provider_name: modelToUpdate.provider_name
            };
            await adminProviderApi.embeddingModel.update(uuid, requestData);
            toast.success('Embedding model visibility updated.');
        }
    } catch (_err) {
      setEmbeddingModels(originalModels);
      toast.error('Failed to update embedding model visibility.');
    }
  };


  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loading /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-8">{error}</div>;
  }

  if (!providerConfig) {
    return <div className="text-center mt-8">Provider configuration not found.</div>;
  }

  return (
    <div className="space-y-8 mt-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{providerConfig.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Provider: {providerConfig.provider_name}</p>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleSyncLLMs}
          disabled={isSyncingLLMs || isSyncingEmbeddings}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${isSyncingLLMs ? 'animate-spin' : ''}`} />
          {isSyncingLLMs ? 'Syncing...' : 'Sync LLM Models'}
        </button>
        <button
          onClick={handleSyncEmbeddings}
          disabled={isSyncingLLMs || isSyncingEmbeddings}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${isSyncingEmbeddings ? 'animate-spin' : ''}`} />
          {isSyncingEmbeddings ? 'Syncing...' : 'Sync Embeddings'}
        </button>
      </div>

      {/* LLM Models Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">LLM Models</h2>
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Model Name</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {llmModels.map((model) => (
                <tr key={model.uuid}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{model.name}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                    <select
                      value={model.visibility_level}
                      onChange={(e) => handleLLMVisibilityChange(model.uuid, e.target.value as VisibilityLevel)}
                      className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value={VisibilityLevel.AVAILABLE}>Available</option>
                      <option value={VisibilityLevel.NOT_AVAILABLE}>Not Available</option>
                      <option value={VisibilityLevel.TEAM_ONLY}>Team Only</option>
                      <option value={VisibilityLevel.PREMIUM}>Premium</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedding Models Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Embedding Models</h2>
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Model Name</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {embeddingModels.map((model) => (
                <tr key={model.uuid}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{model.name}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                    <select
                      value={model.visibility_level}
                      onChange={(e) => handleEmbeddingVisibilityChange(model.uuid, e.target.value as VisibilityLevel)}
                      className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value={VisibilityLevel.AVAILABLE}>Available</option>
                      <option value={VisibilityLevel.NOT_AVAILABLE}>Not Available</option>
                      <option value={VisibilityLevel.TEAM_ONLY}>Team Only</option>
                      <option value={VisibilityLevel.PREMIUM}>Premium</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProviderConfigDetailPage;
