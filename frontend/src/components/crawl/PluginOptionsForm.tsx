import { useTranslation } from 'react-i18next';

import { JsonSchemaForm } from '../json-forms/JsonSchemaForm';
import { JSONSchemaDefinition } from '../json-forms/types/schema';
import { OptionGroup } from '../shared/FormComponents';

interface PluginOptionsFormProps {
  onChange: (formData: any) => void;
  onValidation: (hasErrors: boolean) => void;
  schema: JSONSchemaDefinition | null;
  value: any;
}

export default function PluginOptionsForm({
  onChange,
  onValidation,
  schema,
  value,
}: PluginOptionsFormProps) {
  const { t } = useTranslation();

  if (!schema) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('plugin.loadingOptions')}</div>
      </div>
    );
  }

  return (
    <OptionGroup title={t('plugin.configuration')} description={t('plugin.configureSettings')}>
      <div className="ltr">
        <JsonSchemaForm
          schema={schema}
          value={value}
          onChange={onChange}
          onError={errors => {
            if (errors.length > 0) {
              console.log('Validation errors:', errors);
            }
            onValidation(errors.length > 0);
          }}
        />
      </div>
    </OptionGroup>
  );
}
