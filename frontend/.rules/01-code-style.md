# Code Style Guidelines

## General Principles
1. **Be Consistent** - Follow existing patterns in the codebase
2. **Type Safety** - Always use TypeScript, avoid `any` types
3. **Minimal Changes** - Make focused, scoped edits
4. **No Breaking Changes** - Maintain backward compatibility
5. **Follow Existing Style** - Match indentation, spacing, and naming conventions

## TypeScript

### Type Definitions
- Use interfaces for object shapes: `interface User { ... }`
- Use types for unions and primitives: `type Status = 'active' | 'inactive'`
- Import types from `/src/types/` directory
- Always define prop types for components
- Avoid `any` - use `unknown` if truly unknown

```typescript
// ✅ Good
interface UserProps {
  user: User;
  onUpdate: (user: User) => void;
}

// ❌ Bad
interface UserProps {
  user: any;
  onUpdate: Function;
}
```

### Component Props
```typescript
// ✅ Good - Named interface
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', onClick, children }) => {
  // ...
};
```

## React Components

### Component Structure
```typescript
// 1. Imports (grouped)
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/api/service';
import Button from '../shared/Button';
import type { User } from '../../types/user';

// 2. Type definitions
interface MyComponentProps {
  userId: string;
}

// 3. Component
const MyComponent: React.FC<MyComponentProps> = ({ userId }) => {
  // 3a. Hooks (in order)
  const { t } = useTranslation();
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // 3b. Effects
  useEffect(() => {
    fetchData();
  }, [userId]);

  // 3c. Functions
  const fetchData = async () => {
    // ...
  };

  // 3d. Render
  if (loading) return <Loading />;
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 4. Export
export default MyComponent;
```

### Naming Conventions
- **Components**: PascalCase - `UserProfile.tsx`
- **Hooks**: camelCase with 'use' prefix - `useAuth.ts`
- **Utils**: camelCase - `formatDate.ts`
- **Types**: PascalCase - `User`, `TeamMember`
- **Constants**: UPPER_SNAKE_CASE - `MAX_FILE_SIZE`
- **CSS classes**: kebab-case (Tailwind utilities)

## Imports

### Import Order (Enforced by ESLint)

The project uses `eslint-plugin-import-x` to automatically enforce import ordering. Imports are grouped and sorted as follows:

1. **React and React-related** - React core and React ecosystem packages
2. **External packages** - Third-party libraries from node_modules (alphabetically sorted)
3. **Internal modules** - Absolute imports (contexts, services, utilities)
4. **Relative imports** - Parent and sibling imports (../ and ./)
5. **Type imports** - TypeScript type imports
6. **Blank line** - Automatically added between groups

ESLint will automatically fix import order when you run:
```bash
pnpm lint:fix
```

**Example of correctly ordered imports:**
```typescript
// Group 1: React (always first)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Group 2: External packages (alphabetically)
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

// Group 3: Internal - contexts and hooks
import { useAuth } from '../../contexts/AuthContext';

// Group 4: Internal - services and utilities
import { apiService } from '../../services/api/service';
import { formatDate } from '../../utils/date';

// Group 5: Internal - components
import Button from '../shared/Button';
import Card from '../shared/Card';
import UserAvatar from './UserAvatar';

// Group 6: Types (always last)
import type { User } from '../../types/user';
```

### Import Rules
- `import-x/order` - Enforces the grouping and ordering above
- `import-x/first` - Ensures imports come first in file
- `import-x/newline-after-import` - Blank line after imports
- `import-x/no-duplicates` - Prevents duplicate imports

## Formatting

### Indentation
- Use **2 spaces** for indentation (not tabs)
- Nested JSX should be properly indented

### Line Length
- Keep lines under 100 characters when possible
- Break long prop lists across multiple lines

```typescript
// ✅ Good
<Button
  variant="primary"
  onClick={handleClick}
  disabled={loading}
  className="w-full"
>
  {t('common.submit')}
</Button>

// ❌ Bad - too long
<Button variant="primary" onClick={handleClick} disabled={loading} className="w-full">{t('common.submit')}</Button>
```

### Spacing
- One blank line between component sections
- No blank lines within import groups
- One blank line before return statement

## Comments

### When to Comment
- Complex logic that isn't immediately obvious
- Workarounds or hacks (with explanation)
- TODO items (with context)
- API integration notes

### Comment Style
```typescript
// ✅ Good - Explains WHY
// Debounce search to avoid excessive API calls
const debouncedSearch = useDebounce(searchTerm, 500);

// ❌ Bad - Explains WHAT (obvious from code)
// Set loading to true
setLoading(true);

// ✅ Good - TODO with context
// TODO: Replace with GraphQL subscription when backend supports it
const pollData = () => {
  // ...
};
```

## File Organization

### One Component Per File
Each component should have its own file, except for very small, tightly coupled components.

### File Naming
- Match component name: `UserProfile.tsx` exports `UserProfile`
- Test files: `UserProfile.test.tsx`
- Type files: `user.ts` (lowercase, matches domain)

## Error Handling

Always handle errors gracefully:
```typescript
try {
  await apiService.fetch();
  toast.success(t('success.message'));
} catch (error) {
  console.error('Error fetching data:', error);
  toast.error(t('error.message'));
}
```

## Performance

### Avoid Unnecessary Re-renders
- Use `React.memo` for expensive components
- Use `useMemo` and `useCallback` when appropriate
- Don't create functions inside render

```typescript
// ✅ Good
const handleClick = useCallback(() => {
  // ...
}, [dependency]);

// ❌ Bad
<Button onClick={() => handleSomething()} />
```

## Accessibility

- Always include ARIA labels where needed
- Use semantic HTML elements
- Ensure keyboard navigation works
- Test with screen readers when possible

```typescript
// ✅ Good
<button aria-label={t('common.delete')} onClick={handleDelete}>
  <TrashIcon />
</button>
```
