import React, { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

import Card from '../shared/Card';
import Loading from '../shared/Loading';

import { useConfirm } from '../../contexts/ConfirmContext';
import { knowledgeBaseApi } from '../../services/api/knowledgeBase';
import {
  RetrievalSetting,
  RetrievalSettingFormData,
  KnowledgeBaseDetail,
  RetrievalType,
} from '../../types/knowledge';

import RetrievalSettingForm from './RetrievalSettingForm';

interface RetrievalSettingsManagerProps {
  knowledgeBase: KnowledgeBaseDetail;
  onUpdate: () => void;
}

const RetrievalSettingsManager: React.FC<RetrievalSettingsManagerProps> = ({
  knowledgeBase,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [retrievalSettings, setRetrievalSettings] = useState<RetrievalSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchRetrievalSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await knowledgeBaseApi.listRetrievalSettings(knowledgeBase.uuid);
      // Handle both array response and paginated response
      const settings = Array.isArray(response) 
        ? response 
        : (response?.results || []);
      setRetrievalSettings(settings);
    } catch (error) {
      console.error('Failed to fetch retrieval settings:', error);
      toast.error(t('settings.knowledgeBase.retrievalSettings.loadError'));
      setRetrievalSettings([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [knowledgeBase.uuid, t]);

  useEffect(() => {
    fetchRetrievalSettings();
  }, [fetchRetrievalSettings]);

  const handleDelete = async (setting: RetrievalSetting) => {
    if (setting.is_default) {
      toast.error(t('settings.knowledgeBase.retrievalSettings.cannotDeleteDefault'));
      return;
    }

    confirm({
      title: t('settings.knowledgeBase.retrievalSettings.deleteTitle'),
      message: t('settings.knowledgeBase.retrievalSettings.deleteMessage', {
        name: setting.name,
      }),
      variant: 'danger',
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          await knowledgeBaseApi.deleteRetrievalSetting(knowledgeBase.uuid, setting.uuid);
          toast.success(t('settings.knowledgeBase.retrievalSettings.deleteSuccess'));
          fetchRetrievalSettings();
          onUpdate();
        } catch (error) {
          console.error('Failed to delete retrieval setting:', error);
          toast.error(t('settings.knowledgeBase.retrievalSettings.deleteError'));
        }
      },
    });
  };

  const handleSetDefault = async (setting: RetrievalSetting) => {
      await knowledgeBaseApi.updateRetrievalSetting(knowledgeBase.uuid, setting.uuid, {
        is_default: true,
      });
      toast.success(t('settings.knowledgeBase.retrievalSettings.setDefaultSuccess'));
      fetchRetrievalSettings();
      onUpdate();
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <Loading size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">
            {t('settings.knowledgeBase.retrievalSettings.title')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('settings.knowledgeBase.retrievalSettings.description')}
          </p>
        </div>
        <button
          onClick={() => setEditingId('new')}
          className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <PlusIcon className="-ms-1 me-2 h-5 w-5" />
          {t('settings.knowledgeBase.retrievalSettings.addNew')}
        </button>
      </div>

      {editingId === 'new' && (
        <RetrievalSettingForm
          knowledgeBase={knowledgeBase}
          onSave={async data => {
            try {
              await knowledgeBaseApi.createRetrievalSetting(knowledgeBase.uuid, data as unknown as RetrievalSettingFormData);
              toast.success(t('settings.knowledgeBase.retrievalSettings.createSuccess'));
              setEditingId(null);
              fetchRetrievalSettings();
              onUpdate();
            } catch (error: any) {
              console.error('Failed to create retrieval setting:', error);
              toast.error(
                error.response?.data?.detail ||
                  t('settings.knowledgeBase.retrievalSettings.createError')
              );
            }
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      <div className="space-y-4">
        {Array.isArray(retrievalSettings) && retrievalSettings.map(setting => (
          <RetrievalSettingCard
            key={setting.uuid}
            setting={setting}
            knowledgeBase={knowledgeBase}
            isEditing={editingId === setting.uuid}
            onEdit={() => setEditingId(setting.uuid)}
            onCancel={() => setEditingId(null)}
            onSave={async data => {
              try {
                await knowledgeBaseApi.updateRetrievalSetting(
                  knowledgeBase.uuid,
                  setting.uuid,
                  data
                );
                toast.success(t('settings.knowledgeBase.retrievalSettings.updateSuccess'));
                setEditingId(null);
                fetchRetrievalSettings();
                onUpdate();
              } catch (error: any) {
                console.error('Failed to update retrieval setting:', error);
                toast.error(
                  error.response?.data?.detail ||
                    t('settings.knowledgeBase.retrievalSettings.updateError')
                );
              }
            }}
            onDelete={() => handleDelete(setting)}
            onSetDefault={() => handleSetDefault(setting)}
            isDefault={setting.is_default}
          />
        ))}
      </div>

      {retrievalSettings.length === 0 && !editingId && (
        <Card>
          <Card.Body>
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('settings.knowledgeBase.retrievalSettings.noSettings')}
              </p>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

interface RetrievalSettingCardProps {
  setting: RetrievalSetting;
  knowledgeBase: KnowledgeBaseDetail;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: Partial<RetrievalSettingFormData>) => Promise<void>;
  onDelete: () => void;
  onSetDefault: () => void;
  isDefault: boolean;
}

const RetrievalSettingCard: React.FC<RetrievalSettingCardProps> = ({
  setting,
  knowledgeBase,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onSetDefault,
  isDefault,
}) => {
  const { t } = useTranslation();


  if (isEditing) {
    return (
      <RetrievalSettingForm
        knowledgeBase={knowledgeBase}
        initialData={setting}
        onSave={onSave}
        onCancel={onCancel}
        showCancel={true}
      />
    );
  }

  return (
    <Card className={isDefault ? 'border-2 border-primary' : ''}>
      <Card.Body>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-medium text-foreground">{setting.name}</h4>
              {isDefault && (
                <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-white">
                  {t('settings.knowledgeBase.retrievalSettings.default')}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                {t(`settings.knowledgeBase.retrievalSettings.types.${setting.retrieval_type}`)}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-muted-foreground md:grid-cols-4">
              <div>
                <span className="font-medium">{t('settings.knowledgeBase.retrievalSettings.topK')}:</span>{' '}
                {setting.top_k}
              </div>
              {setting.reranker_enabled && (
                <div>
                  <span className="font-medium">
                    {t('settings.knowledgeBase.retrievalSettings.reranker')}:
                  </span>{' '}
                  {t('settings.knowledgeBase.retrievalSettings.rerankerModel')}
                </div>
              )}
              {setting.retrieval_type === RetrievalType.HybridSearch && !setting.reranker_enabled && setting.hybrid_alpha && (
                <div>
                  <span className="font-medium">
                    {t('settings.knowledgeBase.retrievalSettings.hybridAlpha')}:
                  </span>{' '}
                  {setting.hybrid_alpha}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isDefault && (
              <button
                onClick={onSetDefault}
                className="rounded-md p-2 text-sm text-muted-foreground hover:text-foreground"
                title={t('settings.knowledgeBase.retrievalSettings.setAsDefault')}
              >
                <CheckIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onEdit}
              className="rounded-md p-2 text-muted-foreground hover:text-foreground"
              title={t('common.edit')}
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            {!isDefault && (
              <button
                onClick={onDelete}
                className="rounded-md p-2 text-muted-foreground hover:text-error"
                title={t('common.delete')}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default RetrievalSettingsManager;

