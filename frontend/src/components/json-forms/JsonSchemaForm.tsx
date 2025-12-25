import React, { useEffect, useState, useMemo, useCallback } from 'react';

import { SchemaField } from './fields/SchemaField';
import { JSONSchemaDefinition, ValidationError } from './types/schema';
import { resolveSchema } from './utils/schemaResolver';
import { validateValue } from './utils/validation';

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

  // Resolve $ref references in the schema
  // Pass the schema itself as root so $defs can be accessed
  const resolvedSchema = useMemo(() => {
    return resolveSchema(schema as any, schema as any);
  }, [schema]);

  // Store root schema with $defs for nested resolution
  const rootSchemaWithDefs = useMemo(() => {
    return schema as any;
  }, [schema]);

  // Helper function to get default value for a schema property
  const getPropertyDefault = useCallback((propSchema: JSONSchemaDefinition): any => {
    // Resolve schema to handle $ref - use root schema with $defs
    const resolved = resolveSchema(propSchema as any, rootSchemaWithDefs);
    
    // Explicit default takes precedence
    if (resolved.default !== undefined) {
      return resolved.default;
    }
    
    // For enum fields, use first enum value if no explicit default
    if (resolved.enum && resolved.enum.length > 0) {
      return resolved.enum[0];
    }
    
    // For nested objects, recursively get defaults
    if (resolved.type === 'object' && resolved.properties) {
      const nestedDefault: Record<string, any> = {};
      Object.entries(resolved.properties).forEach(([nestedKey, nestedSchema]) => {
        const nestedDefaultValue = getPropertyDefault(nestedSchema);
        if (nestedDefaultValue !== undefined) {
          nestedDefault[nestedKey] = nestedDefaultValue;
        }
      });
      if (Object.keys(nestedDefault).length > 0) {
        return nestedDefault;
      }
    }
    
    return undefined;
  }, [rootSchemaWithDefs]);

  // Initialize default values (skip for toggleable objects - they start empty)
  useEffect(() => {
    // In toggleable mode for objects, we want to start with {} and let user enable fields
    const isToggleableObject = resolvedSchema.type === 'object' && resolvedSchema.ui?.toggleable !== false;
    
    if (!isToggleableObject) {
      // Check if we need to initialize defaults
      const needsInitialization = 
        !value || // value is null/undefined
        (resolvedSchema.type === 'object' && 
         typeof value === 'object' && 
         !Array.isArray(value) && 
         Object.keys(value).length === 0); // value is empty object {}
      
      if (needsInitialization) {
        if (resolvedSchema.default !== undefined) {
          onChange(resolvedSchema.default);
        } else if (resolvedSchema.type === 'object' && resolvedSchema.properties) {
          // Initialize object with default values from properties
          const defaultValue: Record<string, any> = { ...(value || {}) };
          let hasDefaults = false;
          
          Object.entries(resolvedSchema.properties).forEach(([key, propSchema]) => {
            // Only set default if property is not already set
            if (defaultValue[key] === undefined) {
              const propDefault = getPropertyDefault(propSchema);
              if (propDefault !== undefined) {
                defaultValue[key] = propDefault;
                hasDefaults = true;
              }
            }
          });
          
          if (hasDefaults) {
            onChange(defaultValue);
          }
        }
      }
    }
  }, [resolvedSchema, onChange, value, getPropertyDefault]); // Only depend on resolved schema changes

  // Validate on value or schema changes
  useEffect(() => {
    if (value !== undefined) {
      // Only validate if we have a value
      const validationErrors = validateValue(value, resolvedSchema);
      setErrors(validationErrors);
      if (onError) {
        // Only call if onError exists
        onError(validationErrors);
      }
    }
  }, [value, resolvedSchema, onChange, onError]); // Remove onError from dependencies

  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <SchemaField
        schema={resolvedSchema}
        path={[]}
        value={value}
        onChange={handleChange}
        errors={errors}
        rootSchema={rootSchemaWithDefs}
      />
    </div>
  );
};
