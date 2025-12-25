import React, { useState, useCallback, useMemo } from 'react';

import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

import { FieldProps } from '../types/schema';
import { resolveSchema } from '../utils/schemaResolver';

import { SchemaField } from './SchemaField';

/**
 * A field for objects with additionalProperties: true
 * Allows users to add/remove arbitrary key-value pairs
 */
export const DynamicObjectField: React.FC<FieldProps> = ({
  schema,
  path,
  value = {},
  onChange,
  errors = [],
  rootSchema,
}) => {
  const [newKey, setNewKey] = useState('');

  // Resolve schema to handle $ref
  const resolvedSchema = useMemo(() => {
    return resolveSchema(schema as any, rootSchema);
  }, [schema, rootSchema]);

  const handleAddProperty = useCallback(() => {
    if (!newKey.trim()) return;
    
    const currentValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const updated = { ...currentValue, [newKey.trim()]: '' };
    onChange(updated);
    setNewKey('');
  }, [newKey, value, onChange]);

  const handleRemoveProperty = useCallback((key: string) => {
    const currentValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const updated = { ...currentValue };
    delete updated[key];
    onChange(updated);
  }, [value, onChange]);

  const handlePropertyChange = useCallback((key: string) => (propertyValue: any) => {
    const currentValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    onChange({ ...currentValue, [key]: propertyValue });
  }, [value, onChange]);

  const objectValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};

  // Determine the schema for property values
  // If additionalProperties is a schema, use it; otherwise default to string
  const propertySchema = typeof resolvedSchema.additionalProperties === 'object'
    ? resolvedSchema.additionalProperties
    : { type: 'string' as const };

  return (
    <div className="space-y-3">
      {(schema.title || schema.description) && (
        <div className="mb-2">
          {schema.title && <h4 className="text-sm font-medium text-foreground">{schema.title}</h4>}
          {schema.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{schema.description}</p>
          )}
        </div>
      )}

      {/* Existing properties */}
      {Object.keys(objectValue).length > 0 && (
        <div className="space-y-2">
          {Object.entries(objectValue).map(([key, val]) => (
            <div key={key} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <code className="text-xs font-semibold text-foreground bg-muted/50 px-2 py-1 rounded">
                    {key}
                  </code>
                </div>
                <SchemaField
                  schema={propertySchema}
                  path={[...path, key]}
                  value={val}
                  onChange={handlePropertyChange(key)}
                  errors={errors.filter(error => error.path[path.length] === key)}
                  rootSchema={rootSchema}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveProperty(key)}
                className="mt-1 p-1 text-muted-foreground hover:text-error transition-colors"
                title="Remove property"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new property */}
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddProperty();
            }
          }}
          placeholder="Property name"
          className="flex-1 rounded-md border border-input-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleAddProperty}
          disabled={!newKey.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
};
