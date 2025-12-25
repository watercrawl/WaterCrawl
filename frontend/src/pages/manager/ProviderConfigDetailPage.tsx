import React, { useEffect, useState, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';


import ModelManagementSection from '../../components/provider/ModelManagementSection';
import Loading from '../../components/shared/Loading';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { adminProviderApi } from '../../services/api/admin/provider';
import { ProviderConfigDetail } from '../../types/provider';

const ProviderConfigDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { providerConfigId } = useParams<{ providerConfigId: string }>();
  const [providerConfigDetail, setProviderConfigDetail] = useState<ProviderConfigDetail | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchProviderData = useCallback(async (silent = false) => {
    if (!providerConfigId) return;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const detail = await adminProviderApi.providerConfigModels.list(providerConfigId);
      setProviderConfigDetail(detail);
    } catch (err: unknown) {
      console.error('Error fetching provider config:', err);
      if (!silent) {
        setError(t('providerConfig.toast.loadError'));
        toast.error(t('providerConfig.toast.loadError'));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [providerConfigId, t]);

  useEffect(() => {
    fetchProviderData();
  }, [fetchProviderData]);

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

  if (!providerConfigDetail) {
    return <div className="mt-8 text-center">{t('errors.notFound')}</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {providerConfigDetail.title || t('providerConfig.details')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('providerConfig.provider')}: {providerConfigDetail.provider_name}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-6 text-xl font-semibold text-foreground">
          {t('providerConfig.models.title')}
        </h2>
        <ModelManagementSection
          providerConfigId={providerConfigId!}
          providerConfigDetail={providerConfigDetail}
          onRefresh={() => fetchProviderData(true)}
          loading={loading}
          isAdmin={true}
        />
      </div>
    </div>
  );
};

export default ProviderConfigDetailPage;
