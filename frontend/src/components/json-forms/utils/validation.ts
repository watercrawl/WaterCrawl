import { JSONSchemaDefinition, ValidationError } from '../types/schema';

export function validateValue(
  value: any,
  schema: JSONSchemaDefinition,
  path: string[] = []
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (value === undefined || value === null) {
    if (schema.required) {
      errors.push({ path, message: 'This field is required' });
    }
    return errors;
  }

  if (schema.const !== undefined && value !== schema.const) {
    errors.push({ path, message: `Must be equal to ${schema.const}` });
  }

  switch (schema.type) {
    case 'string': {
      if (typeof value !== 'string') {
        errors.push({ path, message: 'Must be a string' });
      } else {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
          errors.push({ path, message: `Must be at least ${schema.minLength} characters` });
        }
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
          errors.push({ path, message: `Must be at most ${schema.maxLength} characters` });
        }
        if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
          errors.push({ path, message: 'Invalid format' });
        }
      }
      break;
    }

    case 'number':
    case 'integer': {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push({ path, message: `Must be a ${schema.type}` });
      } else {
        if (schema.type === 'integer' && !Number.isInteger(num)) {
          errors.push({ path, message: 'Must be an integer' });
        }
        if (schema.minimum !== undefined && num < schema.minimum) {
          errors.push({ path, message: `Must be greater than or equal to ${schema.minimum}` });
        }
        if (schema.maximum !== undefined && num > schema.maximum) {
          errors.push({ path, message: `Must be less than or equal to ${schema.maximum}` });
        }
      }
      break;
    }

    case 'boolean': {
      if (typeof value !== 'boolean') {
        errors.push({ path, message: 'Must be a boolean' });
      }
      break;
    }

    case 'array': {
      if (!Array.isArray(value)) {
        errors.push({ path, message: 'Must be an array' });
      } else {
        if (schema.minItems !== undefined && value.length < schema.minItems) {
          errors.push({ path, message: `Must have at least ${schema.minItems} items` });
        }
        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
          errors.push({ path, message: `Must have at most ${schema.maxItems} items` });
        }
        if (schema.uniqueItems && new Set(value).size !== value.length) {
          errors.push({ path, message: 'Items must be unique' });
        }
        if (schema.items) {
          value.forEach((item, index) => {
            errors.push(...validateValue(item, schema.items!, [...path, index.toString()]));
          });
        }
      }
      break;
    }

    case 'object': {
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push({ path, message: 'Must be an object' });
      } else if (schema.properties) {
        // Check regular required fields
        if (schema.required) {
          schema.required.forEach((key) => {
            if (!(key in value)) {
              errors.push({ path: [...path, key], message: 'This field is required' });
            }
          });
        }

        // Check dependent required fields
        if (schema.dependentRequired) {
          Object.entries(schema.dependentRequired).forEach(([dependency, required]) => {
            if (dependency in value && value[dependency]) {
              required.forEach((key) => {
                if (!(key in value) || value[key] === undefined || value[key] === null || value[key] === '') {
                  errors.push({
                    path: [...path, key],
                    message: `This field is required when ${dependency} is set`,
                  });
                }
              });
            }
          });
        }

        // Validate each property
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
          if (key in value) {
            errors.push(...validateValue(value[key], propSchema, [...path, key]));
          }
        });
      }
      break;
    }
  }

  return errors;
}
