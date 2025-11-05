# Best Practices & Common Patterns

## Code Quality

### 1. Type Safety
```typescript
// ✅ DO: Define types explicitly
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = { id: '1', name: 'John', email: 'john@example.com' };

// ❌ DON'T: Use any
const user: any = { ... };
```

### 2. Null Safety
```typescript
// ✅ DO: Handle null/undefined
const userName = user?.name || t('common.unknown');

// ❌ DON'T: Assume values exist
const userName = user.name; // May crash if user is null
```

### 3. Avoid Magic Numbers/Strings
```typescript
// ✅ DO: Use constants
const PAGE_SIZE = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ❌ DON'T: Use magic numbers
if (files.length > 5) { ... }
```

## Performance

### 1. Memoization
```typescript
// Expensive computation
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// Callback optimization
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### 2. Avoid Inline Functions
```typescript
// ✅ DO: Define functions outside render
const handleClick = () => { ... };
<Button onClick={handleClick} />

// ❌ DON'T: Create new functions on every render
<Button onClick={() => doSomething()} />
```

### 3. Lazy Loading
```typescript
// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

## Security

### 1. XSS Prevention
```typescript
// ✅ DO: React automatically escapes content
<div>{userInput}</div>

// ❌ DON'T: Use dangerouslySetInnerHTML unless necessary
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 2. Authentication
```typescript
// Always check authentication before sensitive operations
const { isAuthenticated } = useUser();

if (!isAuthenticated) {
  return <Navigate to="/login" />;
}
```

### 3. API Keys
```typescript
// ✅ DO: Use environment variables
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ DON'T: Hardcode sensitive data
const apiKey = "sk-1234567890"; // NEVER
```

## Accessibility

### 1. Semantic HTML
```typescript
// ✅ DO: Use semantic elements
<button onClick={handleClick}>Click me</button>
<nav>...</nav>
<main>...</main>

// ❌ DON'T: Use divs for everything
<div onClick={handleClick}>Click me</div>
```

### 2. ARIA Labels
```typescript
// ✅ DO: Add labels for icon buttons
<button aria-label={t('common.delete')} onClick={handleDelete}>
  <TrashIcon />
</button>
```

### 3. Keyboard Navigation
```typescript
// Ensure all interactive elements are keyboard accessible
<div
  role="button"
  tabIndex={0}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
>
  {t('common.action')}
</div>
```

## Error Boundaries

### Component-Level Error Handling
```typescript
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error) => console.error('Error:', error)}
>
  <MyComponent />
</ErrorBoundary>
```

## State Management

### 1. Local vs Global State
- **Local State** (useState): Component-specific data
- **Global State** (Context): Shared data (theme, user, team)
- **Server State** (React Query/SWR): API data (consider future adoption)

### 2. State Updates
```typescript
// ✅ DO: Use functional updates for dependent state
setCount(prev => prev + 1);

// ❌ DON'T: Direct updates with stale closures
setCount(count + 1);
```

## Code Organization

### 1. File Structure
```
MyFeature/
├── MyFeature.tsx        # Main component
├── MyFeature.test.tsx   # Tests
├── components/          # Sub-components
│   ├── SubComponent.tsx
│   └── AnotherComponent.tsx
├── hooks/               # Feature-specific hooks
│   └── useMyFeature.ts
└── types.ts             # Feature-specific types
```

### 2. Export Pattern
```typescript
// ✅ DO: Default export for components
export default MyComponent;

// ✅ DO: Named exports for utilities/hooks
export const useMyHook = () => { ... };
export const myUtil = () => { ... };
```

## Common Patterns

### 1. Conditional Rendering
```typescript
// Short circuit
{isLoading && <Loading />}

// Ternary for if-else
{isLoading ? <Loading /> : <Content />}

// Early return for complex conditions
if (isLoading) return <Loading />;
if (error) return <Error message={error} />;
return <Content />;
```

### 2. List Rendering
```typescript
{items.map((item) => (
  <ItemCard
    key={item.id} // Always use stable keys
    item={item}
  />
))}
```

### 3. Optional Chaining
```typescript
// ✅ DO: Safe property access
const value = user?.profile?.avatar?.url;

// ❌ DON'T: Multiple checks
const value = user && user.profile && user.profile.avatar && user.profile.avatar.url;
```

## Testing Mindset

When writing components, consider:
1. Can this be unit tested?
2. Are dependencies injectable?
3. Is the component pure (same props = same output)?
4. Can I test this without mocking too much?

## Documentation

### When to Add Comments
- Complex algorithms or business logic
- Workarounds or hacks (with explanation of why)
- Public API or reusable utilities
- TODOs with context

### When NOT to Comment
- Obvious code (let the code speak for itself)
- Outdated comments (remove or update)
- Instead of refactoring (fix the code, don't explain bad code)

## Git Commit Messages

```bash
# Good commit messages
feat: add team member invitation feature
fix: resolve member count pluralization issue
refactor: extract API calls to service module
style: update button colors to use semantic tokens
docs: add API integration guidelines

# Use conventional commits format
type(scope): description
```

## Before Submitting Changes

Checklist:
- [ ] Code follows style guidelines
- [ ] All text is translated (no hardcoded strings)
- [ ] Colors use semantic tokens (no numbered variants)
- [ ] Shared components are used where applicable
- [ ] Error handling is implemented
- [ ] Loading states are shown
- [ ] TypeScript types are defined
- [ ] Code is formatted consistently
- [ ] No console.log statements (except in error handlers)
- [ ] Tested in multiple languages
- [ ] Tested light and dark modes
- [ ] Responsive on mobile and desktop
