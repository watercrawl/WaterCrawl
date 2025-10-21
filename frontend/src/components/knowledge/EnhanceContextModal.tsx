import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { knowledgeBaseApi } from '../../services/api/knowledgeBase';
import { toast } from 'react-hot-toast';
import { KnowledgeBaseContextAwareEnhanceData } from '../../types/knowledge';
import { AxiosError } from 'axios';

interface EnhanceContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnhance: (enhancedText: string) => void;
  initialContext: string;
  providerConfigId: string;
  modelId: string;
  temperature: number | null;
}

export const EnhanceContextModal: React.FC<EnhanceContextModalProps> = ({
  isOpen,
  onClose,
  onEnhance,
  initialContext,
  providerConfigId,
  modelId,
  temperature,
}) => {
  const { t } = useTranslation();
  const [context, setContext] = useState(initialContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContext(initialContext);
      setIsEnhanced(false);
    }
  }, [initialContext, isOpen]);

  const handleEnhance = async () => {
    if (!providerConfigId || !modelId) {
      toast.error(t('knowledgeBase.enhance.selectProviderFirst'));
      return;
    }

    setIsLoading(true);
    toast.loading(t('knowledgeBase.enhance.enhancing'));

    try {
      const data: KnowledgeBaseContextAwareEnhanceData = {
        provider_config_id: providerConfigId,
        llm_model_id: modelId,
        content: context,
        temperature: temperature,
      };
      const response = await knowledgeBaseApi.enhanceContextAware(data);
      toast.dismiss();
      toast.success(t('knowledgeBase.enhance.success'));
      setContext(response.content);
      setIsEnhanced(true);
    } catch (error) {
      toast.dismiss();
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || t('knowledgeBase.enhance.error'));
      } else {
        toast.error(t('knowledgeBase.enhance.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onEnhance(context);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('knowledgeBase.enhance.title')}
      footer={
        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          {isEnhanced ? (
            <Button onClick={handleApply} disabled={isLoading}>
              {t('knowledgeBase.enhance.useEnhanced')}
            </Button>
          ) : (
            <Button onClick={handleEnhance} loading={isLoading} disabled={!context.trim()}>
              {t('knowledgeBase.enhance.enhance')}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('knowledgeBase.enhance.description')}</p>
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          rows={10}
          className="w-full rounded-md border border-input-border bg-card p-2 focus:border-primary focus:ring-primary"
          placeholder={t('knowledgeBase.enhance.placeholder')}
        />
      </div>
    </Modal>
  );
};
