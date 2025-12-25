import React, { useMemo } from 'react';

import { FieldProps } from '../types/schema';
import { resolveSchema } from '../utils/schemaResolver';

import { SchemaField } from './SchemaField';

export const ArrayField: React.FC<FieldProps> = ({
  schema,
  path,
  value = [],
  onChange,
  errors = [],
  rootSchema,
}) => {
  // Resolve $ref in items schema
  const resolvedItemsSchema = useMemo(() => {
    if (!schema.items) return null;
    return resolveSchema(schema.items as any, rootSchema);
  }, [schema.items, rootSchema]);

  const handleItemChange = (index: number) => (itemValue: any) => {
    const newValue = [...value];
    newValue[index] = itemValue;
    onChange(newValue);
  };

  const handleAddItem = () => {
    if (!resolvedItemsSchema) return;
    
    let defaultValue: any;
    if (resolvedItemsSchema.default !== undefined) {
      defaultValue = resolvedItemsSchema.default;
    } else if (resolvedItemsSchema.type === 'object') {
      // Initialize object - handle both properties and additionalProperties
      defaultValue = {};
      
      // Initialize defined properties
      if (resolvedItemsSchema.properties) {
        Object.keys(resolvedItemsSchema.properties).forEach(key => {
          const propSchema = resolvedItemsSchema!.properties![key];
          if (propSchema.default !== undefined) {
            defaultValue[key] = propSchema.default;
          } else if (propSchema.type === 'string') {
            defaultValue[key] = '';
          } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
            defaultValue[key] = 0;
          } else if (propSchema.type === 'boolean') {
            defaultValue[key] = false;
          } else if (propSchema.type === 'array') {
            defaultValue[key] = [];
          } else if (propSchema.type === 'object') {
            defaultValue[key] = {};
          }
        });
      }
      
      // For additionalProperties: true, start with empty object
      // The DynamicObjectField will handle adding properties
    } else if (resolvedItemsSchema.type === 'string') {
      defaultValue = '';
    } else if (resolvedItemsSchema.type === 'number' || resolvedItemsSchema.type === 'integer') {
      defaultValue = 0;
    } else if (resolvedItemsSchema.type === 'boolean') {
      defaultValue = false;
    } else if (resolvedItemsSchema.type === 'array') {
      defaultValue = [];
    } else {
      defaultValue = null;
    }
    const newValue = [...value, defaultValue];
    onChange(newValue);
  };

  const handleRemoveItem = (index: number) => {
    const newValue = value.filter((_: any, i: number) => i !== index);
    onChange(newValue);
  };

  if (!schema.items || !resolvedItemsSchema) {
    return null;
  }

  return (
    <div className="space-y-2">
      {(schema.title || schema.description) && (
        <div className="mb-2">
          {schema.title && <h4 className="text-sm font-medium text-foreground">{schema.title}</h4>}
          {schema.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{schema.description}</p>
          )}
        </div>
      )}
      <div className="space-y-3">
        {value.map((item: any, index: number) => (
          <div key={index} className="relative rounded-lg border border-border bg-card p-3 pe-10">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Item {index + 1}
              </span>
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
                className="p-0.5 text-muted-foreground transition-colors hover:text-error"
                title="Remove item"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            </div>
            <SchemaField
              schema={resolvedItemsSchema}
              path={[...path, index.toString()]}
              value={item ?? (resolvedItemsSchema.type === 'object' ? {} : null)}
              onChange={handleItemChange(index)}
              errors={errors.filter(error => error.path[path.length] === index.toString())}
              rootSchema={rootSchema}
            />
          </div>
        ))}
      </div>
      {(!schema.maxItems || value.length < schema.maxItems) && (
        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center rounded-md border border-input-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <svg className="me-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      )}
    </div>
  );
};
