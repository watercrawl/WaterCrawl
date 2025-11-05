import React from 'react';

import { FieldProps } from '../types/schema';

import { SchemaField } from './SchemaField';

export const ArrayField: React.FC<FieldProps> = ({
  schema,
  path,
  value = [],
  onChange,
  errors = [],
}) => {
  const handleItemChange = (index: number) => (itemValue: any) => {
    const newValue = [...value];
    newValue[index] = itemValue;
    onChange(newValue);
  };

  const handleAddItem = () => {
    const newValue = [...value, schema.items?.default ?? null];
    onChange(newValue);
  };

  const handleRemoveItem = (index: number) => {
    const newValue = value.filter((_: any, i: number) => i !== index);
    onChange(newValue);
  };

  if (!schema.items) {
    return null;
  }

  return (
    <div className="space-y-4">
      {(schema.title || schema.description) && (
        <div className="mb-4">
          {schema.title && <h4 className="text-sm font-medium text-foreground">{schema.title}</h4>}
          {schema.description && (
            <p className="text-sm text-muted-foreground">{schema.description}</p>
          )}
        </div>
      )}
      <div className="space-y-3">
        {value.map((item: any, index: number) => (
          <div key={index} className="relative">
            <SchemaField
              schema={schema.items!}
              path={[...path, index.toString()]}
              value={item}
              onChange={handleItemChange(index)}
              errors={errors.filter(error => error.path[path.length] === index.toString())}
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="absolute -end-8 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-error"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
      {(!schema.maxItems || value.length < schema.maxItems) && (
        <button
          type="button"
          onClick={handleAddItem}
          className="mt-2 inline-flex items-center rounded-md border border-input-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <svg className="me-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      )}
    </div>
  );
};
