# Modal System Guidelines

## Overview

WaterCrawl uses a unified Modal component system that provides consistent design, accessibility, and user experience across all modal dialogs in the application. All modals have been migrated to use this standardized system.

## Core Modal Component

### Modal Component (`/src/components/shared/Modal.tsx`)

The unified Modal component with modern design and structured layout for all modal dialogs.

**Key Features:**
- ✅ Structured header/body/footer layout
- ✅ Icon support with customizable colors
- ✅ Backdrop blur effect
- ✅ Automatic focus management
- ✅ ESC key to close
- ✅ Click outside to close
- ✅ Dark/light theme support
- ✅ Multiple size options (sm to 7xl + full)
- ✅ ARIA attributes for accessibility
- ✅ Form integration support

## Modal Props Reference

```typescript
interface ModalProps {
  isOpen: boolean;              // Control modal visibility
  onClose: () => void;          // Close handler
  title: string;                // Modal title (required)
  description?: string;         // Optional subtitle/description
  icon?: React.ComponentType;   // Optional header icon
  iconClassName?: string;       // Icon color classes
  iconBgClassName?: string;     // Icon background classes
  size?: ModalSize;             // Modal width (sm to 7xl)
  footer?: React.ReactNode;     // Optional footer content
  children: React.ReactNode;    // Modal body content
}
```

## Size Options

```typescript
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';

// Examples:
'sm'   // max-w-sm  (384px)  - Simple forms, confirmations
'md'   // max-w-md  (448px)  - Standard forms
'lg'   // max-w-lg  (512px)  - Medium content
'xl'   // max-w-xl  (576px)  - Larger forms
'2xl'  // max-w-2xl (672px)  - Wide content
'3xl'  // max-w-3xl (768px)  - Extra wide
'4xl'  // max-w-4xl (896px)  - Large content
'5xl'  // max-w-5xl (1024px) - Very large content
```

## Basic Usage

### Simple Modal

```typescript
import { Modal } from '../shared/Modal';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const MyComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={t('modal.title')}
      icon={InformationCircleIcon}
      size="md"
    >
      <div className="space-y-4">
        {/* Modal content */}
      </div>
    </Modal>
  );
};
```

### Modal with Footer Buttons

```typescript
import { Modal } from '../shared/Modal';
import { PlusIcon } from '@heroicons/react/24/outline';
import Button from '../shared/Button';

const CreateModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={t('modal.createTitle')}
      icon={PlusIcon}
      size="md"
      footer={
        <>
          <Button onClick={() => setIsOpen(false)} variant="outline">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit}>
            {t('common.create')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Form fields */}
      </div>
    </Modal>
  );
};
```

## Modal with Form

When using forms in modals, use the `form` ID attribute to connect the submit button in the footer:

```typescript
import { Modal } from '../shared/Modal';
import Button from '../shared/Button';

const FormModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Submit logic
      setIsOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={t('modal.formTitle')}
      icon={DocumentIcon}
      size="md"
      footer={
        <>
          <Button onClick={() => setIsOpen(false)} variant="outline">
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="my-form-id" disabled={loading}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id="my-form-id" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label={t('form.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </form>
    </Modal>
  );
};
```

## Icon Variants

### Standard Icon Colors

```typescript
// Primary (default)
icon={DocumentIcon}

// Success
icon={CheckCircleIcon}
iconClassName="h-5 w-5 text-success"
iconBgClassName="bg-success-soft"

// Warning
icon={ExclamationTriangleIcon}
iconClassName="h-5 w-5 text-warning"
iconBgClassName="bg-warning-soft"

// Error
icon={XCircleIcon}
iconClassName="h-5 w-5 text-error"
iconBgClassName="bg-error-soft"

// Info
icon={InformationCircleIcon}
iconClassName="h-5 w-5 text-info"
iconBgClassName="bg-info-soft"
```

## Common Modal Patterns

### Confirmation Modal (Using ConfirmContext)

For simple confirmations, use the global ConfirmContext:

```typescript
import { useConfirm } from '../../contexts/ConfirmContext';

const MyComponent: React.FC = () => {
  const confirm = useConfirm();

  const handleDelete = async () => {
    const result = await confirm({
      title: t('confirm.deleteTitle'),
      message: t('confirm.deleteMessage'),
      variant: 'danger',
    });

    if (result) {
      // Proceed with deletion
    }
  };
};
```

### Content Display Modal

```typescript
// For displaying content with tabs, large data, etc.
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title={result.url}
  description={t('results.description')}
  icon={DocumentTextIcon}
  size="5xl"
>
  <Tab.Group>
    {/* Tab content */}
  </Tab.Group>
</Modal>
```

### Settings/Configuration Modal

```typescript
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title={t('settings.title')}
  icon={CogIcon}
  size="md"
  footer={
    <>
      <Button onClick={onClose} variant="outline">
        {t('common.cancel')}
      </Button>
      <Button onClick={handleTest} variant="secondary">
        {t('common.test')}
      </Button>
      <Button type="submit" form="config-form">
        {t('common.save')}
      </Button>
    </>
  }
>
  <form id="config-form" onSubmit={handleSubmit}>
    {/* Configuration fields */}
  </form>
</Modal>
```

## Migrated Modals Reference

All the following modals use the unified Modal system:

1. **ApiKeysPage** - API key creation (size: `md`)
2. **SitemapModal** - Sitemap explorer with tabs (size: `4xl`)
3. **AboutModal** - Company information (size: `sm`)
4. **ResultModal** - Crawl result viewer with Monaco Editor (size: `5xl`)
5. **TeamSelector** - Team creation (size: `md`)
6. **ProxyForm** - Proxy server configuration (size: `md`)
7. **ProviderConfigForm** - LLM provider configuration (size: `md`)

## Modal Best Practices

### 1. Always Use Translations

```typescript
// ✅ CORRECT
<Modal title={t('modal.title')} />

// ❌ WRONG
<Modal title="Create New Item" />
```

### 2. Provide Icons for Context

```typescript
// ✅ CORRECT - Icon provides visual context
<Modal
  title={t('user.create')}
  icon={UserPlusIcon}
/>

// ❌ WRONG - No icon
<Modal title={t('user.create')} />
```

### 3. Choose Appropriate Sizes

```typescript
// ✅ CORRECT - Size matches content
<Modal size="sm">  {/* Simple confirmation */}
<Modal size="md">  {/* Standard form */}
<Modal size="5xl"> {/* Large content viewer */}

// ❌ WRONG - Size too large for simple content
<Modal size="7xl">
  <p>Are you sure?</p>
</Modal>
```

### 4. Handle Loading States

```typescript
// ✅ CORRECT
<Button type="submit" disabled={loading}>
  {loading ? t('common.saving') : t('common.save')}
</Button>

// ❌ WRONG - No loading feedback
<Button type="submit">
  {t('common.save')}
</Button>
```

### 5. Structure Footer Buttons Properly

```typescript
// ✅ CORRECT - Cancel first, actions last
footer={
  <>
    <Button variant="outline">{t('common.cancel')}</Button>
    <Button variant="secondary">{t('common.test')}</Button>
    <Button>{t('common.save')}</Button>
  </>
}

// ❌ WRONG - Poor button ordering
footer={
  <>
    <Button>{t('common.save')}</Button>
    <Button variant="outline">{t('common.cancel')}</Button>
  </>
}
```

### 6. Use Form IDs for Submit Buttons

```typescript
// ✅ CORRECT - Form can be submitted from footer
<form id="my-form" onSubmit={handleSubmit}>
  {/* Form fields */}
</form>
<Button type="submit" form="my-form">Submit</Button>

// ❌ WRONG - Submit button inside form (breaks footer layout)
<form onSubmit={handleSubmit}>
  <Button type="submit">Submit</Button>
</form>
```

## Styling Guidelines

### Body Content Spacing

```typescript
// ✅ CORRECT - Use space-y-4 for vertical spacing
<Modal>
  <div className="space-y-4">
    <Input />
    <Input />
  </div>
</Modal>
```

### Input Styling

```typescript
// ✅ CORRECT - Use rounded-lg for consistency
className="mt-1 block w-full rounded-lg border border-input-border bg-input text-foreground"

// ❌ WRONG - Don't use rounded-md
className="mt-1 block w-full rounded-md"
```

### Error Display

```typescript
// ✅ CORRECT - Show errors below inputs
{errors.field && (
  <p className="mt-1 text-sm text-error">{errors.field}</p>
)}
```

## Accessibility

All modals automatically include:
- ✅ Focus trap (focus stays within modal)
- ✅ ESC key closes modal
- ✅ Click outside closes modal
- ✅ Proper ARIA attributes
- ✅ Screen reader support
- ✅ Keyboard navigation

## Common Mistakes to Avoid

### ❌ Don't Use Dialog Directly

```typescript
// ❌ WRONG - Don't use @headlessui/react Dialog directly
import { Dialog } from '@headlessui/react';
<Dialog open={isOpen} onClose={onClose}>
  {/* content */}
</Dialog>

// ✅ CORRECT - Use Modal component
import { Modal } from '../shared/Modal';
<Modal isOpen={isOpen} onClose={onClose}>
  {/* content */}
</Modal>
```

### ❌ Don't Hardcode Styles

```typescript
// ❌ WRONG
<div className="fixed inset-0 z-50 bg-black/50">

// ✅ CORRECT - Use Modal component which handles this
<Modal isOpen={isOpen} onClose={onClose}>
```

### ❌ Don't Nest Modals Deeply

```typescript
// ❌ WRONG - Avoid modal within modal
<Modal>
  <Modal>
    <Modal>
      {/* Too deep! */}
    </Modal>
  </Modal>
</Modal>

// ✅ CORRECT - Use sequential modals or drawer pattern
```

## Documentation

For complete documentation and examples:
- **Component Guide**: `/src/components/shared/MODAL_GUIDE.md`
- **Migration Summary**: `/MODAL_MIGRATION_SUMMARY.md`

## Summary

- ✅ Always use the `Modal` component from `/src/components/shared/Modal.tsx`
- ✅ Never use HeadlessUI `Dialog` directly
- ✅ Provide icons for visual context
- ✅ Choose appropriate sizes
- ✅ Structure footer buttons properly (Cancel → Secondary actions → Primary action)
- ✅ Use form IDs to connect submit buttons
- ✅ Handle loading and error states
- ✅ Always translate text
- ✅ Follow semantic color tokens for icons
