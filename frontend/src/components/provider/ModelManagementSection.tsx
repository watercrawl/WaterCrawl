import React, { useState, useCallback, useEffect } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { PencilIcon, PlusIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

import Loading from '../shared/Loading';

import { useDirection } from '../../contexts/DirectionContext';
import { adminProviderApi } from '../../services/api/admin/provider';
import { providerApi } from '../../services/api/provider';
import {
  ModelType,
  ProviderConfigDetail,
  ProviderModel,
  ProviderConfigModel,
  CreateCustomModelRequest,
} from '../../types/provider';
import { customModelToYaml } from '../../utils/modelYamlConverter';

import CustomModelModal from './CustomModelModal';

interface ModelManagementSectionProps {
  providerConfigId: string;
  providerConfigDetail: ProviderConfigDetail | null;
  onRefresh: () => void;
  loading?: boolean;
  isAdmin?: boolean;
}

const ModelManagementSection: React.FC<ModelManagementSectionProps> = ({
  providerConfigId,
  providerConfigDetail,
  onRefresh,
  loading = false,
  isAdmin = false,
}) => {
  const { t } = useTranslation();
  const { direction } = useDirection();
  const [localProviderConfigDetail, setLocalProviderConfigDetail] = useState<ProviderConfigDetail | null>(
    providerConfigDetail
  );
  const [updatingModels, setUpdatingModels] = useState<Set<string>>(new Set());
  const [showCustomModelModal, setShowCustomModelModal] = useState(false);
  const [editingCustomModel, setEditingCustomModel] = useState<ProviderConfigModel | null>(null);

  // Sync local state when prop changes
  useEffect(() => {
    if (providerConfigDetail) {
      setLocalProviderConfigDetail(providerConfigDetail);
    }
  }, [providerConfigDetail]);

  const handleToggleModelStatus = useCallback(
    async (modelKey: string, modelType: ModelType, currentStatus: boolean) => {
      const key = `${modelType}-${modelKey}`;
      setUpdatingModels(prev => new Set(prev).add(key));

      const newStatus = !currentStatus;

      // Optimistically update local state
      setLocalProviderConfigDetail(prev => {
        if (!prev) return prev;

        const updateModelStatus = (models: ProviderModel[]) =>
          models.map(model =>
            model.key === modelKey ? { ...model, is_active: newStatus } : model
          );

        const updateCustomModelStatus = (models: ProviderConfigModel[]) =>
          models.map(model =>
            model.model_key === modelKey && model.model_type === modelType
              ? { ...model, is_active: newStatus }
              : model
          );

        return {
          ...prev,
          llm_models: modelType === 'llm' ? updateModelStatus(prev.llm_models) : prev.llm_models,
          embedding_models:
            modelType === 'embedding'
              ? updateModelStatus(prev.embedding_models)
              : prev.embedding_models,
          reranker_models:
            modelType === 'reranker'
              ? updateModelStatus(prev.reranker_models)
              : prev.reranker_models,
          custom_models: updateCustomModelStatus(prev.custom_models),
        };
      });

      const statusData = {
        model_key: modelKey,
        model_type: modelType,
        is_active: newStatus,
      };

      try {
        if (isAdmin) {
          await adminProviderApi.providerConfigModels.setStatus(providerConfigId, statusData);
        } else {
          await providerApi.setModelStatus(providerConfigId, statusData);
        }
        toast.success(
          newStatus
            ? t('providerConfig.models.activated')
            : t('providerConfig.models.deactivated')
        );
        // Refresh in the background without showing loading
        onRefresh();
      } catch (error: unknown) {
        console.error('Error toggling model status:', error);
        // Revert optimistic update on error
        setLocalProviderConfigDetail(providerConfigDetail);
        toast.error(t('errors.generic'));
      } finally {
        setUpdatingModels(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [providerConfigId, onRefresh, t, isAdmin, providerConfigDetail]
  );

  const handleCreateCustomModel = useCallback(
    async (data: CreateCustomModelRequest) => {
      try {
        if (isAdmin) {
          await adminProviderApi.providerConfigModels.create(providerConfigId, data);
        } else {
          await providerApi.createCustomModel(providerConfigId, data);
        }
        toast.success(t('providerConfig.models.customCreated'));
        setShowCustomModelModal(false);
        onRefresh();
      } catch (error: unknown) {
        console.error('Error creating custom model:', error);
        toast.error(t('errors.generic'));
      }
    },
    [providerConfigId, onRefresh, t, isAdmin]
  );

  const handleUpdateCustomModel = useCallback(
    async (modelUuid: string, data: Partial<CreateCustomModelRequest>) => {
      try {
        if (isAdmin) {
          await adminProviderApi.providerConfigModels.update(providerConfigId, modelUuid, data);
        } else {
          await providerApi.updateCustomModel(providerConfigId, modelUuid, data);
        }
        toast.success(t('providerConfig.models.customUpdated'));
        setEditingCustomModel(null);
        onRefresh();
      } catch (error: unknown) {
        console.error('Error updating custom model:', error);
        toast.error(t('errors.generic'));
      }
    },
    [providerConfigId, onRefresh, t, isAdmin]
  );

  const handleDeleteCustomModel = useCallback(
    async (modelUuid: string) => {
      if (!confirm(t('providerConfig.models.confirmDelete'))) return;

      try {
        if (isAdmin) {
          await adminProviderApi.providerConfigModels.delete(providerConfigId, modelUuid);
        } else {
          await providerApi.deleteCustomModel(providerConfigId, modelUuid);
        }
        toast.success(t('providerConfig.models.customDeleted'));
        onRefresh();
      } catch (error: unknown) {
        console.error('Error deleting custom model:', error);
        toast.error(t('errors.generic'));
      }
    },
    [providerConfigId, onRefresh, t, isAdmin]
  );

  const renderModelTable = (
    title: string,
    models: ProviderModel[] | undefined,
    modelType: ModelType
  ) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {!models || models.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('providerConfig.models.noModels')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-start text-sm font-semibold text-foreground">
                  {t('providerConfig.models.modelName')}
                </th>
                <th className="px-4 py-3 text-start text-sm font-semibold text-foreground">
                  {t('providerConfig.models.type')}
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                  {t('providerConfig.models.status')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {models.map(model => {
                const key = `${modelType}-${model.key}`;
                const isUpdating = updatingModels.has(key);

                return (
                  <tr key={model.key}>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex flex-col">
                        <span className="font-medium">{model.label}</span>
                        <span className="text-xs text-muted-foreground">{model.key}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {model.is_custom ? (
                        <span className="inline-flex items-center rounded-full bg-info-soft px-2 py-1 text-xs font-medium text-info">
                          {t('providerConfig.models.custom')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                          {t('providerConfig.models.builtin')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          handleToggleModelStatus(model.key, modelType, model.is_active)
                        }
                        disabled={isUpdating}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                          model.is_active ? 'bg-success' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            model.is_active
                              ? direction === 'rtl'
                                ? '-translate-x-5'
                                : 'translate-x-5'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const handleExportModel = useCallback((model: ProviderConfigModel) => {
    try {
      const yamlContent = customModelToYaml(model);
      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${model.model_key}.yml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('providerConfig.models.exportSuccess'));
    } catch (error) {
      console.error('Error exporting model:', error);
      toast.error(t('errors.generic'));
    }
  }, [t]);

  const renderCustomModelsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {t('providerConfig.models.customModels')}
        </h3>
        <button
          onClick={() => setShowCustomModelModal(true)}
          className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          <PlusIcon className="-ms-0.5 me-1.5 h-4 w-4" />
          {t('providerConfig.models.addCustom')}
        </button>
      </div>

      {localProviderConfigDetail?.custom_models &&
      localProviderConfigDetail.custom_models.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-start text-sm font-semibold text-foreground">
                  {t('providerConfig.models.modelName')}
                </th>
                <th className="px-4 py-3 text-start text-sm font-semibold text-foreground">
                  {t('providerConfig.models.type')}
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                  {t('providerConfig.models.status')}
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {localProviderConfigDetail.custom_models.map(model => (
                <tr key={model.uuid}>
                  <td className="px-4 py-3 text-sm text-foreground">
                    <div className="flex flex-col">
                      <span className="font-medium">{model.label}</span>
                      <span className="text-xs text-muted-foreground">{model.model_key}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-1 text-xs font-medium text-primary">
                      {model.model_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        handleToggleModelStatus(model.model_key, model.model_type, model.is_active)
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        model.is_active ? 'bg-success' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          model.is_active
                            ? direction === 'rtl'
                              ? '-translate-x-5'
                              : 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleExportModel(model)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={t('providerConfig.models.export')}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingCustomModel(model)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={t('common.edit')}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomModel(model.uuid)}
                        className="rounded p-1 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('providerConfig.models.noCustomModels')}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!localProviderConfigDetail) {
    return null;
  }

  return (
    <div className="space-y-8">
      {renderModelTable(
        t('providerConfig.models.llmModels'),
        localProviderConfigDetail.llm_models,
        'llm'
      )}

      {renderModelTable(
        t('providerConfig.models.embeddingModels'),
        localProviderConfigDetail.embedding_models,
        'embedding'
      )}

      {renderModelTable(
        t('providerConfig.models.rerankerModels'),
        localProviderConfigDetail.reranker_models,
        'reranker'
      )}

      {renderCustomModelsSection()}

      {/* Custom Model Modal */}
      {(showCustomModelModal || editingCustomModel) && (
        <CustomModelModal
          isOpen={showCustomModelModal || !!editingCustomModel}
          onClose={() => {
            setShowCustomModelModal(false);
            setEditingCustomModel(null);
          }}
          onSubmit={(data: CreateCustomModelRequest | Partial<CreateCustomModelRequest>) => {
            if (editingCustomModel) {
              handleUpdateCustomModel(editingCustomModel.uuid, data);
            } else {
              handleCreateCustomModel(data as CreateCustomModelRequest);
            }
          }}
          editingModel={editingCustomModel}
        />
      )}
    </div>
  );
};

export default ModelManagementSection;
