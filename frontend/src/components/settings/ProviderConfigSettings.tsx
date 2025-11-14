import React, { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { PlusIcon } from '@heroicons/react/24/outline';

import Button from '../shared/Button';

import { useConfirm } from '../../contexts/ConfirmContext';
import useIsTabletOrMobile from '../../hooks/useIsTabletOrMobile';
import { providerApi } from '../../services/api/provider';
import { PaginatedResponse } from '../../types/common';
import { ProviderConfigFormData, Provider, ProviderConfig } from '../../types/provider';

import { ProviderConfigForm } from './ProviderConfigForm';
import ProviderConfigList from './ProviderConfigList';

const ProviderConfigSettings: React.FC = () => {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [response, setResponse] = useState<PaginatedResponse<ProviderConfig>>({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProviderConfig, setEditingProviderConfig] = useState<ProviderConfig | null>(null);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);

  const isTabletOrMobile = useIsTabletOrMobile();

  // Function to fetch provider configs
  const fetchProviderConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await providerApi.listProviderConfigs(currentPage);
      setResponse(response);
    } catch (error) {
      console.error('Error fetching provider configurations:', error);
      toast.error(t('settings.providerConfig.toast.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, t]);

  const fetchProviders = useCallback(async () => {
    try {
      const response = await providerApi.listProviders();
      setAvailableProviders(response);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error(t('settings.providerConfig.toast.fetchProvidersError'));
    }
  }, [t]);

  useEffect(() => {
    fetchProviderConfigs();
    fetchProviders();
  }, [fetchProviderConfigs, fetchProviders]);

  // Function to create a new provider config
  const handleCreateProviderConfig = async (data: ProviderConfigFormData) => {
    try {
      await providerApi.createProviderConfig(data);
      toast.success(t('settings.providerConfig.toast.createSuccess'));
      fetchProviderConfigs();
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error creating provider config:', error);
      return Promise.reject(error);
    }
  };

  // Function to update a provider config
  const handleUpdateProviderConfig = async (data: ProviderConfigFormData) => {
    if (!editingProviderConfig)
      return Promise.reject(new Error('No provider config selected for editing'));

    try {
      await providerApi.updateProviderConfig(editingProviderConfig.uuid, data);
      toast.success(t('settings.providerConfig.toast.updateSuccess'));
      fetchProviderConfigs();
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error updating provider config:', error);
      return Promise.reject(error);
    }
  };

  // Function to test a provider config
  const handleTestProviderConfig = async (data: ProviderConfigFormData) => {
    try {
      await providerApi.testProviderConfig(data);
      toast.success(t('settings.providerConfig.toast.testSuccess'));
      return Promise.resolve();
    } catch (error) {
      console.error('Error testing provider config:', error);
      toast.error(t('settings.providerConfig.toast.testError'));
      return Promise.reject(error);
    }
  };

  // Function to delete a provider config
  const handleDeleteProviderConfig = async (uuid: string) => {
    confirm({
      title: t('settings.providerConfig.deleteTitle'),
      message: t('settings.providerConfig.deleteConfirm'),
      confirmText: t('common.delete'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setDeletingUuid(uuid);
          await providerApi.deleteProviderConfig(uuid);
          toast.success(t('settings.providerConfig.toast.deleteSuccess'));
          fetchProviderConfigs();
        } catch (error) {
          console.error('Error deleting provider config:', error);
          toast.error(t('settings.providerConfig.toast.deleteError'));
        } finally {
          setDeletingUuid(null);
        }
      },
    });
  };

  // Function to open the edit modal
  const handleEditProviderConfig = async (providerConfig: ProviderConfig) => {
    try {
      // We can use the providerConfig directly since it already has the fields we need
      setEditingProviderConfig(providerConfig);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error loading provider config for edit:', error);
      toast.error(t('settings.providerConfig.toast.loadError'));
    }
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProviderConfig(null);
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">
            {t('settings.providerConfig.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('settings.providerConfig.subtitle')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => {
              setEditingProviderConfig(null);
              setIsModalOpen(true);
            }}
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            {t('settings.providerConfig.addButton')}
          </Button>
        </div>
      </div>

      <ProviderConfigList
        providerConfigs={response.results}
        currentPage={currentPage}
        totalItems={response.count}
        hasNext={response.next !== null}
        hasPrevious={response.previous !== null}
        loading={loading}
        deletingUuid={deletingUuid}
        isTabletOrMobile={isTabletOrMobile}
        onPageChange={setCurrentPage}
        onEdit={providerConfig => handleEditProviderConfig(providerConfig as ProviderConfig)}
        onDelete={handleDeleteProviderConfig}
      />

      {isModalOpen && (
        <ProviderConfigForm
          isOpen={isModalOpen}
          initialData={editingProviderConfig || undefined}
          onClose={handleCloseModal}
          onSubmit={editingProviderConfig ? handleUpdateProviderConfig : handleCreateProviderConfig}
          onTest={handleTestProviderConfig}
          availableProviders={availableProviders}
        />
      )}
    </div>
  );
};

export default ProviderConfigSettings;
