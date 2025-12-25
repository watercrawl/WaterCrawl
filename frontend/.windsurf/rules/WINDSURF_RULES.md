---
trigger: always_on
---

# WaterCrawl Frontend - Windsurf AI Coding Rules

## Project Overview

WaterCrawl is a comprehensive web crawling platform with intelligent data extraction and LLM integration capabilities. The frontend is a React-based single-page application providing an intuitive interface for web crawling, search, sitemap generation, and knowledge base management.

### Tech Stack
- **Framework**: React 18.3.1 + TypeScript 5.6.3 + Vite
- **Styling**: Tailwind CSS 3.4.17 with custom semantic design system
- **Forms**: React Hook Form 7.58.1 + Yup validation
- **i18n**: i18next (10 languages: English, German, Arabic, Spanish, French, Italian, Persian, Japanese, Portuguese, Chinese)
- **HTTP**: Axios 1.10.0 with centralized API services
- **State**: React Context API (ThemeContext, UserContext, TeamContext, SettingsContext, BreadcrumbContext, ConfirmContext)
- **Routing**: React Router 7.6.2
- **Package Manager**: pnpm (prefer over npm/yarn)

### Project Structure
```
frontend/
├── .rules/              # Detailed AI coding rules
├── public/locales/      # Translation files (10 languages)
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── shared/      # 36+ common components
│   │   ├── auth/        # Authentication components
│   │   ├── crawl/       # Crawling-related components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── forms/       # Form components
│   │   ├── json-forms/  # Dynamic form generation
│   │   ├── knowledge/   # Knowledge base components
│   │   ├── search/      # Search components
│   │   └── sitemap/     # Sitemap components
│   ├── contexts/        # React contexts (6 total)
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Page layouts (4 total)
│   ├── pages/           # Page components (48 total)
│   ├── services/api/    # API services (20+ modules)
│   ├── types/           # TypeScript definitions (16 files)
│   └── utils/           # Utility functions
└── tailwind.config.mjs  # Tailwind configuration with semantic colors
```

---

## Core Principles (MUST FOLLOW)

### 1. ✅ Use Semantic Color Tokens
**NEVER** use numbered color variants like `primary-500`, `primary-600`, etc.

```tsx
// ✅ CORRECT
<button className="bg-primary text-primary-foreground hover:bg-primary-hover">

// ❌ WRONG - Never use these
<button className="bg-primary-500 text-primary-600">
```

**Available Semantic Colors:**
- `primary` / `primary-foreground` / `primary-hover` / `primary-soft` / `primary-strong`
- `secondary` / `secondary-foreground`
- `success` / `success-foreground` / `success-soft`
- `warning` / `warning-foreground` / `warning-soft`
- `danger` / `danger-foreground` / `danger-soft`
- `info` / `info-foreground` / `info-soft`
- `card` / `card-foreground`
- `background` / `foreground`
- `muted` / `muted-foreground`
- `accent` / `accent-foreground`
- `destructive` / `destructive-foreground`
- `border` / `input` / `ring`

### 2. ✅ Always Translate Text
**NEVER** use hardcoded text strings. Always use i18next translation keys.

```tsx
// ✅ CORRECT
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<button>{t('common.submit')}</button>
<input placeholder={t('form.emailPlaceholder')} />

// ❌ WRONG
<button>Submit</button>
<input placeholder="Enter email" />
```

### 3. ✅ Reuse Shared Components
Check `/src/components/shared/` before creating new components.

**Available Shared Components:**
- `Button` - Styled button with variants
- `Input`, `FormInput` - Form inputs with validation
- `Card` - Container with consistent styling
- `Modal` - Accessible modal dialog
- `Loading` - Loading spinner
- `StatusBadge` - Status indicator badge
- `Pagination` - Page navigation
- `Table` - Data table
- `Select`, `Checkbox`, `RadioGroup`, `Toggle` - Form controls
- And 20+ more...

### 4. ✅ Type Everything
**NEVER** use `any` types. Define all types explicitly.

```typescript
// ✅ CORRECT
interface UserProps {
  user: User;
  onUpdate: (user: User) => void;
}

// ❌ WRONG
interface UserProps {
  user: any;
  onUpdate: Function;
}
```

### 5. ✅ Handle Errors Gracefully
Always use try-catch with toast notifications.

```typescript
import toast from 'react-hot-toast';

try {
  await apiService.action();
  toast.success(t('toast.success'));
} catch (error: any) {
  console.error('Error:', error);
  toast.error(error.response?.data?.message || t('errors.generic'));
}
```

### 6. ✅ Show Loading States
Provide feedback during async operations.

```typescript
const [loading, setLoading] = useState(false);

// In JSX
{loading && <Loading />}
<Button disabled={loading}>
  {loading ? t('common.loading') : t('common.submit')}
</Button>
```

### 7. ✅ Mobile-First Responsive
Design for mobile first, enhance for desktop.

```tsx
// ✅ CORRECT - mobile first
<div className="w-full md:w-1/2 lg:w-1/3">

// ❌ WRONG - desktop first
<div className="w-1/3 md:w-full">
```

### 8. ✅ Follow Existing Patterns
Maintain consistency with the codebase.

---

## Component Structure

### Standard Component Template

```typescript
// 1. Imports (grouped and auto-sorted by ESLint)
import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api/service';

import Button from '../shared/Button';
import Loading from '../shared/Loading';

import type { User } from '../../types/user';

// 2. Type definitions
interface MyComponentProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

// 3. Component
const MyComponent: React.FC<MyComponentProps> = ({ userId, onUpdate }) => {
  // 3a. Hooks (in order)
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // 3b. Effects
  useEffect(() => {
    fetchData();
  }, [userId]);

  // 3c. Functions
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiService.getData(userId);
      setData(response.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  // 3d. Early returns
  if (loading) return <Loading />;
  if (!data) return null;

  // 3e. Main render
  return (
    <div className="bg-card p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-foreground">
        {t('section.title')}
      </h2>
      {/* Component content */}
    </div>
  );
};

// 4. Export
export default MyComponent;
```

---

## Import Order (Auto-Fixed by ESLint)

Run `pnpm lint:fix` to automatically organize imports. The order is:

1. **React** - React core and React ecosystem
2. **External packages** - Third-party libraries (alphabetically)
3. **Internal modules** - Contexts, services, utilities
4. **Relative imports** - Parent and sibling imports
5. **Type imports** - TypeScript types (always last)

**Example:**
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api/service';

import Button from '../shared/Button';

import type { User } from '../../types/user';
```

---

## API Integration

### API Services Location
All API calls are centralized in `/src/services/api/`:
- `auth.ts` - Authentication
- `user.ts` - User management
- `team.ts` - Team operations
- `crawl.ts` - Web crawling
- `search.ts` - Search functionality
- `sitemap.ts` - Sitemap generation
- `knowledgeBase.ts` - Knowledge base operations
- And 10+ more...

### Standard API Call Pattern

```typescript
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { crawlApi } from '../../services/api/crawl';

const MyComponent: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DataType | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await crawlApi.getCrawls();
      setData(response.data);
      // Only toast success for mutations (create/update/delete)
      // toast.success(t('toast.success'));
    } catch (error: any) {
      console.error('Error:', error);
      const message = error.response?.data?.message 
        || error.response?.data?.detail
        || t('errors.generic');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <Loading />}
      {data && <DisplayData data={data} />}
    </div>
  );
};
```

---

## Styling Guidelines

### Tailwind Utility Classes
**Always** use Tailwind utility classes. **Never** write custom CSS unless absolutely necessary.

### Common Component Patterns

#### Buttons
```tsx
// Primary Button
<button className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50">
  {t('common.submit')}
</button>

// Secondary Button
<button className="inline-flex items-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
  {t('common.cancel')}
</button>

// Destructive Button
<button className="inline-flex items-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
  {t('common.delete')}
</button>
```

#### Cards
```tsx
// Basic Card
<div className="overflow-hidden rounded-lg bg-card shadow-sm ring-1 ring-border">
  <div className="px-6 py-5">
    {/* Content */}
  </div>
</div>

// Card with Header
<div className="overflow-hidden rounded-lg bg-card shadow-sm ring-1 ring-border">
  <div className="border-b border-border bg-muted/50 px-6 py-4">
    <h3 className="text-base font-semibold text-foreground">
      {t('card.title')}
    </h3>
  </div>
  <div className="px-6 py-5">
    {/* Content */}
  </div>
</div>
```

#### Form Inputs
```tsx
// Use Shared Input Component (Preferred)
import { Input } from '../shared/Input';

<Input
  type="text"
  label={t('form.email')}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder={t('form.emailPlaceholder')}
  error={errors.email}
  required
/>
```

#### Badges
```tsx
// Primary Badge
<span className="inline-flex items-center rounded-md bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
  {status}
</span>

// Success Badge
<span className="inline-flex items-center rounded-md bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
  {t('status.completed')}
</span>

// Warning Badge
<span className="inline-flex items-center rounded-md bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">
  {t('status.pending')}
</span>
```

### Responsive Breakpoints
```typescript
sm: '640px'   // Small devices
md: '768px'   // Medium devices
lg: '1024px'  // Large devices
xl: '1280px'  // Extra large devices
2xl: '1536px' // 2X large devices
```

### Typography
```tsx
text-xs    // 12px - Fine print
text-sm    // 14px - Small text, labels
text-base  // 16px - Body text (default)
text-lg    // 18px - Larger body text
text-xl    // 20px - Section headers
text-2xl   // 24px - Page titles

font-normal   // 400 - Body text
font-medium   // 500 - Emphasis
font-semibold // 600 - Headings
font-bold     // 700 - Strong emphasis
```

### Spacing
Common spacings:
- `p-4` / `px-4 py-4` - Standard padding
- `p-6` / `px-6 py-5` - Card padding
- `space-y-4` - Vertical spacing between elements
- `gap-x-3` - Horizontal gap in flex/grid

---

## Form Handling

### React Hook Form Pattern

```typescript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email(t('errors.emailInvalid')).required(t('errors.required')),
  name: yup.string().required(t('errors.required')),
});

type FormData = yup.InferType<typeof schema>;

const MyForm: React.FC = () => {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await apiService.submit(data);
      toast.success(t('toast.success'));
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || t('errors.generic'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label={t('form.email')}
        {...register('email')}
        error={errors.email?.message}
      />
      <Input
        label={t('form.name')}
        {...register('name')}
        error={errors.name?.message}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('common.loading') : t('common.submit')}
      </Button>
    </form>
  );
};
```

---

## Context Usage

### Available Contexts

```typescript
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useTeam } from '../../contexts/TeamContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useConfirm } from '../../contexts/ConfirmContext';

const MyComponent: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useUser();
  const { currentTeam, switchTeam } = useTeam();
  const { confirm } = useConfirm();

  // Use confirmation dialog
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('confirm.deleteTitle'),
      message: t('confirm.deleteMessage'),
      confirmText: t('common.delete'),
    });

    if (confirmed) {
      // Perform deletion
    }
  };
};
```

---

## Best Practices

### Performance
```typescript
// Use memoization for expensive computations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);

// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

### Security
```typescript
// ✅ DO: Use environment variables
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ DON'T: Hardcode sensitive data
const apiKey = "sk-1234567890"; // NEVER

// ✅ DO: Check authentication
const { isAuthenticated } = useUser();
if (!isAuthenticated) {
  return <Navigate to="/login" />;
}
```

### Accessibility
```typescript
// ✅ DO: Use semantic HTML
<button onClick={handleClick}>{t('common.action')}</button>
<nav>...</nav>
<main>...</main>

// ✅ DO: Add ARIA labels for icon buttons
<button aria-label={t('common.delete')} onClick={handleDelete}>
  <TrashIcon className="h-5 w-5" />
</button>

// ✅ DO: Ensure keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
>
  {t('common.action')}
</div>
```

### Error Handling
```typescript
// Always handle errors gracefully
try {
  await apiService.action();
  toast.success(t('toast.success'));
} catch (error: any) {
  console.error('Error:', error);
  // Extract error message from response
  const message = error.response?.data?.message 
    || error.response?.data?.detail
    || t('errors.generic');
  toast.error(message);
}
```

### State Management
```typescript
// ✅ DO: Use functional updates for dependent state
setCount(prev => prev + 1);

// ❌ DON'T: Direct updates with stale closures
setCount(count + 1);

// ✅ DO: Null safety
const userName = user?.name || t('common.unknown');

// ❌ DON'T: Assume values exist
const userName = user.name; // May crash if user is null
```

---

## Naming Conventions

- **Components**: PascalCase - `UserProfile.tsx`
- **Hooks**: camelCase with 'use' prefix - `useAuth.ts`
- **Utils**: camelCase - `formatDate.ts`
- **Types**: PascalCase - `User`, `TeamMember`
- **Constants**: UPPER_SNAKE_CASE - `MAX_FILE_SIZE`
- **Translation keys**: dot.notation.camelCase - `common.submit`, `settings.team.name`

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint and auto-fix (including import sorting)
pnpm lint:fix

# Type checking
pnpm typecheck
```

---

## Pre-Commit Checklist

Before submitting changes, ensure:
- [ ] Code follows style guidelines
- [ ] All text is translated (no hardcoded strings)
- [ ] Colors use semantic tokens (no numbered variants like `primary-500`)
- [ ] Shared components are used where applicable
- [ ] Error handling is implemented with try-catch and toast
- [ ] Loading states are shown during async operations
- [ ] TypeScript types are defined (no `any` types)
- [ ] Imports are organized (run `pnpm lint:fix`)
- [ ] Code is formatted consistently
- [ ] No console.log statements (except in error handlers)
- [ ] Tested in multiple languages (switch language to verify)
- [ ] Tested in both light and dark modes
- [ ] Responsive on mobile and desktop

---

## Common Mistakes to Avoid

### ❌ DON'T
```typescript
// DON'T use numbered color variants
<div className="bg-primary-500 text-primary-600">

// DON'T hardcode text
<button>Submit</button>

// DON'T use any types
const user: any = { ... };

// DON'T create inline functions
<Button onClick={() => doSomething()} />

// DON'T use divs for buttons
<div onClick={handleClick}>Click me</div>

// DON'T write custom CSS
<div style={{ color: 'blue' }}>

// DON'T forget error handling
await apiService.action(); // No try-catch!

// DON'T skip loading states
const data = await fetchData(); // No loading indicator!
```

### ✅ DO
```typescript
// DO use semantic colors
<div className="bg-primary text-primary-foreground">

// DO translate text
<button>{t('common.submit')}</button>

// DO define types
const user: User = { ... };

// DO define functions outside render
const handleClick = () => doSomething();
<Button onClick={handleClick} />

// DO use semantic HTML
<button onClick={handleClick}>{t('common.action')}</button>

// DO use Tailwind classes
<div className="text-primary">

// DO handle errors
try {
  await apiService.action();
} catch (error) {
  toast.error(t('errors.generic'));
}

// DO show loading states
{loading && <Loading />}
```

---

## Additional Resources

For more detailed information, refer to the `.rules/` directory:
- `00-project-overview.md` - Project architecture and structure
- `01-code-style.md` - TypeScript conventions and formatting
- `02-design-system.md` - Tailwind CSS and design tokens
- `03-internationalization.md` - i18next usage and translation
- `04-components.md` - Component patterns and shared components
- `05-api-integration.md` - API services and error handling
- `06-best-practices.md` - Performance, security, and patterns
- `07-eslint-import-sorting.md` - ESLint import ordering rules

---

## Summary

WaterCrawl is a well-structured React application with:
- **Semantic design system** - Never use numbered color variants
- **Full internationalization** - Always translate text
- **Comprehensive shared components** - Reuse before creating new
- **Type-safe** - TypeScript everywhere, no `any` types
- **Error handling** - Try-catch with toast notifications
- **Loading states** - User feedback during async operations
- **Mobile-first** - Responsive design with Tailwind
- **Consistent patterns** - Follow existing codebase conventions

**When in doubt, check existing components for patterns and always prioritize consistency!**