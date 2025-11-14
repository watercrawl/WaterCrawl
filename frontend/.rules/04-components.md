# Component Guidelines

## Component Philosophy

1. **Reuse Shared Components** - Check `/src/components/shared/` before creating new ones
2. **Single Responsibility** - Each component should have one clear purpose
3. **Composition over Configuration** - Build complex UIs from simple components
4. **Type Safety** - Always define prop interfaces

## Shared Components

### Available Components (36+)

Located in `/src/components/shared/`:

**Core UI:**
- `Button` - Styled button with variants
- `Input` - Form input with label and error handling
- `FormInput` - React Hook Form integrated input
- `Card` - Container with consistent styling
- `Modal` - Accessible modal dialog
- `Loading` - Loading spinner
- `StatusBadge` - Status indicator badge

**Data Display:**
- `Pagination` - Page navigation
- `Table` - Data table
- `EmptyState` - Empty data placeholder
- `ErrorBoundary` - Error handling wrapper

**Forms:**
- `Select` - Dropdown select
- `Checkbox` - Checkbox input
- `RadioGroup` - Radio button group
- `Toggle` - Toggle switch

## Using Shared Components

### Input Component

```typescript
import { Input } from '../../components/shared/Input';

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

### Button Component

```typescript
import Button from '../../components/shared/Button';

<Button
  variant="primary"
  onClick={handleSubmit}
  disabled={loading}
>
  {t('common.submit')}
</Button>
```

### Modal Component

**See `08-modals.md` for complete modal system documentation.**

```typescript
import { Modal } from '../../components/shared/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title={t('modal.title')}
  icon={DocumentIcon}
  size="md"
  footer={
    <>
      <Button onClick={onClose} variant="outline">
        {t('common.cancel')}
      </Button>
      <Button onClick={handleSubmit}>
        {t('common.save')}
      </Button>
    </>
  }
>
  <div className="space-y-4">
    {/* Modal content */}
  </div>
</Modal>
```

## Component Structure

### Standard Component Template

```typescript
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../../types/user';

interface MyComponentProps {
  user: User;
  onUpdate: (user: User) => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ user, onUpdate }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      // Action logic
      onUpdate(updatedUser);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

## Context Usage

### Available Contexts

Located in `/src/contexts/`:

1. **ThemeContext** - Light/dark theme management
2. **UserContext** - Current user state and authentication
3. **TeamContext** - Team/workspace management
4. **SettingsContext** - Application settings
5. **BreadcrumbContext** - Breadcrumb navigation
6. **ConfirmContext** - Confirmation dialogs

### Using Contexts

```typescript
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useTeam } from '../../contexts/TeamContext';

const MyComponent: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useUser();
  const { currentTeam, switchTeam } = useTeam();

  // Component logic
};
```

## Form Handling

### React Hook Form Pattern

```typescript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email().required(),
  name: yup.string().required(),
});

type FormData = yup.InferType<typeof schema>;

const MyForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // Submit logic
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label={t('form.email')}
        {...register('email')}
        error={errors.email?.message}
      />
      <Button type="submit">{t('common.submit')}</Button>
    </form>
  );
};
```

## Best Practices

1. **Check Shared Components First** - Don't reinvent the wheel
2. **Use TypeScript** - Define all prop types
3. **Handle Loading States** - Show feedback during async operations
4. **Error Handling** - Always catch and display errors gracefully
5. **Accessibility** - Use semantic HTML and ARIA attributes
6. **Translations** - Never hardcode text
7. **Responsive** - Design mobile-first with Tailwind breakpoints
8. **Performance** - Use React.memo, useMemo, useCallback appropriately
