import React, { useEffect } from 'react';
import { FieldProps } from '../types/schema';
import { SchemaField } from './SchemaField';
import { SwitchWidget } from '../widgets/SwitchWidget';

export const ObjectField: React.FC<FieldProps> = ({
  schema,
  path,
  value = {},
  onChange,
  errors = [],
}) => {
  // Initialize default values for properties
  useEffect(() => {
    if (schema.properties && Object.keys(value).length === 0) {
      const defaultValue: Record<string, any> = { ...value };
      let hasDefaults = false;

      Object.entries(schema.properties).forEach(([key, propSchema]) => {
        if (!(key in defaultValue) && propSchema.default !== undefined) {
          defaultValue[key] = propSchema.default;
          hasDefaults = true;
        }
      });

      if (hasDefaults) {
        onChange(defaultValue);
      }
    }
  }, [schema.properties, value, onChange]);

  const handlePropertyChange = (propertyName: string) => (propertyValue: any) => {
    const newValue = {
      ...value,
      [propertyName]: propertyValue,
    };
    onChange(newValue);
  };

  if (!schema.properties) {
    return null;
  }

  const isRootObject = path.length === 0;
  const isPluginObject = path.length === 1;
  const hasIsActive = schema.properties.is_active;

  if (isPluginObject && hasIsActive) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex-1">
            {schema.title && (
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                {schema.title}
              </h3>
            )}
            {schema.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {schema.description}
              </p>
            )}
          </div>
          <div className="ml-4">
            <SwitchWidget
              schema={schema.properties.is_active}
              path={[...path, 'is_active']}
              value={value?.is_active || false}
              onChange={handlePropertyChange('is_active')}
              errors={errors.filter(error => error.path[path.length] === 'is_active')}
            />
          </div>
        </div>
        {value?.is_active && (
          <div className="space-y-6 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
            {Object.entries(schema.properties)
              .filter(([propertyName]) => propertyName !== 'is_active')
              .map(([propertyName, propertySchema]) => (
                <SchemaField
                  key={propertyName}
                  schema={propertySchema}
                  path={[...path, propertyName]}
                  value={value?.[propertyName]}
                  onChange={handlePropertyChange(propertyName)}
                  errors={errors.filter(error => error.path[path.length] === propertyName)}
                  required={schema.required?.includes(propertyName)}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(schema.title || schema.description) && !isRootObject && (
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          {schema.title && (
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {schema.title}
            </h3>
          )}
          {schema.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {schema.description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-6">
        {Object.entries(schema.properties).map(([propertyName, propertySchema]) => (
          <SchemaField
            key={propertyName}
            schema={propertySchema}
            path={[...path, propertyName]}
            value={value?.[propertyName]}
            onChange={handlePropertyChange(propertyName)}
            errors={errors.filter(error => error.path[path.length] === propertyName)}
            required={schema.required?.includes(propertyName)}
          />
        ))}
      </div>
    </div>
  );
};
