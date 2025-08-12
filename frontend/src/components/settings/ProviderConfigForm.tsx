import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ProviderConfigFormData, Provider, ProviderConfig } from '../../types/provider';
import Button from '../shared/Button';

interface ProviderConfigFormProps {
  isOpen: boolean;
  initialData?: ProviderConfig | null;
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
    if (!initialData && !formData.api_key.trim()) {
      newErrors.api_key = 'API key is required';
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
      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      console.error('Error submitting form:', error);

      // Handle API validation errors
      if (error.response?.data) {
        const apiErrors: Record<string, string> = {};
        Object.entries(error.response.data).forEach(([key, value]) => {
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
      await onTest(formData);
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
                className={`mt-1 block w-full rounded-md ${errors.title
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'
                  } shadow-sm dark:bg-gray-800 dark:text-white sm:text-sm`}
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
                disabled={loading || Boolean(initialData)}
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm ${errors.provider_name ? 'border-red-500' : ''}`}
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

            <div>
              <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                API Key {initialData && <span className="text-xs text-gray-500">(leave empty to keep current)</span>}
              </label>
              <input
                type="password"
                id="api_key"
                name="api_key"
                value={formData.api_key}
                onChange={handleChange}
                disabled={loading}
                placeholder={initialData ? '••••••••••••••••' : 'Enter API Key'}
                className={`mt-1 block w-full rounded-md ${errors.api_key
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'
                  } shadow-sm dark:bg-gray-800 dark:text-white sm:text-sm`}
              />
              {errors.api_key && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.api_key}</p>
              )}
            </div>

            <div>
              <label htmlFor="base_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Base URL <span className="text-xs text-gray-500">(optional)</span>
              </label>
              <input
                type="text"
                id="base_url"
                name="base_url"
                value={formData.base_url || ''}
                onChange={handleChange}
                disabled={loading}
                placeholder="https://api.example.com"
                className={`mt-1 block w-full rounded-md ${errors.base_url
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'
                  } shadow-sm dark:bg-gray-800 dark:text-white sm:text-sm`}
              />
              {errors.base_url && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.base_url}</p>
              )}
            </div>

            <div className="flex justify-between space-x-3 mt-5">
              <Button
                type="button"
                onClick={handleTest}
                disabled={loading || testing}
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
