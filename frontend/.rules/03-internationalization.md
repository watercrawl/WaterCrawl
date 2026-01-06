# Internationalization (i18n) Guidelines

## Core Principle
**NEVER use hardcoded text strings. Always use translation keys with i18next.**

## Supported Languages
1. 🇬🇧 English (en) 2. 🇩🇪 German (de) 3. 🇸🇦 Arabic (ar) 4. 🇪🇸 Spanish (es) 5. 🇫🇷 French (fr)
6. 🇮🇹 Italian (it) 7. 🇮🇷 Persian (fa) 8. 🇯🇵 Japanese (ja) 9. 🇧🇷 Portuguese (pt) 10. 🇨🇳 Chinese (zh)

Translation files: `/public/locales/{languageCode}.json`

## Managing Translations

We use automated scripts to maintain consistency across all 10 language files.

### Step-by-Step Workflow:
1. **Add to English**: Add your new translation keys to `/public/locales/en.json` first.
2. **Sync Languages**: Run the sync script to automatically add the new keys to all other language files:
   ```bash
   pnpm i18n:sync
   ```
3. **Find Missing Translations**: Run the find-empty script to identify which keys need translation:
   ```bash
   pnpm i18n:find-empty
   ```
4. **Translate**: Fill in the empty values in the respective `.json` files.

## Basic Usage

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// ✅ DO
<button>{t('common.submit')}</button>
<input placeholder={t('form.emailPlaceholder')} />

// ❌ DON'T - hardcoded text
<button>Submit</button>
<input placeholder="Enter email" />
```

## Translation Key Structure

Format: `{section}.{subsection}.{key}`

Examples:
- `common.submit`, `common.cancel`, `common.delete`
- `settings.team.name`, `settings.team.nameDescription`
- `errors.notFound.message`

## Pluralization

Use `_one` and `_other` suffixes:

```json
{
  "memberCount_one": "{{count}} member",
  "memberCount_other": "{{count}} members"
}
```

Usage:
```typescript
{t('settings.team.memberCount', { count: members.length })}
// count = 1  → "1 member"
// count = 5  → "5 members"
```

## Interpolation

```typescript
// Translation: "Hello, {{name}}!"
<p>{t('greeting', { name: user.name })}</p>
```

## Adding New Translations

1. Add to `en.json` first (master language)
2. Add to ALL 10 language files
3. Use descriptive camelCase keys
4. Group related keys under common parent

## Confirmation Dialogs

Always translate `useConfirm` strings:

```typescript
const { confirm } = useConfirm();

confirm({
  title: t('settings.team.removeMemberTitle'),
  message: t('settings.team.confirmRemove'),
  confirmText: t('common.delete'),
  onConfirm: async () => { /* ... */ },
});
```

## Best Practices

1. **Never hardcode text** - Use `t()` for all user-facing strings
2. **Add to all languages** - Maintain consistency across all 10 language files
3. **Use descriptive keys** - Key names should hint at content
4. **Test in multiple languages** - Switch language to verify translations display correctly
5. **Keep keys organized** - Use dot notation hierarchy
