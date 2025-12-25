import React, { useCallback, useMemo, useState } from 'react';

import { QuestionMarkCircleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

import { FieldProps, JSONSchemaDefinition } from '../types/schema';
import { resolveSchema } from '../utils/schemaResolver';
import { SwitchWidget } from '../widgets/SwitchWidget';

import { DynamicObjectField } from './DynamicObjectField';
import { SchemaField } from './SchemaField';

interface ToggleableFieldProps {
  propertyName: string;
  propertySchema: JSONSchemaDefinition;
  isActive: boolean;
  value: any;
  onToggle: (active: boolean) => void;
  onValueChange: (value: any) => void;
  errors: any[];
  required?: boolean;
  path: string[];
  rootSchema?: JSONSchemaDefinition & { $defs?: Record<string, JSONSchemaDefinition> };
}

/**
 * A field wrapper that adds a toggle switch to activate/deactivate the field.
 * Only includes the value in the output when active.
 */
const ToggleableField: React.FC<ToggleableFieldProps> = ({
  propertyName,
  propertySchema,
  isActive,
  value,
  onToggle,
  onValueChange,
  errors,
  required,
  path,
  rootSchema,
}) => {
  // Get the default value to use when toggling on
  const defaultValue = useMemo(() => {
    if (propertySchema.default !== undefined) return propertySchema.default;
    if (propertySchema.minimum !== undefined) return propertySchema.minimum;
    if (propertySchema.type === 'number' || propertySchema.type === 'integer') return 0;
    if (propertySchema.type === 'string') return '';
    if (propertySchema.type === 'boolean') return false;
    if (propertySchema.enum && propertySchema.enum.length > 0) return propertySchema.enum[0];
    return undefined;
  }, [propertySchema]);

  const handleToggle = useCallback(
    (active: boolean) => {
      onToggle(active);
      if (active && value === undefined) {
        // Initialize with default value when toggling on
        onValueChange(defaultValue);
      }
    },
    [onToggle, onValueChange, value, defaultValue]
  );

  return (
    <div className="flex items-center gap-2">
      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        onClick={() => handleToggle(!isActive)}
        className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
          isActive ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${
            isActive ? 'translate-x-3' : 'translate-x-0'
          }`}
        />
      </button>

      {/* Label with tooltip */}
      <div className="flex items-center gap-1 min-w-[100px]">
        <label className="text-sm font-medium text-foreground">
          {propertySchema.title || propertyName}
        </label>
        {propertySchema.description && (
          <div className="group relative">
            <QuestionMarkCircleIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            <div className="absolute bottom-full start-0 z-10 mb-1.5 hidden w-max max-w-[200px] rounded-md bg-foreground px-2 py-1.5 text-xs text-background shadow-lg group-hover:block">
              {propertySchema.description}
            </div>
          </div>
        )}
      </div>

      {/* Field input */}
      <div className={`flex-1 ${isActive ? '' : 'opacity-40 pointer-events-none'}`}>
        <SchemaField
          schema={{ ...propertySchema, title: undefined, description: undefined }}
          path={[...path, propertyName]}
          value={isActive ? value : defaultValue}
          onChange={onValueChange}
          errors={errors}
          required={required}
          rootSchema={rootSchema}
        />
      </div>
    </div>
  );
};

export const ObjectField: React.FC<FieldProps> = ({
  schema,
  path,
  value = {},
  onChange,
  errors = [],
  rootSchema,
}) => {
  // Ensure value is always an object
  const objectValue = useMemo(() => {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }, [value]);

  // Track which properties are active (for root-level toggleable mode)
  const [activeProperties, setActiveProperties] = useState<Set<string>>(() => {
    // Initialize active properties from existing value
    if (objectValue && typeof objectValue === 'object') {
      return new Set(Object.keys(objectValue));
    }
    return new Set();
  });

  // Track new key for additional properties
  const [newKey, setNewKey] = useState('');

  // Resolve schema to handle $ref
  const resolvedSchema = useMemo(() => {
    return resolveSchema(schema as any, rootSchema);
  }, [schema, rootSchema]);

  const handlePropertyChange = (propertyName: string) => (propertyValue: any) => {
    const newValue = {
      ...objectValue,
      [propertyName]: propertyValue,
    };
    onChange(newValue);
  };

  const handleAddAdditionalProperty = useCallback(() => {
    if (!newKey.trim()) return;
    
    const updated = { ...objectValue, [newKey.trim()]: '' };
    onChange(updated);
    setNewKey('');
  }, [newKey, objectValue, onChange]);

  const handleRemoveProperty = useCallback((key: string) => {
    const updated = { ...objectValue };
    delete updated[key];
    onChange(updated);
  }, [objectValue, onChange]);

  const handlePropertyToggle = useCallback(
    (propertyName: string, active: boolean) => {
      setActiveProperties(prev => {
        const next = new Set(prev);
        if (active) {
          next.add(propertyName);
        } else {
          next.delete(propertyName);
        }
        return next;
      });

      // Update value: add or remove property
      if (active) {
        // Property will be set when value is changed
      } else {
        // Remove property from value
        const newValue = { ...objectValue };
        delete newValue[propertyName];
        onChange(newValue);
      }
    },
    [objectValue, onChange]
  );

  // Handle objects with additionalProperties: true but no defined properties
  if ((resolvedSchema.additionalProperties === true || typeof resolvedSchema.additionalProperties === 'object') && !resolvedSchema.properties) {
    return <DynamicObjectField schema={resolvedSchema} path={path} value={value} onChange={onChange} errors={errors} rootSchema={rootSchema} />;
  }

  if (!resolvedSchema.properties) {
    return null;
  }

  const isRootObject = path.length === 0;
  const isPluginObject = path.length === 1;
  const hasIsActive = resolvedSchema.properties.is_active;
  
  // Check if this is an LLM config object (root with toggleable fields)
  // UI option to enable toggleable mode
  const isToggleableMode = isRootObject && resolvedSchema.ui?.toggleable !== false;

  if (isPluginObject && hasIsActive) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex-1">
            {resolvedSchema.title && (
              <h3 className="text-sm font-medium text-foreground">{resolvedSchema.title}</h3>
            )}
            {resolvedSchema.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{resolvedSchema.description}</p>
            )}
          </div>
          <div className="ms-3">
            <SwitchWidget
              schema={resolvedSchema.properties.is_active}
              path={[...path, 'is_active']}
              value={objectValue?.is_active || false}
              onChange={handlePropertyChange('is_active')}
              errors={errors.filter(error => error.path[path.length] === 'is_active')}
            />
          </div>
        </div>
        {objectValue?.is_active && (
          <div className="space-y-3 border-s-2 border-border ps-3">
            {Object.entries(resolvedSchema.properties)
              .filter(([propertyName]) => propertyName !== 'is_active')
              .map(([propertyName, propertySchema]) => (
                <SchemaField
                  key={propertyName}
                  schema={propertySchema}
                  path={[...path, propertyName]}
                  value={objectValue?.[propertyName]}
                  onChange={handlePropertyChange(propertyName)}
                  errors={errors.filter(error => error.path[path.length] === propertyName)}
                  required={resolvedSchema.required?.includes(propertyName)}
                  rootSchema={rootSchema}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  // Root object with toggleable fields (like LLM config)
  if (isToggleableMode) {
    return (
      <div className="space-y-2">
        {(resolvedSchema.title || resolvedSchema.description) && (
          <div className="mb-2">
            {resolvedSchema.title && (
              <h3 className="text-sm font-medium text-foreground">{resolvedSchema.title}</h3>
            )}
            {resolvedSchema.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{resolvedSchema.description}</p>
            )}
          </div>
        )}
        <div className="space-y-2">
          {Object.entries(resolvedSchema.properties).map(([propertyName, propertySchema]) => (
            <ToggleableField
              key={propertyName}
              propertyName={propertyName}
              propertySchema={propertySchema}
              isActive={activeProperties.has(propertyName)}
              value={objectValue?.[propertyName]}
              onToggle={active => handlePropertyToggle(propertyName, active)}
              onValueChange={handlePropertyChange(propertyName)}
              errors={errors.filter(error => error.path[path.length] === propertyName)}
              required={resolvedSchema.required?.includes(propertyName)}
              path={path}
              rootSchema={rootSchema}
            />
          ))}
        </div>
      </div>
    );
  }

  // Check if we also have additionalProperties (dynamic properties)
  const hasAdditionalProperties = resolvedSchema.additionalProperties === true || 
    (typeof resolvedSchema.additionalProperties === 'object' && resolvedSchema.additionalProperties !== null);

  return (
    <div className="space-y-3">
      {(resolvedSchema.title || resolvedSchema.description) && !isRootObject && (
        <div className="border-b border-border pb-2">
          {resolvedSchema.title && <h3 className="text-sm font-medium text-foreground">{resolvedSchema.title}</h3>}
          {resolvedSchema.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{resolvedSchema.description}</p>
          )}
        </div>
      )}
      <div className="space-y-3">
        {/* Defined properties */}
        {Object.entries(resolvedSchema.properties).map(([propertyName, propertySchema]) => (
          <SchemaField
            key={propertyName}
            schema={propertySchema}
            path={[...path, propertyName]}
            value={objectValue?.[propertyName]}
            onChange={handlePropertyChange(propertyName)}
            errors={errors.filter(error => error.path[path.length] === propertyName)}
            required={resolvedSchema.required?.includes(propertyName)}
            rootSchema={rootSchema}
          />
        ))}
        
        {/* Additional properties (dynamic key-value pairs) */}
        {hasAdditionalProperties && (() => {
          const definedPropertyNames = new Set(Object.keys(resolvedSchema.properties || {}));
          const additionalProps = Object.entries(objectValue || {}).filter(
            ([key]) => !definedPropertyNames.has(key)
          );
          
          const additionalPropertiesSchema = typeof resolvedSchema.additionalProperties === 'object'
            ? resolvedSchema.additionalProperties
            : { type: 'string' as const };
          
          return (
            <div className="mt-4 space-y-2 border-t border-border pt-3">
              <div className="text-xs font-medium text-muted-foreground">
                Additional Properties
              </div>
              {additionalProps.map(([key, val]) => (
                <div key={key} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <code className="text-xs font-semibold text-foreground bg-muted/50 px-2 py-1 rounded">
                        {key}
                      </code>
                    </div>
                    <SchemaField
                      schema={additionalPropertiesSchema}
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
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-2">
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAdditionalProperty();
                    }
                  }}
                  placeholder="Property name"
                  className="flex-1 rounded-md border border-input-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleAddAdditionalProperty}
                  disabled={!newKey.trim() || definedPropertyNames.has(newKey.trim())}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
