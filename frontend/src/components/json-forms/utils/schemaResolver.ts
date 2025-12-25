import { JSONSchemaDefinition } from '../types/schema';

/**
 * Resolves $ref references in a JSON schema.
 * Supports both local references (#/$defs/...) and external references.
 */
export function resolveSchema(
  schema: JSONSchemaDefinition & { $ref?: string; $defs?: Record<string, JSONSchemaDefinition> },
  rootSchema?: JSONSchemaDefinition & { $defs?: Record<string, JSONSchemaDefinition> }
): JSONSchemaDefinition {
  // Use root schema if provided, otherwise use the schema itself
  // Merge $defs from both sources to ensure we have all definitions
  const defs = { ...(rootSchema?.$defs || {}), ...(schema.$defs || {}) };
  const currentRoot = rootSchema || schema;

  // If this schema has a $ref, resolve it
  if (schema.$ref) {
    const refPath = schema.$ref;
    
    // Handle local references (#/$defs/...)
    if (refPath.startsWith('#/$defs/')) {
      const defName = refPath.replace('#/$defs/', '');
      const resolved = defs[defName];
      if (resolved) {
        // Recursively resolve any nested $ref in the resolved schema
        return resolveSchema({ ...resolved, $defs: defs }, currentRoot);
      }
    }
    
    // Handle root-level references (#/...)
    if (refPath.startsWith('#/')) {
      const pathParts = refPath.replace('#/', '').split('/');
      let target: any = currentRoot;
      for (const part of pathParts) {
        if (target && typeof target === 'object' && part in target) {
          target = target[part];
        } else {
          return schema; // Can't resolve, return original
        }
      }
      if (target) {
        return resolveSchema({ ...target, $defs: defs }, currentRoot);
      }
    }
  }

  // Recursively resolve nested schemas
  const resolved: JSONSchemaDefinition = { ...schema };
  
  // Remove $ref and $defs from the resolved schema (they're metadata)
  delete (resolved as any).$ref;
  delete (resolved as any).$defs;

  // Resolve properties
  if (schema.properties) {
    resolved.properties = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      resolved.properties[key] = resolveSchema(propSchema, currentRoot);
    }
  }

  // Resolve items (for arrays)
  if (schema.items) {
    resolved.items = resolveSchema(schema.items, currentRoot);
  }

  // Resolve additionalProperties if it's a schema
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    resolved.additionalProperties = resolveSchema(schema.additionalProperties, currentRoot);
  }

  return resolved;
}
