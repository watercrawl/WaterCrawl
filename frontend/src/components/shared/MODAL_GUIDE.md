# Modal System Guide

This guide explains how to use the unified Modal component in WaterCrawl.

## Component

**Modal** (`Modal.tsx`) - Unified modal component for all modal dialogs

The Modal component provides a modern design with:

- Structured header, body, and footer sections
- Optional icon support
- Backdrop blur effect
- Consistent styling across the app
- Responsive sizing

## Basic Usage

### Simple Modal

```tsx
import { Modal } from '../../components/shared/Modal';
import { PlusIcon } from '@heroicons/react/24/outline';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New Item" icon={PlusIcon}>
      <p>Modal content goes here</p>
    </Modal>
  );
}
```

### Modal with Footer

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  icon={ExclamationTriangleIcon}
  iconClassName="h-5 w-5 text-warning"
  iconBgClassName="bg-warning-soft"
  footer={
    <>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="my-form"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
      >
        Submit
      </button>
    </>
  }
>
  <form id="my-form" onSubmit={handleSubmit}>
    {/* Form fields */}
  </form>
</Modal>
```

### Modal with Description

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="API Key Details"
  description="View and manage your API key"
  icon={KeyIcon}
>
  <div className="space-y-4">{/* Content */}</div>
</Modal>
```

## Props

| Prop                  | Type            | Default                  | Description                     |
| --------------------- | --------------- | ------------------------ | ------------------------------- |
| `isOpen`              | `boolean`       | Required                 | Controls modal visibility       |
| `onClose`             | `() => void`    | Required                 | Called when modal closes        |
| `title`               | `string`        | Optional                 | Modal title                     |
| `description`         | `string`        | Optional                 | Subtitle below title            |
| `icon`                | `ComponentType` | Optional                 | Icon component (from Heroicons) |
| `iconClassName`       | `string`        | `'h-5 w-5 text-primary'` | Icon styling                    |
| `iconBgClassName`     | `string`        | `'bg-primary-soft'`      | Icon background styling         |
| `children`            | `ReactNode`     | Required                 | Modal body content              |
| `footer`              | `ReactNode`     | Optional                 | Footer content (buttons, etc.)  |
| `size`                | `ModalSize`     | `'md'`                   | Modal width                     |
| `showCloseButton`     | `boolean`       | `true`                   | Show X button in header         |
| `closeOnOverlayClick` | `boolean`       | `true` (Modal only)      | Close when clicking backdrop    |
| `headerClassName`     | `string`        | Optional (Modal only)    | Custom header classes           |
| `bodyClassName`       | `string`        | Optional (Modal only)    | Custom body classes             |
| `footerClassName`     | `string`        | Optional (Modal only)    | Custom footer classes           |
| `className`           | `string`        | Optional (Modal only)    | Custom panel classes            |

## Size Options

- `sm` - 384px
- `md` - 448px (default)
- `lg` - 512px
- `xl` - 576px
- `2xl` - 672px
- `3xl` - 768px
- `4xl` - 896px
- `5xl` - 1024px
- `6xl` - 1152px
- `7xl` - 1280px
- `full` - 90vw

## Icon Variants

### Primary (default)

```tsx
icon = { PlusIcon };
iconClassName = 'h-5 w-5 text-primary';
iconBgClassName = 'bg-primary-soft';
```

### Success

```tsx
icon = { CheckIcon };
iconClassName = 'h-5 w-5 text-success';
iconBgClassName = 'bg-success-soft';
```

### Warning

```tsx
icon = { ExclamationTriangleIcon };
iconClassName = 'h-5 w-5 text-warning';
iconBgClassName = 'bg-warning-soft';
```

### Danger

```tsx
icon = { TrashIcon };
iconClassName = 'h-5 w-5 text-danger';
iconBgClassName = 'bg-danger-soft';
```

### Info

```tsx
icon = { InformationCircleIcon };
iconClassName = 'h-5 w-5 text-info';
iconBgClassName = 'bg-info-soft';
```

## Design Structure

All modals follow this structure:

```
┌─────────────────────────────────────┐
│ Header (border-b, bg-muted/30)      │
│  [Icon] Title                    [X]│
│        Description                  │
├─────────────────────────────────────┤
│ Body (px-6 py-6)                    │
│                                     │
│  Content goes here                  │
│                                     │
├─────────────────────────────────────┤
│ Footer (border-t, bg-muted/20)      │
│                   [Cancel] [Submit] │
└─────────────────────────────────────┘
```

## Button Styling

### Standard Buttons

**Cancel/Secondary:**

```tsx
className =
  'inline-flex justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';
```

**Submit/Primary:**

```tsx
className =
  'inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';
```

**Danger:**

```tsx
className =
  'inline-flex justify-center rounded-lg bg-danger px-4 py-2 text-sm font-medium text-danger-foreground transition-all hover:bg-danger/90 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2';
```

## Form Integration

When using forms inside modals, use the `form` attribute on buttons:

```tsx
<Modal
  footer={
    <>
      <button type="button" onClick={() => setIsOpen(false)}>
        Cancel
      </button>
      <button type="submit" form="my-form-id">
        Submit
      </button>
    </>
  }
>
  <form id="my-form-id" onSubmit={handleSubmit}>
    {/* Form fields */}
  </form>
</Modal>
```

## Examples from Codebase

### API Keys Modal (ApiKeysPage.tsx)

```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title={t('apiKeys.createNew')}
  icon={KeyIcon}
  size="md"
  footer={
    <>
      <button type="button" onClick={() => setIsModalOpen(false)}>
        {t('common.cancel')}
      </button>
      <button type="submit" form="create-key-form">
        {t('common.submit')}
      </button>
    </>
  }
>
  <form id="create-key-form" onSubmit={createApiKey}>
    <Input ... />
  </form>
</Modal>
```

### Confirm Dialog (ConfirmContext.tsx)

The `ConfirmContext` uses a similar design pattern but is automatically wrapped in the provider.

## Migration Guide

### Before (Old Inline Modal)

```tsx
<Transition appear show={isOpen} as={Fragment}>
  <Dialog as="div" className="relative z-10" onClose={onClose}>
    <Transition.Child ...>
      <div className="fixed inset-0 bg-black bg-opacity-25" />
    </Transition.Child>
    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <Transition.Child ...>
          <Dialog.Panel className="w-full max-w-md ...">
            <Dialog.Title>{title}</Dialog.Title>
            {children}
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </div>
  </Dialog>
</Transition>
```

### After (New Modal)

```tsx
<Modal isOpen={isOpen} onClose={onClose} title={title} icon={SomeIcon}>
  {children}
</Modal>
```

## Best Practices

1. **Always use icons** - They improve visual hierarchy
2. **Use semantic colors** - Match icon colors to action types
3. **Structure content** - Use footer for actions, body for content
4. **Form IDs** - Use form IDs for submit buttons in footer
5. **Consistent buttons** - Use standard button styles from this guide
6. **Translations** - Always use i18next for text
7. **Loading states** - Disable buttons during async operations
8. **Accessibility** - Modals handle focus automatically

## Accessibility

The modal components handle:

- Focus trapping within modal
- ESC key to close
- Proper ARIA labels
- Screen reader announcements
- Keyboard navigation

## Notes

- The `Modal` component provides all features needed for modal dialogs
- All modals support dark/light themes automatically
- Backdrop blur is enabled for modern visual effect
- Z-index is set to 50 for proper layering
- Consistent design across all modal implementations
