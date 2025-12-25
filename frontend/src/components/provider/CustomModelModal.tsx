import React, { useEffect, useState, useRef } from 'react';

import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';


import {
  ParameterSchemaBuilder,
  parametersToJsonSchema,
  jsonSchemaToParameters,
} from '../json-forms/builder';
import Button from '../shared/Button';
import { FormInput } from '../shared/FormInput';
import Modal from '../shared/Modal';

import {
  ModelType,
  ProviderConfigModel,
  CreateCustomModelRequest,
  UpdateCustomModelRequest,
} from '../../types/provider';
import { yamlToCustomModel } from '../../utils/modelYamlConverter';

import type { ParameterDefinition } from '../json-forms/builder';


interface CustomModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCustomModelRequest | UpdateCustomModelRequest) => void;
  editingModel?: ProviderConfigModel | null;
}

interface CustomModelFormData {
  model_key: string;
  model_type: ModelType;
  label: string;
  features?: string;
}

const CustomModelModal: React.FC<CustomModelModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingModel,
}) => {
  const { t } = useTranslation();
  const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const schema = yup.object().shape({
    model_key: yup.string().required(t('providerConfig.form.modelKeyRequired')),
    model_type: yup
      .string()
      .oneOf(['llm', 'embedding', 'reranker'])
      .required(t('providerConfig.form.modelTypeRequired')),
    label: yup.string().required(t('providerConfig.form.labelRequired')),
    features: yup.string(),
  });

  const methods = useForm<CustomModelFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      model_key: '',
      model_type: 'llm',
      label: '',
      features: '',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  useEffect(() => {
    if (editingModel) {
      reset({
        model_key: editingModel.model_key,
        model_type: editingModel.model_type,
        label: editingModel.label,
        features: editingModel.custom_config?.features?.join(', ') || '',
      });
      // Load existing parameters schema
      if (editingModel.custom_config?.parameters_schema) {
        const existingParams = jsonSchemaToParameters(
          editingModel.custom_config.parameters_schema as Record<string, unknown>
        );
        setParameters(existingParams);
      } else {
        setParameters([]);
      }
    } else {
      reset({
        model_key: '',
        model_type: 'llm',
        label: '',
        features: '',
      });
      setParameters([]);
    }
  }, [editingModel, reset]);

  const handleLoadFromYaml = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const yamlContent = e.target?.result as string;
        const modelData = yamlToCustomModel(yamlContent);

        // Populate form with loaded data
        reset({
          model_key: modelData.model_key || '',
          model_type: modelData.model_type || 'llm',
          label: modelData.label || '',
          features: modelData.features?.join(', ') || '',
        });

        // Load parameters if they exist
        if (modelData.parameters_schema) {
          const loadedParams = jsonSchemaToParameters(
            modelData.parameters_schema as Record<string, unknown>
          );
          setParameters(loadedParams);
        } else {
          setParameters([]);
        }

        toast.success(t('providerConfig.models.yamlLoaded'));
      } catch (error) {
        console.error('Error loading YAML:', error);
        toast.error(t('providerConfig.models.yamlLoadError'));
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = (data: CustomModelFormData) => {
    const features = data.features
      ? data.features.split(',').map(f => f.trim()).filter(Boolean)
      : [];

    // Generate parameters schema from builder
    const parametersSchema = parameters.length > 0
      ? parametersToJsonSchema(parameters)
      : undefined;

    if (editingModel) {
      const updateData: UpdateCustomModelRequest = {
        label: data.label,
        features,
        parameters_schema: parametersSchema,
      };
      onSubmit(updateData);
    } else {
      const createData: CreateCustomModelRequest = {
        model_key: data.model_key,
        model_type: data.model_type,
        label: data.label,
        features,
        parameters_schema: parametersSchema,
      };
      onSubmit(createData);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingModel
          ? t('providerConfig.form.editCustomModel')
          : t('providerConfig.form.addCustomModel')
      }
      size="4xl"
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {!editingModel && (
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={handleLoadFromYaml}
                className="inline-flex items-center rounded-md border border-input-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <ArrowUpTrayIcon className="-ms-0.5 me-1.5 h-4 w-4" />
                {t('providerConfig.models.loadFromYaml')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".yml,.yaml"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          <FormInput
            type="text"
            label={t('providerConfig.form.modelKey')}
            name="model_key"
            error={errors.model_key?.message}
            disabled={!!editingModel}
            placeholder="gpt-4-custom"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('providerConfig.form.modelType')}
            </label>
            <select
              {...register('model_type')}
              disabled={!!editingModel}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              <option value="llm">{t('providerConfig.models.llmModels')}</option>
              <option value="embedding">{t('providerConfig.models.embeddingModels')}</option>
              <option value="reranker">{t('providerConfig.models.rerankerModels')}</option>
            </select>
            {errors.model_type && (
              <p className="mt-1 text-sm text-error">{errors.model_type.message}</p>
            )}
          </div>

          <FormInput
            type="text"
            label={t('providerConfig.form.label')}
            name="label"
            error={errors.label?.message}
            placeholder="Custom GPT-4"
          />

          <FormInput
            type="text"
            label={t('providerConfig.form.features')}
            name="features"
            error={errors.features?.message}
            placeholder="chat, vision, function_calling"
          />
          <p className="text-xs text-muted-foreground">
            {t('providerConfig.models.featuresHint', 'Comma-separated list of features')}
          </p>

          {/* Parameters Schema Builder */}
          <div className="border-t border-border pt-4 mt-4">
            <ParameterSchemaBuilder
              value={parameters}
              onChange={setParameters}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
};

export default CustomModelModal;
