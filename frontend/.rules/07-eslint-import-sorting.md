# ESLint Import Sorting

## Overview

The project uses `eslint-plugin-import-x` to automatically enforce consistent import ordering across all TypeScript and TSX files.

## Installation

Already installed in the project:
```bash
pnpm add -D eslint-plugin-import-x
```

## Configuration

Import sorting rules are configured in `eslint.config.js`:

### Import Groups (in order)
1. **React** - React and React ecosystem packages (react, react-dom, react-router-dom, etc.)
2. **External packages** - Third-party libraries from node_modules (alphabetically sorted)
3. **Internal modules** - Absolute imports (contexts, services, utilities)
4. **Relative imports** - Parent (`../`) and sibling (`./`) imports
5. **Type imports** - TypeScript type imports
6. **Blank lines** - Automatically added between groups

### Features
- ✅ **Automatic alphabetical sorting** within each group
- ✅ **Blank lines between groups** for better readability
- ✅ **React imports always first** - React packages prioritized
- ✅ **No duplicate imports** - Prevents multiple imports from same module
- ✅ **Newline after imports** - Blank line before code starts

## Usage

### Check for Import Order Issues
```bash
pnpm lint
```

### Auto-Fix Import Order
```bash
pnpm lint:fix
```

This will automatically:
- Reorder imports according to the rules
- Add blank lines between groups
- Remove duplicate imports
- Alphabetically sort within groups

## Example: Before and After

### ❌ Before (Incorrect Order)
```typescript
import toast from 'react-hot-toast';
import { UserIcon } from '@heroicons/react/24/outline';
import type { User } from '../../types/user';
import Button from '../shared/Button';
import { apiService } from '../../services/api/service';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
```

### ✅ After (Correct Order)
```typescript
import React, { useState } from 'react';

import { UserIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api/service';

import Button from '../shared/Button';

import type { User } from '../../types/user';
```

## Rules Enabled

### `import-x/order`
Enforces the import grouping and ordering specified above.

**Configuration:**
- Groups: builtin → external → internal → parent/sibling → type
- React packages always first
- Alphabetical sorting within groups
- Blank lines between groups

### `import-x/first`
Ensures all imports come before other statements in the file.

### `import-x/newline-after-import`
Requires a blank line after the last import statement.

### `import-x/no-duplicates`
Prevents multiple import statements from the same module.

```typescript
// ❌ Bad - duplicate imports
import { useState } from 'react';
import { useEffect } from 'react';

// ✅ Good - combined import
import { useState, useEffect } from 'react';
```

## IDE Integration

### VS Code
If you have the ESLint extension installed, you can enable auto-fix on save:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### WebStorm/IntelliJ
Go to Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
- Enable "Automatic ESLint configuration"
- Check "Run eslint --fix on save"

## Best Practices

1. **Always run lint:fix before committing** - Ensures consistent imports
2. **Trust the auto-fix** - Don't manually arrange imports, let ESLint do it
3. **Group related imports mentally** - While coding, think about the import groups
4. **Use type imports** - Prefer `import type { User }` for types when possible

## Troubleshooting

### Issue: ESLint not fixing imports
**Solution:** Make sure you're in the correct directory and run:
```bash
cd /path/to/frontend
pnpm lint:fix
```

### Issue: Import order still incorrect after fix
**Solution:** Check for syntax errors in your file. ESLint won't fix files with parse errors.

### Issue: Conflicting with Prettier
**Solution:** This configuration is compatible with Prettier. Import sorting happens before Prettier formatting.

## Migration

To fix all existing files in the project:

```bash
# Fix all files at once
pnpm lint:fix

# Or fix specific directories
pnpm eslint src/components --fix
pnpm eslint src/pages --fix
```

## CI/CD Integration

In CI/CD pipelines, check for import order violations:

```bash
# Check without fixing
pnpm lint

# This will fail the build if imports are not sorted
```

## Summary

Import sorting is now fully automated with ESLint. Just run `pnpm lint:fix` to organize all imports according to the project standards!
