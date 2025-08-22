import React, { useState, useEffect } from 'react';
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
      toast.error('Please select a summarization provider and model first.');
      return;
    }

    setIsLoading(true);
    toast.loading('Enhancing context...');

    try {
      const data: KnowledgeBaseContextAwareEnhanceData = {
        provider_config_id: providerConfigId,
        llm_model_id: modelId,
        content: context,
        temperature: temperature
      };
      const response = await knowledgeBaseApi.enhanceContextAware(data);
      toast.dismiss();
      toast.success('Context enhanced successfully!');
      setContext(response.content);
      setIsEnhanced(true);
    } catch (error) {
      toast.dismiss();
      if(error instanceof AxiosError){
        toast.error(error.response?.data?.message || 'Failed to enhance context. Please try again.');
      }else{
        toast.error('Failed to enhance context. Please try again.');
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
      title="Enhance Summarizer Context"
      footer={
        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {isEnhanced ? (
            <Button onClick={handleApply} disabled={isLoading}>
              Use Enhanced Text
            </Button>
          ) : (
            <Button onClick={handleEnhance} loading={isLoading} disabled={!context.trim()}>
              Enhance
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You can edit your context below, or click 'Enhance' to have our AI improve it for you.
        </p>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={10}
          className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
          placeholder="e.g., This knowledge base contains technical documentation for our product..."
        />
      </div>
    </Modal>
  );
};