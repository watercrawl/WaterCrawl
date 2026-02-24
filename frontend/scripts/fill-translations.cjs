#!/usr/bin/env node

/**
 * Fill Translations Script
 * Reads en.json and fills empty values in other language files with translations
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../public/locales');

function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
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

// Get empty keys and their English values
const enJson = readJsonFile(path.join(LOCALES_DIR, 'en.json'));
const lang = process.argv[2];

if (!lang) {
  console.log('Usage: node fill-translations.cjs <lang>');
  console.log('Example: node fill-translations.cjs de');
  process.exit(1);
}

const langFile = path.join(LOCALES_DIR, `${lang}.json`);
if (!fs.existsSync(langFile)) {
  console.error(`Language file ${lang}.json not found`);
  process.exit(1);
}

const langJson = readJsonFile(langFile);
const allKeys = getAllKeys(enJson);

const emptyKeys = [];
for (const key of allKeys) {
  const value = getValueByPath(langJson, key);
  if (value === '' || value === null) {
    const enValue = getValueByPath(enJson, key);
    if (enValue && typeof enValue === 'string') {
      emptyKeys.push({ key, enValue });
    }
  }
}

// Output as JSON for easy processing
console.log(JSON.stringify(emptyKeys, null, 2));
