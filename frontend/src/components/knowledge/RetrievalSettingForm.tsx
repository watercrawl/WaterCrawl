import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import {
  Square3Stack3DIcon,
  Bars3Icon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

import Card from '../shared/Card';
import ModelSelector from '../shared/ModelSelector';
import OptionCard from '../shared/OptionCard';
import { Switch } from '../shared/Switch';

import {
  RetrievalSettingFormData,
  RetrievalType,
  KnowledgeBaseDetail,
} from '../../types/knowledge';
import { ListProviderConfig } from '../../types/provider';

interface RetrievalSettingFormProps {
  knowledgeBase?: KnowledgeBaseDetail | null;
  providers?: ListProviderConfig[];
  initialData?: Partial<RetrievalSettingFormData>;
  onSave: (data: Partial<RetrievalSettingFormData>) => Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
  compact?: boolean;
  onChange?: (data: Partial<RetrievalSettingFormData>) => void;
}

const RetrievalSettingForm: React.FC<RetrievalSettingFormProps> = ({
  knowledgeBase,
  initialData,
  onSave,
  onCancel,
  showCancel = true,
  compact = false,
  onChange,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<RetrievalSettingFormData>>({
    name: initialData?.name || '',
    retrieval_type: initialData?.retrieval_type || RetrievalType.FullTextSearch,
    is_default: initialData?.is_default || false,
    reranker_enabled: initialData?.reranker_enabled || false,
    reranker_model_key: initialData?.reranker_model_key || null,
    reranker_provider_config_id: initialData?.reranker_provider_config_id || null,
    reranker_model_config: initialData?.reranker_model_config || {},
    top_k: initialData?.top_k || 3,
    hybrid_alpha: initialData?.hybrid_alpha ?? (initialData?.reranker_enabled ? null : 0.7),
  });
  const [isSaving, setIsSaving] = useState(false);

  const hasEmbeddings = !!knowledgeBase?.embedding_provider_config;
  const canUseVectorSearch = hasEmbeddings;


  // Notify parent of changes if onChange callback is provided (for embedded forms)
  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate reranker model is selected when reranker is enabled
    if (formData.reranker_enabled && !formData.reranker_model_key) {
      // The ModelSelector component should handle this, but we add a check here as well
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const formContent = (
    <form 
      onSubmit={showCancel ? handleSubmit : (e) => { e.preventDefault(); e.stopPropagation(); }} 
      className="space-y-8"
    >
      {/* Name Field */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('settings.knowledgeBase.retrievalSettings.name')}
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
          className="block w-full rounded-md border border-input-border bg-input px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={t('settings.knowledgeBase.retrievalSettings.namePlaceholder')}
        />
      </div>

      {/* Retrieval Type Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          {t('settings.knowledgeBase.retrievalSettings.retrievalType')}
        </label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <OptionCard
            title={t('settings.knowledgeBase.retrievalSettings.types.vector_search')}
            description={t('settings.knowledgeBase.retrievalSettings.descriptions.vector_search')}
            icon={<Square3Stack3DIcon className="h-3 w-3 text-primary" />}
            isSelected={formData.retrieval_type === RetrievalType.VectorSearch}
            onClick={() => {
              if (canUseVectorSearch) {
                setFormData({ ...formData, retrieval_type: RetrievalType.VectorSearch });
              }
            }}
            iconBgColor={canUseVectorSearch ? "bg-primary-soft" : "bg-muted"}
            iconDarkBgColor=""
          />
          <OptionCard
            title={t('settings.knowledgeBase.retrievalSettings.types.full_text_search')}
            description={t('settings.knowledgeBase.retrievalSettings.descriptions.full_text_search')}
            icon={<Bars3Icon className="h-3 w-3 text-muted-foreground" />}
            isSelected={formData.retrieval_type === RetrievalType.FullTextSearch}
            onClick={() => setFormData({ ...formData, retrieval_type: RetrievalType.FullTextSearch })}
            iconBgColor="bg-muted"
            iconDarkBgColor=""
          />
          <OptionCard
            title={t('settings.knowledgeBase.retrievalSettings.types.hybrid_search')}
            description={t('settings.knowledgeBase.retrievalSettings.descriptions.hybrid_search')}
            icon={<CheckCircleIcon className="h-3 w-3 text-success" />}
            isSelected={formData.retrieval_type === RetrievalType.HybridSearch}
            onClick={() => {
              if (canUseVectorSearch) {
                setFormData({ ...formData, retrieval_type: RetrievalType.HybridSearch });
              }
            }}
            iconBgColor={canUseVectorSearch ? "bg-success-soft" : "bg-muted"}
            iconDarkBgColor=""
            badge={canUseVectorSearch ? {
              text: t('common.recommended'),
              color: 'primary',
            } : undefined}
          />
        </div>
        {!canUseVectorSearch && (
          <div className="mt-3 rounded-md border-s-4 border-warning-strong bg-warning-soft p-3">
            <p className="text-sm text-warning-strong">
              {t('settings.knowledgeBase.retrievalSettings.embeddingRequired')}
            </p>
          </div>
        )}
      </div>

      {/* Hybrid Alpha - Only for hybrid search and when reranker is disabled */}
      {formData.retrieval_type === RetrievalType.HybridSearch && !formData.reranker_enabled && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-foreground">
              {t('settings.knowledgeBase.retrievalSettings.hybridAlpha')}
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('settings.knowledgeBase.retrievalSettings.hybridAlphaHelp')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center w-20 shrink-0">
              <span className="text-xs font-semibold text-primary mb-1">SEMANTIC</span>
              <span className="text-base font-bold text-primary">
                {formData.hybrid_alpha?.toFixed(1) || '0.7'}
              </span>
            </div>
            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.hybrid_alpha || 0.7}
                onChange={e => {
                  const value = parseFloat(e.target.value);
                  const clampedValue = Math.max(0.1, Math.min(0.9, value));
                  setFormData({ 
                    ...formData, 
                    hybrid_alpha: clampedValue,
                    // Disable reranker when hybrid_alpha is set (mutually exclusive)
                    reranker_enabled: false,
                  });
                }}
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer relative z-10"
                style={{
                  background: `linear-gradient(to right, 
                    rgb(var(--primary)) 0%, 
                    rgb(var(--primary)) ${((formData.hybrid_alpha || 0.7) * 100)}%, 
                    rgb(var(--success)) ${((formData.hybrid_alpha || 0.7) * 100)}%, 
                    rgb(var(--success)) 100%)`
                }}
              />
            </div>
            <div className="flex flex-col items-center w-20 shrink-0">
              <span className="text-xs font-semibold text-success mb-1">KEYWORD</span>
              <span className="text-base font-bold text-success">
                {(1 - (formData.hybrid_alpha || 0.7)).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Settings Grid: Top K and Reranker */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Top K */}
          <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Bars3Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <label className="text-sm font-semibold text-foreground">
                    {t('settings.knowledgeBase.retrievalSettings.topK')}
                  </label>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <span className="text-lg font-bold text-foreground">{formData.top_k || 3}</span>
                </div>
              </div>
              <div className="mb-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.top_k || 3}
                  onChange={e => setFormData({ ...formData, top_k: parseInt(e.target.value) })}
                  className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary transition-all hover:accent-primary-hover"
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t('settings.knowledgeBase.retrievalSettings.topKHelp')}
              </p>
            </div>
          </div>

          {/* Reranker Section */}
          <div className="group relative overflow-visible rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Square3Stack3DIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <label className="text-sm font-semibold text-foreground">
                    {t('settings.knowledgeBase.retrievalSettings.rerankerEnabled')}
                  </label>
                </div>
                <Switch
                  label=""
                  description=""
                  checked={formData.reranker_enabled || false}
                  onChange={checked => setFormData({ 
                    ...formData, 
                    reranker_enabled: checked,
                    // Clear hybrid_alpha when reranker is enabled (mutually exclusive)
                    hybrid_alpha: checked ? null : (formData.hybrid_alpha ?? 0.7),
                  })}
                />
              </div>
              
              {/* Reranker Model - Always show, but disabled when reranker is off */}
              <div className={`pt-4 border-t border-border ${!formData.reranker_enabled ? 'opacity-50' : ''}`}>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {t('settings.knowledgeBase.retrievalSettings.rerankerModel')} 
                  <span className="text-error ml-1">*</span>
                </label>
                <ModelSelector
                  modelType="reranker"
                  initialProviderConfigId={formData.reranker_provider_config_id || null}
                  initialModelKey={formData.reranker_model_key || null}
                  initialModelConfig={formData.reranker_model_config || {}}
                  onChange={(values) => {
                    setFormData({
                      ...formData,
                      reranker_provider_config_id: values.provider_config_id,
                      reranker_model_key: values.model_key,
                      reranker_model_config: values.model_config,
                    });
                  }}
                  disabled={!formData.reranker_enabled}
                  label=""
                  placeholder={t('settings.knowledgeBase.retrievalSettings.rerankerModel')}
                  required={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Is Default */}
      {!initialData?.is_default && showCancel && (
        <div>
          <Switch
            label={t('settings.knowledgeBase.retrievalSettings.setAsDefault')}
            description={t('settings.knowledgeBase.retrievalSettings.setAsDefaultHelp')}
            checked={formData.is_default || false}
            onChange={checked => setFormData({ ...formData, is_default: checked })}
          />
        </div>
      )}

      {/* Actions */}
      {showCancel && (
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {t('common.cancel')}
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving || !formData.name}
            className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      )}
    </form>
  );

  if (compact) {
    return <div className="space-y-6">{formContent}</div>;
  }

  return (
    <Card>
      <Card.Body>{formContent}</Card.Body>
    </Card>
  );
};

export default RetrievalSettingForm;
