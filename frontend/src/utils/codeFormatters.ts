// Utility to convert JS object to Python dict string
export function toPythonDict(obj: any, indent = 4, level = 1): string {
  if (obj === null || obj === undefined) return 'None';
  if (typeof obj === 'boolean') return obj ? 'True' : 'False';
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map(i => toPythonDict(i, indent, level + 1));
    const pad = ' '.repeat(indent * level);
    return '[\n' + pad + items.join(',\n' + pad) + '\n' + ' '.repeat(indent * (level - 1)) + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const pad = ' '.repeat(indent * level);
    return (
      '{\n' +
      keys.map(k => `${pad}'${k}': ${toPythonDict(obj[k], indent, level + 1)}`).join(',\n') +
      '\n' +
      ' '.repeat(indent * (level - 1)) +
      '}'
    );
  }
  return 'None';
}

// Utility to convert JS object to Node.js options string
export function toNodeJsOptions(obj: any, indent = 2, level = 1): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map(i => toNodeJsOptions(i, indent, level + 1));
    const pad = ' '.repeat(indent * level);
    return '[\n' + pad + items.join(',\n' + pad) + '\n' + ' '.repeat(indent * (level - 1)) + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const pad = ' '.repeat(indent * level);
    return (
      '{\n' +
      keys.map(k => `${pad}${k}: ${toNodeJsOptions(obj[k], indent, level + 1)}`).join(',\n') +
      '\n' +
      ' '.repeat(indent * (level - 1)) +
      '}'
    );
  }
  return 'null';
}

// Utility to convert JS object to Go map[string]interface{} string
export function toGoMap(obj: any, indent = 2, level = 2): string {
  if (obj === null || obj === undefined) return 'nil';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"')}"`;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]interface{}{}';
    const items = obj.map(i => toGoMap(i, indent, level + 1));
    const pad = ' '.repeat(indent * level);
    return `[]interface{}{\n${pad}${items.join(',\n' + pad)}\n${' '.repeat(indent * (level - 1))}}`;
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return 'map[string]interface{}{}';
    const pad = ' '.repeat(indent * level);
    return `map[string]interface{}{\n${keys.map(k => `${pad}"${k}": ${toGoMap(obj[k], indent, level + 1)}`).join(',\n')}\n${' '.repeat(indent * (level - 1))}}`;
  }
  return 'nil';
}
