import React, { useMemo } from 'react';

import { FieldProps, UIWidgetType } from '../types/schema';
import { resolveSchema } from '../utils/schemaResolver';
import { CheckboxWidget } from '../widgets/CheckboxWidget';
import { JsonEditorWidget } from '../widgets/JsonEditorWidget';
import { NumberWidget } from '../widgets/NumberWidget';
import { RadioWidget } from '../widgets/RadioWidget';
import { SelectWidget } from '../widgets/SelectWidget';
import { SwitchWidget } from '../widgets/SwitchWidget';
import { TextAreaWidget } from '../widgets/TextAreaWidget';
import { TextWidget } from '../widgets/TextWidget';

import { InfoTooltip } from '../../shared/FormComponents';

import { ArrayField } from './ArrayField';
import { ObjectField } from './ObjectField';

// Convert field name to readable label (snake_case/camelCase to Title Case)
const formatFieldName = (name: string): string => {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to spaces
    .replace(/[_-]/g, ' ') // snake_case/kebab-case to spaces
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
};

export const SchemaField: React.FC<FieldProps> = props => {
  const { schema: originalSchema, path, errors = [], rootSchema } = props;
  const hasError = errors.length > 0;
  
  // Resolve $ref references - use rootSchema if provided for $defs access
  const schema = useMemo(() => {
    return resolveSchema(originalSchema as any, rootSchema);
  }, [originalSchema, rootSchema]);
  
  const ui = schema.ui || {};

  // Get display label: use title if available, otherwise format the field name from path
  const fieldName = path.length > 0 ? path[path.length - 1] : '';
  const displayLabel = schema.title || (fieldName ? formatFieldName(fieldName) : '');

  const renderWidget = () => {
    // First check for custom widget
    if (ui.widget) {
      switch (ui.widget) {
        case 'textarea':
          return <TextAreaWidget {...props} />;
        case 'radio':
          return <RadioWidget {...props} />;
        case 'switch':
          return <SwitchWidget {...props} />;
        case 'json-editor':
          return <JsonEditorWidget {...props} />;
        case 'checkbox':
          return <CheckboxWidget {...props} />;
      }
    }

    // Then fall back to default widgets based on schema type and enum
    if (schema.enum) {
      return <SelectWidget {...props} />;
    }

    switch (schema.type) {
      case 'string':
        switch (schema.format) {
          case 'email':
          case 'uri':
          case 'url':
          case 'date':
          case 'time':
          case 'date-time':
          case 'password':
            return <TextWidget {...props} type={schema.format} />;
          default:
            return <TextWidget {...props} />;
        }
      case 'number':
      case 'integer':
        return <NumberWidget {...props} />;
      case 'boolean':
        return ui.widget === ('checkbox' as UIWidgetType) ? (
          <CheckboxWidget {...props} />
        ) : (
          <SwitchWidget {...props} />
        );
      case 'object':
        return ui.widget === ('json-editor' as UIWidgetType) ? (
          <JsonEditorWidget {...props} />
        ) : (
          <ObjectField {...props} />
        );
      case 'array':
        return <ArrayField {...props} />;
      default:
        return null;
    }
  };

  if (schema.type === 'object' && ui.widget === 'json-editor') {
    return renderWidget();
  }

  if (schema.type === 'object' || schema.type === 'array') {
    return renderWidget();
  }

  if (schema.type === 'boolean' && ui.widget !== 'radio') {
    return (
      <div className={ui.className || ''}>
        {renderWidget()}
        {hasError && (
          <p className="mt-1 text-xs text-error">
            {errors.map((error, index) => (
              <span key={index}>{error.message}</span>
            ))}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={ui.className || ''}>
      {(displayLabel || schema.description) && (
        <div className="mb-1 flex items-center gap-1">
          {displayLabel && (
            <label className="text-sm font-medium text-foreground">
              {displayLabel}
              {props.required && <span className="ms-0.5 text-error">*</span>}
            </label>
          )}
          {schema.description && <InfoTooltip content={schema.description} />}
        </div>
      )}
      {renderWidget()}
      {hasError && (
        <p className="mt-1 text-xs text-error">
          {errors.map((error, index) => (
            <span key={index}>{error.message}</span>
          ))}
        </p>
      )}
    </div>
  );
};
