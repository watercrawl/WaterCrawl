# Design System & Styling Guidelines

## Tailwind CSS

### Core Principle
**Always use Tailwind utility classes. Never write custom CSS unless absolutely necessary.**

## Color System

### Semantic Colors (Primary Palette)
WaterCrawl uses a semantic color system defined in `tailwind.config.mjs`:

```typescript
primary: {
  DEFAULT: 'hsl(var(--primary))',           // Primary brand color
  foreground: 'hsl(var(--primary-foreground))', // Text on primary
  hover: 'hsl(var(--primary-hover))',       // Hover state
  soft: 'hsl(var(--primary-soft))',         // Soft background
  strong: 'hsl(var(--primary-strong))',     // Strong emphasis
}
```

### Usage Guidelines

#### ✅ DO: Use Semantic Colors
```tsx
// Buttons
<button className="bg-primary text-primary-foreground hover:bg-primary-hover">

// Backgrounds
<div className="bg-primary-soft">

// Text
<span className="text-primary">

// Borders
<div className="border-primary">
```

#### ❌ DON'T: Use Numbered Variants
```tsx
// ❌ NEVER use these (removed from design system)
<div className="bg-primary-500">
<div className="text-primary-600">
<div className="border-primary-700">
```

### Complete Color Palette

```typescript
// Background & Foreground
background: 'hsl(var(--background))'
foreground: 'hsl(var(--foreground))'

// Card
card: 'hsl(var(--card))'
card-foreground: 'hsl(var(--card-foreground))'

// Popover
popover: 'hsl(var(--popover))'
popover-foreground: 'hsl(var(--popover-foreground))'

// Primary (brand color)
primary: 'hsl(var(--primary))'
primary-foreground: 'hsl(var(--primary-foreground))'
primary-hover: 'hsl(var(--primary-hover))'
primary-soft: 'hsl(var(--primary-soft))'
primary-strong: 'hsl(var(--primary-strong))'

// Secondary
secondary: 'hsl(var(--secondary))'
secondary-foreground: 'hsl(var(--secondary-foreground))'

// Muted (subtle backgrounds)
muted: 'hsl(var(--muted))'
muted-foreground: 'hsl(var(--muted-foreground))'

// Accent
accent: 'hsl(var(--accent))'
accent-foreground: 'hsl(var(--accent-foreground))'

// Destructive (errors, danger)
destructive: 'hsl(var(--destructive))'
destructive-foreground: 'hsl(var(--destructive-foreground))'

// Borders & Inputs
border: 'hsl(var(--border))'
input: 'hsl(var(--input))'
ring: 'hsl(var(--ring))'

// Semantic States
success: 'hsl(var(--success))'
success-foreground: 'hsl(var(--success-foreground))'
success-soft: 'hsl(var(--success-soft))'

warning: 'hsl(var(--warning))'
warning-foreground: 'hsl(var(--warning-foreground))'
warning-soft: 'hsl(var(--warning-soft))'

error: 'hsl(var(--error))'
error-foreground: 'hsl(var(--error-foreground))'
error-soft: 'hsl(var(--error-soft))'

info: 'hsl(var(--info))'
info-foreground: 'hsl(var(--info-foreground))'
info-soft: 'hsl(var(--info-soft))'
```

## Component Patterns

### Buttons

```tsx
// Primary Button
<button className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50">
  {text}
</button>

// Secondary Button
<button className="inline-flex items-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
  {text}
</button>

// Destructive Button
<button className="inline-flex items-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
  {text}
</button>
```

### Cards

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
      {title}
    </h3>
  </div>
  <div className="px-6 py-5">
    {/* Content */}
  </div>
</div>
```

### Form Inputs

```tsx
// Text Input
<input
  type="text"
  className="block w-full rounded-md border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
  placeholder={t('placeholder')}
/>

// Use Shared Input Component (Preferred)
import { Input } from '../shared/Input';

<Input
  type="text"
  value={value}
  onChange={onChange}
  placeholder={t('placeholder')}
/>
```

### Badges

```tsx
// Status Badge
<span className="inline-flex items-center rounded-md bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
  {status}
</span>

// Success Badge
<span className="inline-flex items-center rounded-md bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
  {status}
</span>

// Warning Badge
<span className="inline-flex items-center rounded-md bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">
  {status}
</span>
```

### Loading States

```tsx
// Spinner
<div className="flex items-center justify-center">
  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
</div>

// Use Shared Loading Component (Preferred)
import Loading from '../shared/Loading';

<Loading />
```

## Responsive Design

### Breakpoints
```typescript
sm: '640px'   // Small devices
md: '768px'   // Medium devices
lg: '1024px'  // Large devices
xl: '1280px'  // Extra large devices
2xl: '1536px' // 2X large devices
```

### Mobile-First Approach
```tsx
// ✅ Good - mobile first, then larger screens
<div className="w-full md:w-1/2 lg:w-1/3">

// ❌ Bad - desktop first
<div className="w-1/3 md:w-full">
```

## Spacing Scale

Use consistent spacing from Tailwind:
- `p-1` to `p-96` for padding
- `m-1` to `m-96` for margin
- `gap-1` to `gap-96` for flex/grid gaps

Common spacings:
- `p-4` / `px-4 py-4` - Standard padding
- `p-6` / `px-6 py-5` - Card padding
- `space-y-4` - Vertical spacing between elements
- `gap-x-3` - Horizontal gap in flex/grid

## Typography

### Text Sizes
```tsx
text-xs    // 12px - Fine print
text-sm    // 14px - Small text, labels
text-base  // 16px - Body text (default)
text-lg    // 18px - Larger body text
text-xl    // 20px - Section headers
text-2xl   // 24px - Page titles
```

### Font Weights
```tsx
font-normal  // 400 - Body text
font-medium  // 500 - Emphasis
font-semibold // 600 - Headings
font-bold    // 700 - Strong emphasis
```

### Text Colors
```tsx
text-foreground        // Primary text
text-muted-foreground  // Secondary text
text-primary           // Brand color text
text-destructive       // Error text
```

## Dark Mode Support

All colors automatically support dark mode through CSS variables. No need for `dark:` variants in most cases.

```tsx
// ✅ Automatic dark mode support
<div className="bg-card text-foreground">

// ❌ Avoid manual dark mode classes (unless necessary)
<div className="bg-white dark:bg-gray-900">
```

## Animation & Transitions

```tsx
// Hover transitions
transition-colors duration-200

// Fade in
transition-opacity duration-300

// Scale on hover
transform transition hover:scale-105
```

## Icons

### Heroicons (Primary)
```tsx
import { UserIcon } from '@heroicons/react/24/outline';

<UserIcon className="h-5 w-5 text-primary" />
```

### Lucide React (Alternative)
```tsx
import { User } from 'lucide-react';

<User className="h-5 w-5 text-primary" />
```

### Icon Sizes
- `h-4 w-4` - Small icons (16px)
- `h-5 w-5` - Standard icons (20px)
- `h-6 w-6` - Large icons (24px)
- `h-8 w-8` - Extra large icons (32px)

## Best Practices

1. **Use Shared Components** - Prefer `<Button>`, `<Input>`, `<Card>` over custom implementations
2. **Semantic Colors Only** - Never use numbered color variants
3. **Consistent Spacing** - Use Tailwind's spacing scale
4. **Mobile First** - Design for mobile, enhance for desktop
5. **Accessible** - Always consider keyboard navigation and screen readers
6. **Theme Aware** - Colors adapt to light/dark mode automatically
