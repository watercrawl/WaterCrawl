import yaml from 'js-yaml';

import {
  ParameterDefinition,
  jsonSchemaToParameters,
  parametersToJsonSchema,
} from '../components/json-forms/builder';
import {
  ProviderConfigModel,
  CreateCustomModelRequest,
} from '../types/provider';

/**
 * Convert a custom model to YAML format (matching builtin model config format)
 */
export function customModelToYaml(model: ProviderConfigModel): string {
  const yamlData: Record<string, unknown> = {
    model: model.model_key,
    label: model.label,
    model_type: model.model_type,
  };

  // Add features if they exist
  if (model.custom_config?.features && model.custom_config.features.length > 0) {
    yamlData.features = model.custom_config.features;
  }

  // Add model_properties if they exist
  if (model.custom_config?.model_properties) {
    yamlData.model_properties = model.custom_config.model_properties;
  }

  // Convert parameters_schema to parameter_rules format
  if (model.custom_config?.parameters_schema) {
    const parameters = jsonSchemaToParameters(
      model.custom_config.parameters_schema as Record<string, unknown>
    );
    
    if (parameters.length > 0) {
      yamlData.parameter_rules = parameters.map(param => {
        const rule: Record<string, unknown> = {
          name: param.name,
        };

        // Handle template-based parameters
        if (param.useTemplate) {
          rule.use_template = param.useTemplate;
        } else {
          // Map type
          const typeMapping: Record<string, string> = {
            string: 'string',
            number: 'float',
            integer: 'int',
            boolean: 'boolean',
            enum: 'string',
          };
          rule.type = typeMapping[param.type] || 'string';
        }

        // Add label/title
        if (param.title) {
          rule.label = param.title;
        }

        // Add help/description
        if (param.description) {
          rule.help = param.description;
        }

        // Add default
        if (param.default !== undefined) {
          rule.default = param.default;
        }

        // Add required
        if (param.required) {
          rule.required = true;
        }

        // Add constraints
        if (param.minimum !== undefined) {
          rule.min = param.minimum;
        }
        if (param.maximum !== undefined) {
          rule.max = param.maximum;
        }
        if (param.minLength !== undefined) {
          rule.min = param.minLength;
        }
        if (param.maxLength !== undefined) {
          rule.max = param.maxLength;
        }

        // Add enum options
        if (param.enum && param.enum.length > 0) {
          rule.options = param.enum;
        }

        return rule;
      });
    }
  }

  return yaml.dump(yamlData, {
    indent: 2,
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
  });
}

/**
 * Convert YAML string to custom model form data
 */
export function yamlToCustomModel(
  yamlContent: string,
  modelKey?: string
): Partial<CreateCustomModelRequest> {
  try {
    const yamlData = yaml.load(yamlContent) as Record<string, unknown>;

    const result: Partial<CreateCustomModelRequest> = {
      model_key: modelKey || (yamlData.model as string) || '',
      model_type: (yamlData.model_type as 'llm' | 'embedding' | 'reranker') || 'llm',
      label: (yamlData.label as string) || '',
    };

    // Parse features
    if (yamlData.features) {
      if (Array.isArray(yamlData.features)) {
        result.features = yamlData.features as string[];
      } else if (typeof yamlData.features === 'string') {
        result.features = yamlData.features.split(',').map(f => f.trim()).filter(Boolean);
      }
    }

    // Parse model_properties
    if (yamlData.model_properties) {
      result.model_properties = yamlData.model_properties as Record<string, unknown>;
    }

    // Convert parameter_rules to parameters_schema
    if (yamlData.parameter_rules && Array.isArray(yamlData.parameter_rules)) {
      const parameterRules = yamlData.parameter_rules as Array<Record<string, unknown>>;
      
      // Convert to ParameterDefinition format first
      const parameters: ParameterDefinition[] = parameterRules.map((rule, index) => {
        const param: ParameterDefinition = {
          id: `param-${Date.now()}-${index}`,
          name: (rule.name as string) || '',
          type: 'string',
        };

        // Handle template-based parameters
        if (rule.use_template) {
          param.useTemplate = rule.use_template as 'top_k' | 'seed' | 'temperature' | 'top_p' | 'max_tokens' | 'presence_penalty' | 'frequency_penalty' | 'response_format';
          // Get type from template if available
          // We'll let the builder handle template types
        } else {
          // Map type from YAML to ParameterType
          const typeStr = (rule.type as string) || 'string';
          const typeMapping: Record<string, 'string' | 'number' | 'integer' | 'boolean' | 'enum'> = {
            string: 'string',
            float: 'number',
            number: 'number',
            int: 'integer',
            integer: 'integer',
            boolean: 'boolean',
            bool: 'boolean',
          };
          param.type = typeMapping[typeStr] || 'string';
        }

        // Add title/label
        if (rule.label) {
          param.title = rule.label as string;
        }

        // Add description/help
        if (rule.help) {
          param.description = rule.help as string;
        }

        // Add default
        if (rule.default !== undefined) {
          param.default = rule.default as string | number | boolean;
        }

        // Add required
        if (rule.required === true) {
          param.required = true;
        }

        // Add constraints
        if (rule.min !== undefined) {
          if (param.type === 'number' || param.type === 'integer') {
            param.minimum = rule.min as number;
          } else if (param.type === 'string') {
            param.minLength = rule.min as number;
          }
        }
        if (rule.max !== undefined) {
          if (param.type === 'number' || param.type === 'integer') {
            param.maximum = rule.max as number;
          } else if (param.type === 'string') {
            param.maxLength = rule.max as number;
          }
        }

        // Add enum options
        if (rule.options && Array.isArray(rule.options)) {
          param.enum = rule.options as string[];
          param.type = 'enum';
        }

        return param;
      });

      // Convert to JSON Schema
      if (parameters.length > 0) {
        result.parameters_schema = parametersToJsonSchema(parameters);
      }
    }

    return result;
  } catch (error) {
    console.error('Error parsing YAML:', error);
    throw new Error('Invalid YAML format');
  }
}

/**
 * Export custom models as JSON with YAML files
 */
export function exportCustomModels(models: ProviderConfigModel[]): string {
  const exportData: Record<string, string> = {};
  
  for (const model of models) {
    const yamlContent = customModelToYaml(model);
    const fileName = `${model.model_key}.yml`;
    exportData[fileName] = yamlContent;
  }

  return JSON.stringify(exportData, null, 2);
}

