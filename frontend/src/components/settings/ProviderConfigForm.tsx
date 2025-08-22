import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ProviderConfigFormData, Provider, ProviderConfig, OPTIONS } from '../../types/provider';
import Button from '../shared/Button';
import { classnames } from '../../lib/utils';
import { AdminProviderConfig } from '../../types/admin/provider';

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
  const shouldShowApiKey = formData.provider_name && selectedProvider?.api_key !== OPTIONS.NOT_AVAILABLE;
  const shouldShowBaseUrl = formData.provider_name && selectedProvider?.base_url !== OPTIONS.NOT_AVAILABLE;
  const isApiKeyRequired = selectedProvider?.api_key === OPTIONS.REQUIRED;
  const isBaseUrlRequired = selectedProvider?.base_url === OPTIONS.REQUIRED;

  // In edit mode, check if user has made changes to test connection
  const hasChangesToTest = useMemo(() => {
    if (!isEditMode) return true; // Always allow testing in create mode
    
    // Check if API key has been changed (user entered a new value)
    const hasApiKeyChange = formData.api_key && formData.api_key.trim() !== '';
    
    // Check if base URL has been changed from initial value
    const hasBaseUrlChange = shouldShowBaseUrl && formData.base_url !== (initialData?.base_url || '');
    
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
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.provider_name || formData.provider_name.trim() === '') {
      newErrors.provider_name = 'Provider is required';
    }
    
    // Only validate API key if it should be shown and is required
    if (shouldShowApiKey && isApiKeyRequired && !formData.api_key?.trim() && !isEditMode) {
      newErrors.api_key = 'API key is required';
    }
    
    // Only validate base URL if it should be shown and is required
    if (shouldShowBaseUrl && isBaseUrlRequired && !formData.base_url?.trim()) {
      newErrors.base_url = 'Base URL is required';
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
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
          <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex justify-between items-center">
            {initialData ? 'Edit Provider Configuration' : 'Add Provider Configuration'}
            <button
              type="button"
              className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
                placeholder="Configuration Title"
                className={classnames({
                  'mt-1 block w-full rounded-md shadow-sm dark:bg-gray-800 dark:text-white sm:text-sm': true,
                  'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500': !!errors.title,
                  'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500': !errors.title,
                })}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="provider_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Provider
              </label>
              <select
                id="provider_name"
                name="provider_name"
                value={formData.provider_name || ""}
                onChange={handleChange}
                disabled={loading || isEditMode}
                className={classnames({
                  'mt-1 block w-full rounded-md shadow-sm dark:bg-gray-800 dark:text-white sm:text-sm': true,
                  'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500': !!errors.provider_name,
                  'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500': !errors.provider_name,
                  'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500 cursor-not-allowed opacity-50': isEditMode,
                })}
                required
              >
                <option value="">Select a provider</option>
                {availableProviders && availableProviders.length > 0 ? (
                  availableProviders.map((provider) => (
                    <option key={provider.key} value={provider.key}>
                      {provider.title}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Loading providers...</option>
                )}
              </select>
              {errors.provider_name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.provider_name}</p>
              )}
            </div>

            {shouldShowApiKey && (
              <div>
                <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Key
                  {!isApiKeyRequired && !isEditMode && <span className="text-xs text-gray-500 ml-1">(optional)</span>}
                  {isEditMode && <span className="text-xs text-gray-500 ml-1">(leave empty to keep current)</span>}
                </label>
                <input
                  type="password"
                  id="api_key"
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder={isEditMode ? '••••••••••••••••' : 'Enter API Key'}
                  className={classnames({
                    'mt-1 block w-full rounded-md shadow-sm dark:bg-gray-800 dark:text-white sm:text-sm': true,
                    'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500': !!errors.api_key,
                    'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500': !errors.api_key,
                  })}
                />
                {errors.api_key && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.api_key}</p>
                )}
              </div>
            )}

            {shouldShowBaseUrl && (
              <div>
                <label htmlFor="base_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Base URL
                  {!isBaseUrlRequired && <span className="text-xs text-gray-500 ml-1">(optional)</span>}
                  {isBaseUrlRequired && <span className="text-xs text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  id="base_url"
                  name="base_url"
                  value={formData.base_url || ''}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder={selectedProvider?.default_base_url || "https://api.example.com"}
                  className={classnames({
                    'mt-1 block w-full rounded-md shadow-sm dark:bg-gray-800 dark:text-white sm:text-sm': true,
                    'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500': !!errors.base_url,
                    'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500': !errors.base_url
                  })}
                />
                {errors.base_url && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.base_url}</p>
                )}
              </div>
            )}

            <div className="flex justify-between space-x-3 mt-5">
              <Button
                type="button"
                onClick={handleTest}
                disabled={loading || testing || !hasChangesToTest}
                variant="secondary"
                className="flex-1"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
// No default export needed as we're using named export
