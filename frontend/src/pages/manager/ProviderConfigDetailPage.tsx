import React, { useEffect, useState, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { ArrowPathIcon } from '@heroicons/react/24/outline';

import Loading from '../../components/shared/Loading';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { adminProviderApi } from '../../services/api/admin/provider';
import {
  AdminProviderConfig,
  AdminLLMModel,
  AdminEmbeddingModel,
  VisibilityLevel,
  AdminLLMModelRequest,
  AdminEmbeddingModelRequest,
} from '../../types/admin/provider';


const ProviderConfigDetailPage: React.FC = () => {
  const { t } = useTranslation();
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
      { label: t('dashboard.navigation.adminPanel'), href: '/manager' },
      { label: t('admin.llm.title'), href: '/manager/llm-providers' },
      {
        label: t('providerConfig.details'),
        href: `/manager/llm-providers/${providerConfigId}`,
        current: true,
      },
    ]);
  }, [setItems, providerConfigId, t]);

  const fetchProviderData = useCallback(async () => {
    if (!providerConfigId) return;
    setLoading(true);
    setError(null);
    try {
      const config = await adminProviderApi.providerConfiguration.get(providerConfigId);
      setProviderConfig(config);

      const [llmResponse, embeddingResponse] = await Promise.all([
        adminProviderApi.llmModel.list(1, 100, config.provider_name), // Assuming max 100 models for now
        adminProviderApi.embeddingModel.list(1, 100, config.provider_name), // Assuming max 100 models for now
      ]);

      setLlmModels(llmResponse.results);
      setEmbeddingModels(embeddingResponse.results);
    } catch (_err) {
      setError(t('providerConfig.toast.loadError'));
      toast.error(t('providerConfig.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [providerConfigId, t]);

  useEffect(() => {
    fetchProviderData();
  }, [fetchProviderData]);

  const handleSyncLLMs = async () => {
    if (!providerConfigId) return;
    setIsSyncingLLMs(true);
    toast.loading(t('admin.llm.syncing'));
    try {
      await adminProviderApi.providerConfiguration.sync_llm_models(providerConfigId);
      toast.dismiss();
      toast.success(t('admin.llm.syncSuccess'));
      await fetchProviderData(); // Refresh data
    } catch (_err) {
      toast.dismiss();
      toast.error(t('admin.llm.syncError'));
    } finally {
      setIsSyncingLLMs(false);
    }
  };

  const handleSyncEmbeddings = async () => {
    if (!providerConfigId) return;
    setIsSyncingEmbeddings(true);
    toast.loading(t('admin.llm.syncing'));
    try {
      await adminProviderApi.providerConfiguration.sync_provider_embeddings(providerConfigId);
      toast.dismiss();
      toast.success(t('admin.llm.syncSuccess'));
      await fetchProviderData(); // Refresh data
    } catch (_err) {
      toast.dismiss();
      toast.error(t('admin.llm.syncError'));
    } finally {
      setIsSyncingEmbeddings(false);
    }
  };

  const handleLLMVisibilityChange = async (uuid: string, visibility: VisibilityLevel) => {
    const originalModels = [...llmModels];
    const updatedModels = llmModels.map(m =>
      m.uuid === uuid ? { ...m, visibility_level: visibility } : m
    );
    setLlmModels(updatedModels);

    try {
      const modelToUpdate = originalModels.find(m => m.uuid === uuid);
      if (modelToUpdate) {
        const requestData: AdminLLMModelRequest = {
          name: modelToUpdate.name,
          key: modelToUpdate.key,
          visibility_level: visibility,
          provider_name: modelToUpdate.provider_name,
        };
        await adminProviderApi.llmModel.update(uuid, requestData);
        toast.success(t('admin.llm.visibilityUpdated'));
      }
    } catch (_err) {
      setLlmModels(originalModels);
      toast.error(t('admin.llm.updateError'));
    }
  };

  const handleEmbeddingVisibilityChange = async (uuid: string, visibility: VisibilityLevel) => {
    const originalModels = [...embeddingModels];
    const updatedModels = embeddingModels.map(m =>
      m.uuid === uuid ? { ...m, visibility_level: visibility } : m
    );
    setEmbeddingModels(updatedModels);

    try {
      const modelToUpdate = originalModels.find(m => m.uuid === uuid);
      if (modelToUpdate) {
        const requestData: AdminEmbeddingModelRequest = {
          name: modelToUpdate.name,
          key: modelToUpdate.key,
          description: modelToUpdate.description,
          dimensions: modelToUpdate.dimensions,
          max_input_length: modelToUpdate.max_input_length,
          truncate: modelToUpdate.truncate,
          visibility_level: visibility,
          provider_name: modelToUpdate.provider_name,
        };
        await adminProviderApi.embeddingModel.update(uuid, requestData);
        toast.success(t('admin.llm.visibilityUpdated'));
      }
    } catch (_err) {
      setEmbeddingModels(originalModels);
      toast.error(t('admin.llm.updateError'));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <div className="mt-8 text-center text-error">{error}</div>;
  }

  if (!providerConfig) {
    return <div className="mt-8 text-center">{t('errors.notFound')}</div>;
  }

  return (
    <div className="mt-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{providerConfig.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t('providerConfig.provider')}: {providerConfig.provider_name}
        </p>
      </div>

      <div className="flex gap-x-4">
        <button
          onClick={handleSyncLLMs}
          disabled={isSyncingLLMs || isSyncingEmbeddings}
          className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
        >
          <ArrowPathIcon className={`-ms-1 me-2 h-5 w-5 ${isSyncingLLMs ? 'animate-spin' : ''}`} />
          {isSyncingLLMs ? t('admin.llm.syncing') : t('admin.llm.syncModels')}
        </button>
        <button
          onClick={handleSyncEmbeddings}
          disabled={isSyncingLLMs || isSyncingEmbeddings}
          className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`-ms-1 me-2 h-5 w-5 ${isSyncingEmbeddings ? 'animate-spin' : ''}`}
          />
          {isSyncingEmbeddings ? t('admin.llm.syncing') : t('admin.llm.syncEmbeddings')}
        </button>
      </div>

      {/* LLM Models Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{t('admin.llm.models')}</h2>
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pe-3 ps-4 text-start text-sm font-semibold text-foreground sm:ps-6"
                >
                  {t('providerConfig.modelName')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                >
                  {t('providerConfig.visibility.label')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {llmModels.map(model => (
                <tr key={model.uuid}>
                  <td className="whitespace-nowrap py-4 pe-3 ps-4 text-sm font-medium text-foreground sm:ps-6">
                    {model.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    <select
                      value={model.visibility_level}
                      onChange={e =>
                        handleLLMVisibilityChange(model.uuid, e.target.value as VisibilityLevel)
                      }
                      className="block w-full rounded-md border border-input-border bg-input py-2 pe-10 ps-3 text-base text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    >
                      <option value={VisibilityLevel.AVAILABLE}>
                        {t('providerConfig.visibility.available')}
                      </option>
                      <option value={VisibilityLevel.NOT_AVAILABLE}>
                        {t('providerConfig.visibility.notAvailable')}
                      </option>
                      <option value={VisibilityLevel.TEAM_ONLY}>
                        {t('providerConfig.visibility.teamOnly')}
                      </option>
                      <option value={VisibilityLevel.PREMIUM}>
                        {t('providerConfig.visibility.premium')}
                      </option>
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
        <h2 className="text-xl font-semibold text-foreground">{t('admin.llm.embeddingModels')}</h2>
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pe-3 ps-4 text-start text-sm font-semibold text-foreground sm:ps-6"
                >
                  {t('providerConfig.modelName')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                >
                  {t('providerConfig.visibility.label')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {embeddingModels.map(model => (
                <tr key={model.uuid}>
                  <td className="whitespace-nowrap py-4 pe-3 ps-4 text-sm font-medium text-foreground sm:ps-6">
                    {model.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    <select
                      value={model.visibility_level}
                      onChange={e =>
                        handleEmbeddingVisibilityChange(
                          model.uuid,
                          e.target.value as VisibilityLevel
                        )
                      }
                      className="block w-full rounded-md border border-input-border bg-input py-2 pe-10 ps-3 text-base text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    >
                      <option value={VisibilityLevel.AVAILABLE}>
                        {t('providerConfig.visibility.available')}
                      </option>
                      <option value={VisibilityLevel.NOT_AVAILABLE}>
                        {t('providerConfig.visibility.notAvailable')}
                      </option>
                      <option value={VisibilityLevel.TEAM_ONLY}>
                        {t('providerConfig.visibility.teamOnly')}
                      </option>
                      <option value={VisibilityLevel.PREMIUM}>
                        {t('providerConfig.visibility.premium')}
                      </option>
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
