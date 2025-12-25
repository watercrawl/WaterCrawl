/**
 * Types for the JSON Schema Parameter Builder
 */

export type ParameterType = 'string' | 'number' | 'integer' | 'boolean' | 'enum';

/**
 * Available parameter templates from the backend
 */
export const PARAMETER_TEMPLATES = [
  {
    key: 'temperature',
    label: 'Temperature',
    description: 'Controls randomness. Lower values make the model more deterministic.',
    type: 'number' as ParameterType,
    default: 0.7,
    minimum: 0.0,
    maximum: 2.0,
  },
  {
    key: 'top_p',
    label: 'Top P',
    description: 'Nucleus sampling: only consider tokens with cumulative probability >= top_p.',
    type: 'number' as ParameterType,
    default: 1.0,
    minimum: 0.0,
    maximum: 1.0,
  },
  {
    key: 'top_k',
    label: 'Top K',
    description: 'Only sample from the top K tokens.',
    type: 'integer' as ParameterType,
    default: 50,
    minimum: 1,
    maximum: 100,
  },
  {
    key: 'max_tokens',
    label: 'Max Tokens',
    description: 'Maximum number of tokens to generate.',
    type: 'integer' as ParameterType,
    default: 512,
    minimum: 1,
    maximum: 128000,
  },
  {
    key: 'presence_penalty',
    label: 'Presence Penalty',
    description: 'Penalize new tokens based on whether they appear in the text so far.',
    type: 'number' as ParameterType,
    default: 0.0,
    minimum: -2.0,
    maximum: 2.0,
  },
  {
    key: 'frequency_penalty',
    label: 'Frequency Penalty',
    description: 'Penalize new tokens based on their frequency in the text so far.',
    type: 'number' as ParameterType,
    default: 0.0,
    minimum: -2.0,
    maximum: 2.0,
  },
  {
    key: 'seed',
    label: 'Seed',
    description: 'Random seed for reproducible outputs.',
    type: 'integer' as ParameterType,
  },
  {
    key: 'response_format',
    label: 'Response Format',
    description: 'Specifying the format that the model must output.',
    type: 'enum' as ParameterType,
    enum: ['text', 'json_object'],
  },
] as const;

export type ParameterTemplateKey = typeof PARAMETER_TEMPLATES[number]['key'];

export interface ParameterDefinition {
  id: string;
  name: string;
  type: ParameterType;
  title?: string;
  description?: string;
  default?: string | number | boolean;
  required?: boolean;
  // Template reference (if using a template)
  useTemplate?: ParameterTemplateKey;
  // Number/Integer constraints
  minimum?: number;
  maximum?: number;
  // String constraints
  minLength?: number;
  maxLength?: number;
  // Enum options (for select/dropdown or enum type)
  enum?: string[];
  enumLabels?: string[];
}

export interface ParameterSchemaBuilderProps {
  value: ParameterDefinition[];
  onChange: (parameters: ParameterDefinition[]) => void;
  disabled?: boolean;
}

/**
 * Convert ParameterDefinition array to JSON Schema
 */
export const parametersToJsonSchema = (
  parameters: ParameterDefinition[]
): Record<string, unknown> => {
  if (!parameters || parameters.length === 0) {
    return {};
  }

  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const param of parameters) {
    // If using a template, store it as use_template reference
    if (param.useTemplate) {
      properties[param.name] = {
        use_template: param.useTemplate,
        // Allow overrides
        ...(param.default !== undefined && { default: param.default }),
        ...(param.minimum !== undefined && { min: param.minimum }),
        ...(param.maximum !== undefined && { max: param.maximum }),
      };
      if (param.required) {
        required.push(param.name);
      }
      continue;
    }

    // Handle enum type - convert to string with enum constraint
    const schemaType = param.type === 'enum' ? 'string' : param.type;
    
    const propSchema: Record<string, unknown> = {
      type: schemaType,
    };

    if (param.title) {
      propSchema.title = param.title;
    }

    if (param.description) {
      propSchema.description = param.description;
    }

    if (param.default !== undefined && param.default !== '') {
      // Convert default value based on type
      if (param.type === 'number' || param.type === 'integer') {
        propSchema.default = Number(param.default);
      } else if (param.type === 'boolean') {
        propSchema.default = param.default === true || param.default === 'true';
      } else {
        propSchema.default = param.default;
      }
    }

    // Number/Integer constraints
    if ((param.type === 'number' || param.type === 'integer') && param.minimum !== undefined) {
      propSchema.minimum = param.minimum;
    }
    if ((param.type === 'number' || param.type === 'integer') && param.maximum !== undefined) {
      propSchema.maximum = param.maximum;
    }

    // String constraints
    if (param.type === 'string' && param.minLength !== undefined) {
      propSchema.minLength = param.minLength;
    }
    if (param.type === 'string' && param.maxLength !== undefined) {
      propSchema.maxLength = param.maxLength;
    }

    // Enum options (for enum type or string with options)
    if (param.enum && param.enum.length > 0) {
      propSchema.enum = param.enum;
      if (param.enumLabels && param.enumLabels.length === param.enum.length) {
        propSchema.enumNames = param.enumLabels;
      }
    }

    properties[param.name] = propSchema;

    if (param.required) {
      required.push(param.name);
    }
  }

  const schema: Record<string, unknown> = {
    type: 'object',
    properties,
  };

  if (required.length > 0) {
    schema.required = required;
  }

  return schema;
};

/**
 * Convert JSON Schema back to ParameterDefinition array
 */
export const jsonSchemaToParameters = (
  schema: Record<string, unknown>
): ParameterDefinition[] => {
  if (!schema || schema.type !== 'object' || !schema.properties) {
    return [];
  }

  const properties = schema.properties as Record<string, Record<string, unknown>>;
  const required = (schema.required as string[]) || [];
  const parameters: ParameterDefinition[] = [];

  for (const [name, propSchema] of Object.entries(properties)) {
    // Check if this is a template reference
    if (propSchema.use_template) {
      const templateKey = propSchema.use_template as ParameterTemplateKey;
      const template = PARAMETER_TEMPLATES.find(t => t.key === templateKey);
      
      const param: ParameterDefinition = {
        id: `param-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        type: template?.type || 'string',
        useTemplate: templateKey,
        required: required.includes(name),
        // Allow overrides from schema
        default: propSchema.default as string | number | boolean | undefined,
        minimum: propSchema.min as number | undefined,
        maximum: propSchema.max as number | undefined,
      };
      parameters.push(param);
      continue;
    }

    // Determine if it's an enum type
    const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);
    const schemaType = propSchema.type as string;
    const paramType: ParameterType = hasEnum && schemaType === 'string' 
      ? 'enum' 
      : (schemaType as ParameterType) || 'string';

    const param: ParameterDefinition = {
      id: `param-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: paramType,
      title: propSchema.title as string | undefined,
      description: propSchema.description as string | undefined,
      default: propSchema.default as string | number | boolean | undefined,
      required: required.includes(name),
      minimum: propSchema.minimum as number | undefined,
      maximum: propSchema.maximum as number | undefined,
      minLength: propSchema.minLength as number | undefined,
      maxLength: propSchema.maxLength as number | undefined,
      enum: propSchema.enum as string[] | undefined,
      enumLabels: propSchema.enumNames as string[] | undefined,
    };

    parameters.push(param);
  }

  return parameters;
};
