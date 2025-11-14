import React, { useState, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { CogIcon } from '@heroicons/react/24/outline';

import Button from '../shared/Button';
import { Modal } from '../shared/Modal';


import { classnames } from '../../lib/utils';
import { AdminProviderConfig } from '../../types/admin/provider';
import { ProviderConfigFormData, Provider, ProviderConfig, OPTIONS } from '../../types/provider';

interface ProviderConfigFormProps {
  isOpen: boolean;
  initialData?: ProviderConfig | AdminProviderConfig | null;
  onClose: () => void;
  onSubmit: (data: ProviderConfigFormData) => Promise<void>;
  onTest: (data: ProviderConfigFormData) => Promise<void>;
  availableProviders: Provider[];
}

export const ProviderConfigForm: React.FC<ProviderConfigFormProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
  onTest,
  availableProviders,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ProviderConfigFormData>({
    title: initialData?.title || '',
    provider_name: initialData?.provider_name || '',
    api_key: '',
    base_url: initialData?.base_url || '',
  });

  // Get the currently selected provider configuration
  const selectedProvider = useMemo(() => {
    return availableProviders.find(provider => provider.key === formData.provider_name);
  }, [availableProviders, formData.provider_name]);

  // Check if we're in edit mode
  const isEditMode = Boolean(initialData);

  // Check if fields should be shown based on provider configuration
  const shouldShowApiKey =
    formData.provider_name && selectedProvider?.api_key !== OPTIONS.NOT_AVAILABLE;
  const shouldShowBaseUrl =
    formData.provider_name && selectedProvider?.base_url !== OPTIONS.NOT_AVAILABLE;
  const isApiKeyRequired = selectedProvider?.api_key === OPTIONS.REQUIRED;
  const isBaseUrlRequired = selectedProvider?.base_url === OPTIONS.REQUIRED;

  // In edit mode, check if user has made changes to test connection
  const hasChangesToTest = useMemo(() => {
    if (!isEditMode) return true; // Always allow testing in create mode

    // Check if API key has been changed (user entered a new value)
    const hasApiKeyChange = formData.api_key && formData.api_key.trim() !== '';

    // Check if base URL has been changed from initial value
    const hasBaseUrlChange =
      shouldShowBaseUrl && formData.base_url !== (initialData?.base_url || '');

    return hasApiKeyChange || hasBaseUrlChange;
  }, [isEditMode, formData.api_key, formData.base_url, shouldShowBaseUrl, initialData?.base_url]);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

    // Handle all form inputs with appropriate type conversion if needed
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('settings.providerConfig.form.titleRequired');
    }

    if (!formData.provider_name || formData.provider_name.trim() === '') {
      newErrors.provider_name = t('settings.providerConfig.form.providerRequired');
    }

    // Only validate API key if it should be shown and is required
    if (shouldShowApiKey && isApiKeyRequired && !formData.api_key?.trim() && !isEditMode) {
      newErrors.api_key = t('settings.providerConfig.form.apiKeyRequired');
    }

    // Only validate base URL if it should be shown and is required
    if (shouldShowBaseUrl && isBaseUrlRequired && !formData.base_url?.trim()) {
      newErrors.base_url = t('settings.providerConfig.form.baseUrlRequired');
    }

    setErrors(newErrors);
    console.log('Form validation result:', newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Create a filtered form data object that excludes unavailable fields
      const filteredFormData: ProviderConfigFormData = {
        title: formData.title,
        provider_name: formData.provider_name,
      };

      // Only include api_key if it should be shown and has a value
      // In edit mode, only send if user actually entered a new value
      if (shouldShowApiKey && formData.api_key && formData.api_key.trim()) {
        filteredFormData.api_key = formData.api_key;
      }

      // Only include base_url if it should be shown
      if (shouldShowBaseUrl) {
        filteredFormData.base_url = formData.base_url || '';
      }

      await onSubmit(filteredFormData);
      onClose();
    } catch (error: any) {
      console.error('Error submitting form:', error);

      // Handle API validation errors
      if (error.response?.data) {
        const apiErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            apiErrors[key] = value[0] as string;
          } else if (typeof value === 'string') {
            apiErrors[key] = value;
          }
        });
        setErrors(apiErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setTesting(true);

      // Create a filtered form data object for testing
      const filteredFormData: ProviderConfigFormData = {
        title: formData.title,
        provider_name: formData.provider_name,
      };

      // Only include api_key if it should be shown and has a value
      // In edit mode, only send if user actually entered a new value
      if (shouldShowApiKey && formData.api_key && formData.api_key.trim()) {
        filteredFormData.api_key = formData.api_key;
      }

      // Only include base_url if it should be shown
      if (shouldShowBaseUrl) {
        filteredFormData.base_url = formData.base_url || '';
      }

      await onTest(filteredFormData);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialData
          ? t('settings.providerConfig.editTitle')
          : t('settings.providerConfig.createTitle')
      }
      icon={CogIcon}
      size="md"
      footer={
        <>
          <Button
            type="button"
            onClick={handleTest}
            disabled={loading || testing || !hasChangesToTest}
            variant="secondary"
          >
            {testing
              ? t('settings.providerConfig.form.testing')
              : t('settings.providerConfig.form.testButton')}
          </Button>
          <Button type="submit" form="provider-config-form" disabled={loading}>
            {loading
              ? t('settings.providerConfig.form.saving')
              : initialData
                ? t('settings.providerConfig.form.updateButton')
                : t('settings.providerConfig.form.saveButton')}
          </Button>
        </>
      }
    >
      <form id="provider-config-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            {t('settings.providerConfig.form.title')}
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={loading}
            placeholder={t('settings.providerConfig.form.titlePlaceholder')}
            className={classnames({
              'mt-1 block w-full rounded-lg border bg-input text-foreground shadow-sm sm:text-sm': true,
              'border-error placeholder:text-error/50 focus:border-error focus:ring-1 focus:ring-error':
                !!errors.title,
              'border-input-border focus:border-primary focus:ring-1 focus:ring-primary':
                !errors.title,
            })}
          />
          {errors.title && <p className="mt-1 text-sm text-error">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="provider_name" className="block text-sm font-medium text-foreground">
            {t('settings.providerConfig.form.provider')}
          </label>
          <select
            id="provider_name"
            name="provider_name"
            value={formData.provider_name || ''}
            onChange={handleChange}
            disabled={loading || isEditMode}
            className={classnames({
              'mt-1 block w-full rounded-lg border bg-input text-foreground shadow-sm sm:text-sm': true,
              'border-error placeholder:text-error/50 focus:border-error focus:ring-1 focus:ring-error':
                !!errors.provider_name,
              'border-input-border focus:border-primary focus:ring-1 focus:ring-primary':
                !errors.provider_name,
              'cursor-not-allowed opacity-50': isEditMode,
            })}
            required
          >
            <option value="">{t('settings.providerConfig.form.providerPlaceholder')}</option>
            {availableProviders && availableProviders.length > 0 ? (
              availableProviders.map(provider => (
                <option key={provider.key} value={provider.key}>
                  {provider.title}
                </option>
              ))
            ) : (
              <option value="" disabled>
                {t('settings.providerConfig.form.loadingProviders')}
              </option>
            )}
          </select>
          {errors.provider_name && (
            <p className="mt-1 text-sm text-error">{errors.provider_name}</p>
          )}
        </div>

        {shouldShowApiKey && (
          <div>
            <label htmlFor="api_key" className="block text-sm font-medium text-foreground">
              {t('settings.providerConfig.form.apiKey')}
              {!isApiKeyRequired && !isEditMode && (
                <span className="ms-1 text-xs text-muted-foreground">
                  {t('settings.providerConfig.form.apiKeyOptional')}
                </span>
              )}
              {isEditMode && (
                <span className="ms-1 text-xs text-muted-foreground">
                  {t('settings.providerConfig.form.apiKeyKeepCurrent')}
                </span>
              )}
            </label>
            <input
              type="password"
              id="api_key"
              name="api_key"
              value={formData.api_key}
              onChange={handleChange}
              disabled={loading}
              placeholder={
                isEditMode
                  ? t('settings.providerConfig.form.apiKeyPlaceholderEdit')
                  : t('settings.providerConfig.form.apiKeyPlaceholder')
              }
              className={classnames({
                'mt-1 block w-full rounded-lg border bg-input text-foreground shadow-sm placeholder:text-muted-foreground sm:text-sm': true,
                'border-error placeholder:text-error/50 focus:border-error focus:ring-1 focus:ring-error':
                  !!errors.api_key,
                'border-input-border focus:border-primary focus:ring-1 focus:ring-primary':
                  !errors.api_key,
              })}
            />
            {errors.api_key && <p className="mt-1 text-sm text-error">{errors.api_key}</p>}
          </div>
        )}

        {shouldShowBaseUrl && (
          <div>
            <label htmlFor="base_url" className="block text-sm font-medium text-foreground">
              {t('settings.providerConfig.form.baseUrl')}
              {!isBaseUrlRequired && (
                <span className="ms-1 text-xs text-muted-foreground">
                  {t('settings.providerConfig.form.baseUrlOptional')}
                </span>
              )}
              {isBaseUrlRequired && <span className="ms-1 text-xs text-error">*</span>}
            </label>
            <input
              type="text"
              id="base_url"
              name="base_url"
              value={formData.base_url || ''}
              onChange={handleChange}
              disabled={loading}
              placeholder={selectedProvider?.default_base_url || 'https://api.example.com'}
              className={classnames({
                'mt-1 block w-full rounded-lg border bg-input text-foreground shadow-sm sm:text-sm': true,
                'border-error placeholder:text-error/50 focus:border-error focus:ring-1 focus:ring-error':
                  !!errors.base_url,
                'border-input-border focus:border-primary focus:ring-1 focus:ring-primary':
                  !errors.base_url,
              })}
            />
            {errors.base_url && <p className="mt-1 text-sm text-error">{errors.base_url}</p>}
          </div>
        )}
      </form>
    </Modal>
  );
};
// No default export needed as we're using named export
