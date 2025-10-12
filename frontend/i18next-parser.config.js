export default {
  locales: ['en', 'fa'],
  output: 'src/i18n/locales/$LOCALE.json',
  input: ['src/**/*.{ts,tsx}'],
  
  // Keep existing translations
  keepRemoved: true,
  
  // Sort keys alphabetically
  sort: true,
  
  // Create nested structure
  createOldCatalogs: false,
  
  // Use i18next defaults
  defaultNamespace: 'translation',
  defaultValue: (locale, namespace, key) => {
    // For English, use the key as default value
    return locale === 'en' ? key : '';
  },
  
  // Key separator for nested keys
  keySeparator: '.',
  
  // Namespace separator
  namespaceSeparator: false,
  
  // Functions to look for
  lexers: {
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],
  },
  
  // Custom function names
  func: {
    list: ['t'],
    extensions: ['.ts', '.tsx']
  },
  
  // Line ending
  lineEnding: 'auto',
  
  // Indentation
  indentation: 2,
  
  // Skip defaultValue for specific locales
  skipDefaultValues: (locale) => locale !== 'en',
  
  // Use trailing comma
  useKeysAsDefaultValue: false,
  
  // Fail on warnings
  failOnWarnings: false,
  
  // Verbose output
  verbose: true,
  
  // Custom key handling
  customValueTemplate: null,
};
