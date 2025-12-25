#!/usr/bin/env node

/**
 * Translation Sync Script for WaterCrawl Frontend
 *
 * This script synchronizes translation files with en.json as the source of truth.
 *
 * Usage:
 *   node scripts/sync-translations.js [command] [options]
 *
 * Commands:
 *   sync          Sync all language files with en.json (add missing keys, remove extra keys)
 *   find-empty    Find empty values in language files and show JSON path and line number
 *   validate      Validate structure of all language files against en.json
 *   stats         Show statistics about translation coverage
 *
 * Options:
 *   --lang=XX     Only process specific language (e.g., --lang=de)
 *   --dry-run     Show what would be changed without making changes
 *   --verbose     Show detailed output
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../public/locales');
const SOURCE_LANG = 'en';
const SUPPORTED_LANGS = ['ar', 'de', 'es', 'fa', 'fr', 'it', 'ja', 'pt', 'zh'];

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';
const options = {
  lang: null,
  dryRun: false,
  verbose: false,
};

args.slice(1).forEach(arg => {
  if (arg.startsWith('--lang=')) {
    options.lang = arg.split('=')[1];
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--verbose') {
    options.verbose = true;
  }
});

// Utility functions
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, json: JSON.parse(content) };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

function writeJsonFile(filePath, json) {
  const content = JSON.stringify(json, null, 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
}

function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getValueByPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

function setValueByPath(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function deleteValueByPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) return false;
    current = current[part];
  }
  const lastPart = parts[parts.length - 1];
  if (lastPart in current) {
    delete current[lastPart];
    return true;
  }
  return false;
}

function cleanEmptyObjects(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      cleanEmptyObjects(obj[key]);
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key];
      }
    }
  }
}

function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }
  const sorted = {};
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  return sorted;
}

function findLineNumber(content, jsonPath) {
  const lines = content.split('\n');
  const parts = jsonPath.split('.');
  let searchPattern = '';

  // Build search pattern for the deepest key
  const lastKey = parts[parts.length - 1];
  searchPattern = `"${lastKey}"`;

  // Find all matching lines
  const matchingLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchPattern)) {
      matchingLines.push({ line: i + 1, content: lines[i].trim() });
    }
  }

  // Try to find the most specific match by checking context
  if (matchingLines.length === 1) {
    return matchingLines[0].line;
  }

  // If multiple matches, try to find based on parent context
  if (parts.length > 1) {
    const parentKey = parts[parts.length - 2];
    let inParent = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(`"${parentKey}"`)) {
        inParent = true;
        braceCount = 0;
      }
      if (inParent) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        if (line.includes(searchPattern)) {
          return i + 1;
        }
        if (braceCount <= 0 && i > 0) {
          inParent = false;
        }
      }
    }
  }

  return matchingLines.length > 0 ? matchingLines[0].line : -1;
}

// Commands
function syncTranslations() {
  console.log('🔄 Syncing translations with en.json as source of truth...\n');

  const sourceFile = path.join(LOCALES_DIR, `${SOURCE_LANG}.json`);
  const sourceData = readJsonFile(sourceFile);
  if (!sourceData) {
    console.error('❌ Cannot read source file (en.json)');
    process.exit(1);
  }

  const sourceKeys = getAllKeys(sourceData.json);
  const langs = options.lang ? [options.lang] : SUPPORTED_LANGS;

  let totalAdded = 0;
  let totalRemoved = 0;

  for (const lang of langs) {
    const targetFile = path.join(LOCALES_DIR, `${lang}.json`);
    if (!fs.existsSync(targetFile)) {
      console.log(`⚠️  ${lang}.json does not exist, skipping`);
      continue;
    }

    const targetData = readJsonFile(targetFile);
    if (!targetData) continue;

    const targetKeys = getAllKeys(targetData.json);
    const missingKeys = sourceKeys.filter(key => !targetKeys.includes(key));
    const extraKeys = targetKeys.filter(key => !sourceKeys.includes(key));

    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`✅ ${lang}.json - Already in sync`);
      continue;
    }

    console.log(`\n📝 ${lang}.json:`);

    // Add missing keys with empty string
    if (missingKeys.length > 0) {
      console.log(`   Adding ${missingKeys.length} missing key(s):`);
      for (const key of missingKeys) {
        const sourceValue = getValueByPath(sourceData.json, key);
        // For objects, we create the structure; for values, we set empty string
        if (typeof sourceValue === 'object' && sourceValue !== null) {
          setValueByPath(targetData.json, key, {});
        } else {
          setValueByPath(targetData.json, key, '');
        }
        if (options.verbose) {
          console.log(`      + ${key}`);
        }
        totalAdded++;
      }
      if (!options.verbose && missingKeys.length > 5) {
        console.log(`      (${missingKeys.length} keys - use --verbose to see all)`);
      } else if (!options.verbose) {
        missingKeys.forEach(key => console.log(`      + ${key}`));
      }
    }

    // Remove extra keys
    if (extraKeys.length > 0) {
      console.log(`   Removing ${extraKeys.length} extra key(s):`);
      for (const key of extraKeys) {
        deleteValueByPath(targetData.json, key);
        if (options.verbose) {
          console.log(`      - ${key}`);
        }
        totalRemoved++;
      }
      if (!options.verbose && extraKeys.length > 5) {
        console.log(`      (${extraKeys.length} keys - use --verbose to see all)`);
      } else if (!options.verbose) {
        extraKeys.forEach(key => console.log(`      - ${key}`));
      }
      // Clean up empty objects after removal
      cleanEmptyObjects(targetData.json);
    }

    // Sort keys to match source structure
    const sortedJson = sortObjectKeys(targetData.json);

    if (!options.dryRun) {
      writeJsonFile(targetFile, sortedJson);
      console.log(`   ✓ Saved changes`);
    } else {
      console.log(`   ⏸️  Dry run - no changes saved`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Added: ${totalAdded} key(s)`);
  console.log(`   Removed: ${totalRemoved} key(s)`);
  if (options.dryRun) {
    console.log(`\n   (Dry run mode - no files were modified)`);
  }
}

function findEmptyValues() {
  console.log('🔍 Finding empty values in translation files...\n');

  const langs = options.lang ? [options.lang] : SUPPORTED_LANGS;
  let totalEmpty = 0;

  for (const lang of langs) {
    const targetFile = path.join(LOCALES_DIR, `${lang}.json`);
    if (!fs.existsSync(targetFile)) {
      console.log(`⚠️  ${lang}.json does not exist, skipping`);
      continue;
    }

    const targetData = readJsonFile(targetFile);
    if (!targetData) continue;

    const keys = getAllKeys(targetData.json);
    const emptyKeys = [];

    for (const key of keys) {
      const value = getValueByPath(targetData.json, key);
      if (value === '' || value === null) {
        const lineNum = findLineNumber(targetData.content, key);
        emptyKeys.push({ key, line: lineNum });
        totalEmpty++;
      }
    }

    if (emptyKeys.length === 0) {
      console.log(`✅ ${lang}.json - No empty values`);
    } else {
      console.log(`\n⚠️  ${lang}.json - ${emptyKeys.length} empty value(s):`);
      for (const { key, line } of emptyKeys) {
        console.log(`   Line ${String(line).padStart(4)}: ${key}`);
      }
    }
  }

  console.log(`\n📊 Summary: ${totalEmpty} empty value(s) found`);

  if (totalEmpty > 0) {
    console.log(`\n💡 Tip: Fill in the empty values with proper translations.`);
  }
}

function validateStructure() {
  console.log('🔍 Validating translation file structures...\n');

  const sourceFile = path.join(LOCALES_DIR, `${SOURCE_LANG}.json`);
  const sourceData = readJsonFile(sourceFile);
  if (!sourceData) {
    console.error('❌ Cannot read source file (en.json)');
    process.exit(1);
  }

  const sourceKeys = getAllKeys(sourceData.json);
  const langs = options.lang ? [options.lang] : SUPPORTED_LANGS;
  let hasErrors = false;

  for (const lang of langs) {
    const targetFile = path.join(LOCALES_DIR, `${lang}.json`);
    if (!fs.existsSync(targetFile)) {
      console.log(`⚠️  ${lang}.json does not exist`);
      hasErrors = true;
      continue;
    }

    const targetData = readJsonFile(targetFile);
    if (!targetData) {
      hasErrors = true;
      continue;
    }

    const targetKeys = getAllKeys(targetData.json);
    const missingKeys = sourceKeys.filter(key => !targetKeys.includes(key));
    const extraKeys = targetKeys.filter(key => !sourceKeys.includes(key));

    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`✅ ${lang}.json - Valid structure`);
    } else {
      console.log(`\n❌ ${lang}.json - Structure mismatch:`);
      if (missingKeys.length > 0) {
        console.log(`   Missing ${missingKeys.length} key(s)`);
        if (options.verbose) {
          missingKeys.forEach(key => console.log(`      - ${key}`));
        }
      }
      if (extraKeys.length > 0) {
        console.log(`   Extra ${extraKeys.length} key(s)`);
        if (options.verbose) {
          extraKeys.forEach(key => console.log(`      + ${key}`));
        }
      }
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.log(`\n💡 Run 'node scripts/sync-translations.js sync' to fix structure issues.`);
    process.exit(1);
  }
}

function showStats() {
  console.log('📊 Translation Statistics\n');

  const sourceFile = path.join(LOCALES_DIR, `${SOURCE_LANG}.json`);
  const sourceData = readJsonFile(sourceFile);
  if (!sourceData) {
    console.error('❌ Cannot read source file (en.json)');
    process.exit(1);
  }

  const sourceKeys = getAllKeys(sourceData.json);
  console.log(`📝 Source (en.json): ${sourceKeys.length} keys\n`);

  const langs = options.lang ? [options.lang] : SUPPORTED_LANGS;

  console.log('Language     │ Keys   │ Missing │ Extra  │ Empty  │ Coverage');
  console.log('─────────────┼────────┼─────────┼────────┼────────┼─────────');

  for (const lang of langs) {
    const targetFile = path.join(LOCALES_DIR, `${lang}.json`);
    if (!fs.existsSync(targetFile)) {
      console.log(`${lang.padEnd(12)} │ N/A    │ N/A     │ N/A    │ N/A    │ N/A`);
      continue;
    }

    const targetData = readJsonFile(targetFile);
    if (!targetData) continue;

    const targetKeys = getAllKeys(targetData.json);
    const missingKeys = sourceKeys.filter(key => !targetKeys.includes(key));
    const extraKeys = targetKeys.filter(key => !sourceKeys.includes(key));

    let emptyCount = 0;
    for (const key of targetKeys) {
      const value = getValueByPath(targetData.json, key);
      if (value === '' || value === null) {
        emptyCount++;
      }
    }

    const translated = targetKeys.length - missingKeys.length - emptyCount;
    const coverage = ((translated / sourceKeys.length) * 100).toFixed(1);

    console.log(
      `${lang.padEnd(12)} │ ${String(targetKeys.length).padStart(6)} │ ${String(missingKeys.length).padStart(7)} │ ${String(extraKeys.length).padStart(6)} │ ${String(emptyCount).padStart(6)} │ ${coverage.padStart(6)}%`
    );
  }

  console.log('');
}

function showHelp() {
  console.log(`
Translation Sync Script for WaterCrawl Frontend

Usage:
  node scripts/sync-translations.js [command] [options]

Commands:
  sync          Sync all language files with en.json
                - Adds missing keys with empty string value
                - Removes keys that don't exist in en.json
                - Sorts keys alphabetically

  find-empty    Find empty values in language files
                - Shows JSON path and line number for each empty value

  validate      Validate structure of all language files
                - Reports missing and extra keys
                - Returns exit code 1 if there are issues

  stats         Show translation coverage statistics
                - Shows key counts, missing, extra, empty values
                - Shows coverage percentage

  help          Show this help message

Options:
  --lang=XX     Only process specific language (e.g., --lang=de)
  --dry-run     Show what would be changed without making changes
  --verbose     Show detailed output

Examples:
  node scripts/sync-translations.js sync
  node scripts/sync-translations.js sync --lang=de
  node scripts/sync-translations.js sync --dry-run
  node scripts/sync-translations.js find-empty
  node scripts/sync-translations.js find-empty --lang=fr
  node scripts/sync-translations.js validate
  node scripts/sync-translations.js stats
`);
}

// Main
switch (command) {
  case 'sync':
    syncTranslations();
    break;
  case 'find-empty':
    findEmptyValues();
    break;
  case 'validate':
    validateStructure();
    break;
  case 'stats':
    showStats();
    break;
  case 'help':
  default:
    showHelp();
    break;
}
