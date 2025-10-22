import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { Proxy, CreateProxyRequest, ProxyType, TestProxyRequest } from '../../types/proxy';
import toast from 'react-hot-toast';
import Button from '../shared/Button';

interface ProxyFormProps {
  isOpen: boolean;
  initialData?: Proxy;
  onClose: () => void;
  onSubmit: (data: CreateProxyRequest) => Promise<void>;
  onTest: (data: TestProxyRequest) => Promise<void>;
}

const ProxyForm: React.FC<ProxyFormProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
  onTest,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateProxyRequest>({
    name: initialData?.name || '',
    host: initialData?.host || '',
    username: initialData?.username || '',
    password: '',
    port: initialData?.port || 8080,
    proxy_type: initialData?.proxy_type || ProxyType.HTTP,
    is_default: initialData?.is_default || false,
    slug: initialData?.slug || '',
    created_at: initialData?.created_at || '',
    updated_at: initialData?.updated_at || '',
    has_password: initialData?.has_password || false,
  });

  // Track which password action is selected
  const [passwordAction, setPasswordAction] = useState<'keep' | 'remove' | 'change'>(
    initialData ? 'keep' : 'change'
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        host: initialData.host,
        username: initialData.username || '',
        password: '',
        port: initialData.port,
        proxy_type: initialData.proxy_type,
        is_default: initialData.is_default,
        slug: initialData.slug,
        created_at: initialData.created_at,
        updated_at: initialData.updated_at,
        has_password: initialData.has_password,
      });
      // Initialize passwordAction to 'keep' when editing an existing proxy
      setPasswordAction('keep');
    } else {
      setFormData({
        name: '',
        host: '',
        username: '',
        password: '',
        port: 8080,
        proxy_type: ProxyType.HTTP,
        is_default: false,
        slug: '',
        created_at: '',
        updated_at: '',
        has_password: false,
      });
      // Initialize passwordAction to 'change' for new proxies
      setPasswordAction('change');
    }
    setLoading(false);
    setLoadingTest(false);
    setErrors({});
  }, [initialData]);

  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox
        ? checked
        : name === 'port'
          ? parseInt(value, 10)
          : name === 'proxy_type'
            ? (value as ProxyType)
            : value,
    }));
  };

  // Prepare proxy data for submission or testing
  const prepareProxyData = (
    validateForm = true
  ): { isValid: boolean; data: Record<string, any> } => {
    // For validation
    const newErrors: Partial<Record<keyof CreateProxyRequest, string>> = {};

    if (validateForm) {
      // Validate required fields
      if (!formData.name.trim()) {
        newErrors.name = t('settings.proxy.form.nameRequired');
      }
      if (!formData.host.trim()) {
        newErrors.host = t('settings.proxy.form.hostRequired');
      }
      if (formData.port <= 0) {
        newErrors.port = t('settings.proxy.form.portRequired');
      }

      // Validate password if user is setting a new one
      if (initialData && passwordAction === 'change' && formData.password === '') {
        newErrors.password = t('settings.proxy.form.passwordEmpty');
      }

      setErrors(newErrors);

      // Check if there are errors
      if (Object.keys(newErrors).length > 0) {
        const errorFields = Object.keys(newErrors).join(', ');
        toast.error(t('settings.proxy.form.fixFields', { fields: errorFields }));
        return { isValid: false, data: {} };
      }
    }

    // Start with base form data
    const proxyData: Record<string, any> = {
      ...formData,
      username: formData.username?.trim() === '' ? null : formData.username,
    };

    // Handle update vs create scenarios
    if (initialData) {
      // For updates, only include fields that have changed
      const updateData: Record<string, any> = {};

      // Include standard fields that have changed
      if (formData.name !== initialData.name) updateData.name = formData.name;
      if (formData.host !== initialData.host) updateData.host = formData.host;
      if (formData.port !== initialData.port) updateData.port = formData.port;
      if (formData.proxy_type !== initialData.proxy_type)
        updateData.proxy_type = formData.proxy_type;
      if (formData.is_default !== initialData.is_default)
        updateData.is_default = formData.is_default;

      // Handle username separately (convert empty string to null)
      if (formData.username?.trim() !== initialData.username) {
        updateData.username = formData.username?.trim() === '' ? null : formData.username;
      }

      // Handle password based on passwordAction
      if (passwordAction === 'keep') {
        // Don't include password in update data
      } else if (passwordAction === 'remove') {
        // Set password to null when removing
        updateData.password = null;
      } else if (passwordAction === 'change') {
        // Include the new password
        updateData.password = formData.password || '';
      }

      // Include slug for test requests or if it changed
      if (!validateForm || formData.slug !== initialData.slug) {
        updateData.slug = formData.slug || initialData.slug;
      }

      // Only return data if there are changes (for validation=true)
      if (validateForm && Object.keys(updateData).length === 0) {
        return { isValid: false, data: {} };
      }

      return { isValid: true, data: updateData };
    } else {
      // For new proxies, set has_password based on whether a password was provided
      proxyData.has_password = !!proxyData.password;
      return { isValid: true, data: proxyData };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Clear any previous errors
      setErrors({});
      setLoading(true);

      // Prepare and validate the proxy data
      const { isValid, data } = prepareProxyData(true);

      if (!isValid) {
        setLoading(false);
        if (Object.keys(data).length === 0 && initialData) {
          toast.error(t('settings.proxy.form.noChanges'));
        }
        return;
      }

      // Submit the data
      await onSubmit(data as CreateProxyRequest);
      onClose();
    } catch (error: any) {
      console.error('Error submitting proxy form:', error);

      // Handle API error responses
      if (error.response?.data) {
        // Check for non-field errors and display them above the action buttons
        if (error.response.data.errors) {
          setErrors(error.response.data.errors);
        }

        // Show the general message in toast
        if (error.response.data.message) {
          toast.error(error.response.data.message);
        } else if (error.response.data.detail) {
          toast.error(`Error: ${error.response.data.detail}`);
        } else {
          toast.error(t('settings.proxy.toast.createError'));
        }
      } else {
        toast.error(t('settings.proxy.toast.createError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestProxy = async () => {
    try {
      // Clear any previous errors
      setErrors({});
      setLoadingTest(true);

      // Get proxy data for testing without full validation
      const { data } = prepareProxyData(false);

      // Test the proxy
      await onTest(data as TestProxyRequest);
      toast.success(t('settings.proxy.toast.testSuccess'));
    } catch (error: any) {
      console.error('Error testing proxy:', error);

      // Handle API error responses with more detail
      if (error.response?.data) {
        // Check for non-field errors and display them above the action buttons
        if (error.response.data.errors) {
          setErrors(error.response.data.errors);
        }

        // Show the general message in toast
        if (error.response.data.message) {
          toast.error(`${error.response.data.message}`);
        } else {
          toast.error(t('settings.proxy.toast.testError'));
        }
      } else {
        toast.error(t('settings.proxy.toast.testError'));
      }
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-6 text-start align-middle shadow-xl transition-all">
                <DialogTitle as="h3" className="text-lg font-medium leading-6 text-foreground">
                  {initialData ? t('settings.proxy.editTitle') : t('settings.proxy.createTitle')}
                </DialogTitle>

                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground">
                        {t('settings.proxy.form.name')} <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border bg-input text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm ${errors.name ? 'border-error' : 'border-input-border'}`}
                        placeholder={t('settings.proxy.form.namePlaceholder')}
                        required
                      />
                      {errors.name && <p className="mt-1 text-sm text-error">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-foreground">
                        {t('settings.proxy.form.slug')} <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border bg-input text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm ${errors.slug ? 'border-error' : 'border-input-border'}`}
                        placeholder={t('settings.proxy.form.slugPlaceholder')}
                        required
                      />
                      {errors.slug && <p className="mt-1 text-sm text-error">{errors.slug}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('settings.proxy.form.slugHelp')}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="proxy_type"
                        className="block text-sm font-medium text-foreground"
                      >
                        {t('settings.proxy.form.proxyType')} <span className="text-error">*</span>
                      </label>
                      <select
                        id="proxy_type"
                        name="proxy_type"
                        value={formData.proxy_type}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border bg-input text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm ${errors.proxy_type ? 'border-error' : 'border-input-border'}`}
                        required
                      >
                        <option value={ProxyType.HTTP}>HTTP</option>
                        <option value={ProxyType.SOCKS4}>SOCKS4</option>
                        <option value={ProxyType.SOCKS5}>SOCKS5</option>
                      </select>
                      {errors.proxy_type && (
                        <p className="mt-1 text-sm text-error">{errors.proxy_type}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="host" className="block text-sm font-medium text-foreground">
                        {t('settings.proxy.form.host')} <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        id="host"
                        name="host"
                        value={formData.host}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border bg-input text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm ${errors.host ? 'border-error' : 'border-input-border'}`}
                        placeholder={t('settings.proxy.form.hostPlaceholder')}
                        required
                      />
                      {errors.host && <p className="mt-1 text-sm text-error">{errors.host}</p>}
                    </div>

                    <div>
                      <label htmlFor="port" className="block text-sm font-medium text-foreground">
                        {t('settings.proxy.form.port')} <span className="text-error">*</span>
                      </label>
                      <input
                        type="number"
                        id="port"
                        name="port"
                        value={formData.port}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border bg-input text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm ${errors.port ? 'border-error' : 'border-input-border'}`}
                        min="1"
                        max="65535"
                        required
                      />
                      {errors.port && <p className="mt-1 text-sm text-error">{errors.port}</p>}
                    </div>

                    {/* Authentication Section with clear separation */}
                    <div className="mb-4 rounded-md border border-border p-4">
                      <h3 className="mb-4 text-sm font-medium text-foreground">
                        {t('settings.proxy.form.authSettings')}
                      </h3>

                      {/* Username field - same for both adding and updating */}
                      <div className="mb-4">
                        <label
                          htmlFor="username"
                          className="block text-sm font-medium text-foreground"
                        >
                          {t('settings.proxy.form.username')}
                        </label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username || ''}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md border bg-input text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm ${errors.username ? 'border-error' : 'border-input-border'}`}
                          placeholder={t('settings.proxy.form.usernamePlaceholder')}
                        />
                        {errors.username && (
                          <p className="mt-1 text-sm text-error">{errors.username}</p>
                        )}
                      </div>

                      {/* Different password handling for new vs existing proxies */}
                      {initialData ? (
                        // Update mode - Show options for password handling
                        <div>
                          <div className="mb-2 text-sm font-medium text-foreground">
                            {t('settings.proxy.form.password')}
                          </div>

                          {/* Option 1: Keep existing password state */}
                          <div className="mb-3 flex items-center">
                            <input
                              type="radio"
                              id="keep_password"
                              name="password_action"
                              checked={passwordAction === 'keep'}
                              onChange={() => {
                                setPasswordAction('keep');
                                setFormData({
                                  ...formData,
                                  has_password: initialData.has_password,
                                  password: '',
                                });
                              }}
                              className="rounded-full border-input-border text-primary focus:ring-primary"
                            />
                            <label
                              htmlFor="keep_password"
                              className="ms-2 block text-sm text-foreground"
                            >
                              {initialData.has_password
                                ? t('settings.proxy.form.keepPassword')
                                : t('settings.proxy.form.noPassword')}
                            </label>
                          </div>

                          {/* Option 2: Remove password (only if it exists) */}
                          {initialData.has_password && (
                            <div className="mb-3 flex items-center">
                              <input
                                type="radio"
                                id="remove_password"
                                name="password_action"
                                checked={passwordAction === 'remove'}
                                onChange={() => {
                                  setPasswordAction('remove');
                                  setFormData({
                                    ...formData,
                                    password: null,
                                  });
                                }}
                                className="rounded-full border-input-border text-primary focus:ring-primary"
                              />
                              <label
                                htmlFor="remove_password"
                                className="ms-2 block text-sm text-foreground"
                              >
                                {t('settings.proxy.form.removePassword')}
                              </label>
                            </div>
                          )}

                          {/* Option 3: Set/change password */}
                          <div className="mb-3 flex items-center">
                            <input
                              type="radio"
                              id="set_password"
                              name="password_action"
                              checked={passwordAction === 'change'}
                              onChange={() => {
                                setPasswordAction('change');
                                setFormData({
                                  ...formData,
                                  has_password: true,
                                  password: '',
                                });
                              }}
                              className="rounded-full border-input-border text-primary focus:ring-primary"
                            />
                            <label
                              htmlFor="set_password"
                              className="ms-2 block text-sm text-foreground"
                            >
                              {initialData.has_password
                                ? t('settings.proxy.form.changePassword')
                                : t('settings.proxy.form.setPassword')}
                            </label>
                          </div>

                          {/* Show password field only when setting/changing password */}
                          {passwordAction === 'change' && (
                            <div className="ms-6 mt-3 border-s-2 border-border ps-2">
                              <label
                                htmlFor="password"
                                className="block text-sm font-medium text-foreground"
                              >
                                {t('settings.proxy.form.newPassword')}
                              </label>
                              <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password || ''}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md border bg-input text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm ${errors.password ? 'border-error' : 'border-input-border'}`}
                                required
                                autoFocus
                              />
                              {errors.password && (
                                <p className="mt-1 text-sm text-error">{errors.password}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        // Create mode - Simple password field
                        <div>
                          <label
                            htmlFor="password"
                            className="block text-sm font-medium text-foreground"
                          >
                            {t('settings.proxy.form.password')}
                          </label>
                          <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password || ''}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border bg-input text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm ${errors.password ? 'border-error' : 'border-input-border'}`}
                            placeholder={t('settings.proxy.form.passwordPlaceholder')}
                          />
                          {errors.password && (
                            <p className="mt-1 text-sm text-error">{errors.password}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('settings.proxy.form.passwordHelp')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_default"
                        name="is_default"
                        checked={formData.is_default}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-input-border text-primary shadow-sm focus:ring-1 focus:ring-primary"
                      />
                      <label htmlFor="is_default" className="ms-2 block text-sm text-foreground">
                        {t('settings.proxy.form.isDefault')}
                      </label>
                    </div>
                  </div>

                  {/* Display non-field errors above action buttons */}
                  {errors.non_field_errors && (
                    <div className="mt-4 rounded border border-error bg-error/10 p-3">
                      <ul className="list-disc ps-5 text-sm text-error">
                        <li>{errors.non_field_errors}</li>
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-x-3">
                    <Button onClick={onClose} disabled={loading} variant="outline">
                      {t('settings.proxy.cancelButton')}
                    </Button>
                    <Button type="submit" disabled={loading} loading={loading}>
                      {initialData
                        ? t('settings.proxy.updateButton')
                        : t('settings.proxy.createButton')}
                    </Button>
                    <Button onClick={handleTestProxy} disabled={loadingTest} loading={loadingTest}>
                      {t('settings.proxy.testButton')}
                    </Button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ProxyForm;
