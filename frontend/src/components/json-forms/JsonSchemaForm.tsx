import React, { useEffect, useState } from 'react';
import { JSONSchemaDefinition, ValidationError } from './types/schema';
import { validateValue } from './utils/validation';
import { SchemaField } from './fields/SchemaField';

interface JsonSchemaFormProps {
  schema: JSONSchemaDefinition;
  value?: any;
  onChange: (value: any) => void;
  onError?: (errors: ValidationError[]) => void;
}

export const JsonSchemaForm: React.FC<JsonSchemaFormProps> = ({
  schema,
  value,
  onChange,
  onError,
}) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Initialize default values
  useEffect(() => {
    if (!value) {  // Only run if value is null/undefined
      if (schema.default !== undefined) {
        onChange(schema.default);
      } else if (schema.type === 'object' && schema.properties) {
        // Initialize empty object with default values from properties
        const defaultValue: Record<string, any> = {};
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
          if (propSchema.default !== undefined) {
            defaultValue[key] = propSchema.default;
          } else if (propSchema.type === 'object' && propSchema.properties) {
            // Recursively initialize nested objects
            const nestedDefault: Record<string, any> = {};
            Object.entries(propSchema.properties).forEach(([nestedKey, nestedSchema]) => {
              if (nestedSchema.default !== undefined) {
                nestedDefault[nestedKey] = nestedSchema.default;
              }
            });
            if (Object.keys(nestedDefault).length > 0) {
              defaultValue[key] = nestedDefault;
            }
          }
        });
        if (Object.keys(defaultValue).length > 0) {
          onChange(defaultValue);
        }
      }
    }
  }, [schema]); // Only depend on schema changes

  // Validate on value or schema changes
  useEffect(() => {
    if (value !== undefined) {  // Only validate if we have a value
      const validationErrors = validateValue(value, schema);
      setErrors(validationErrors);
      if (onError) {  // Only call if onError exists
        onError(validationErrors);
      }
    }
  }, [value, schema]);  // Remove onError from dependencies

  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  return (
    <div className="space-y-6">
      <SchemaField
        schema={schema}
        path={[]}
        value={value}
        onChange={handleChange}
        errors={errors}
      />
    </div>
  );
};
